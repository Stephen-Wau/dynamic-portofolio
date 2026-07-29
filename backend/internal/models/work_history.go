package models

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"dynamic-portofolio/backend/internal/listquery"
)

// workHistorySortColumns whitelist kolom yang boleh dipakai buat ORDER BY dari query param
// sort_by (FE ngirim `col.prop`) → nama kolom SQL asli. WAJIB pakai whitelist ini, jangan
// pernah interpolate sort_by mentah-mentah ke SQL (SQL injection).
var workHistorySortColumns = map[string]string{
	"company_name": "company_name",
	"start_date":   "start_date",
}

// WorkHistory satu entri riwayat kerja milik user, beserta poin-poin pekerjaannya.
type WorkHistory struct {
	ID          int64    `json:"id"`
	UserID      int64    `json:"user_id"`
	CompanyName string   `json:"company_name"`
	StartDate   string   `json:"start_date"` // format "YYYY-MM"
	EndDate     *string  `json:"end_date"`   // nil = masih berlangsung
	Points      []string `json:"points"`
}

// ListWorkHistoriesByUser ambil riwayat kerja user (dengan search/sort/pagination dari
// listquery.Params), plus total baris yang match filter (buat listquery.Meta, sebelum LIMIT).
func ListWorkHistoriesByUser(db *sql.DB, userID int64, params listquery.Params) ([]WorkHistory, int, error) {
	whereClause := " WHERE user_id = ?"
	args := []interface{}{userID}

	// searchword dicari di company_name aja (satu-satunya kolom teks bebas di tabel ini).
	if params.SearchWord != "" {
		whereClause += " AND company_name LIKE ?"
		args = append(args, "%"+params.SearchWord+"%")
	}

	var total int
	if err := db.QueryRow("SELECT COUNT(*) FROM work_histories"+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	sortCol := params.SortColumn(workHistorySortColumns, "start_date")
	query := "SELECT id, user_id, company_name, start_date, end_date FROM work_histories" + whereClause +
		fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortCol, params.SortDirSQL())
	args = append(args, params.PerPage, params.Offset())

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	histories := []WorkHistory{}
	ids := []int64{}
	for rows.Next() {
		var (
			wh                 WorkHistory
			companyName        sql.NullString
			startDate, endDate sql.NullString
		)
		if err := rows.Scan(&wh.ID, &wh.UserID, &companyName, &startDate, &endDate); err != nil {
			return nil, 0, err
		}
		wh.CompanyName = companyName.String
		wh.StartDate = toMonth(startDate.String)
		if endDate.Valid && endDate.String != "" {
			m := toMonth(endDate.String)
			wh.EndDate = &m
		}
		wh.Points = []string{}
		histories = append(histories, wh)
		ids = append(ids, wh.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Ambil poin-poin semua history sekaligus (1 query tambahan) dibanding query per-baris di loop,
	// biar gak N+1 query kalau riwayat kerjanya banyak.
	pointsByHistory, err := pointsForHistories(db, ids)
	if err != nil {
		return nil, 0, err
	}
	for i := range histories {
		histories[i].Points = pointsByHistory[histories[i].ID]
	}
	return histories, total, nil
}

// pointsForHistories ambil semua poin buat sekumpulan work_history id sekaligus (query pakai IN (...)),
// hasilnya di-group jadi map[work_history_id][]poin biar gampang ditempel balik ke masing-masing history.
func pointsForHistories(db *sql.DB, ids []int64) (map[int64][]string, error) {
	result := map[int64][]string{}
	if len(ids) == 0 {
		return result, nil
	}

	// Bangun placeholder "?,?,?..." sejumlah ids, karena database/sql gak bisa terima slice
	// langsung buat klausa IN (?).
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	rows, err := db.Query(
		fmt.Sprintf("SELECT work_history_id, point FROM work_history_points WHERE work_history_id IN (%s) ORDER BY id", strings.Join(placeholders, ",")),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var workHistoryID int64
		var point sql.NullString
		if err := rows.Scan(&workHistoryID, &point); err != nil {
			return nil, err
		}
		result[workHistoryID] = append(result[workHistoryID], point.String)
	}
	return result, rows.Err()
}

// CreateWorkHistory simpan work history baru + poin-poinnya dalam satu transaction
// (biar kalau insert poin gagal di tengah, insert work_histories-nya ikut di-rollback, gak nyisa data setengah jadi).
func CreateWorkHistory(db *sql.DB, wh WorkHistory) (int64, error) {
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		"INSERT INTO work_histories (user_id, company_name, start_date, end_date) VALUES (?, ?, ?, ?)",
		wh.UserID, wh.CompanyName, toDate(wh.StartDate), endDateValue(wh.EndDate),
	)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	if err := insertPoints(tx, id, wh.Points); err != nil {
		return 0, err
	}
	return id, tx.Commit()
}

// UpdateWorkHistory ubah data work history + replace semua poinnya.
// Strategi poin: hapus semua poin lama punya history ini, lalu insert ulang dari awal — lebih
// simple daripada diffing "poin mana yang berubah/ditambah/dihapus" satu-satu.
func UpdateWorkHistory(db *sql.DB, wh WorkHistory) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// WHERE id=? AND user_id=? sekaligus jadi ownership check: kalau id itu bukan milik
	// user ini, WHERE-nya gak match apapun, jadi 0 baris keupdate (gak error, tapi juga gak ngubah apa-apa).
	_, err = tx.Exec(
		"UPDATE work_histories SET company_name = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?",
		wh.CompanyName, toDate(wh.StartDate), endDateValue(wh.EndDate), wh.ID, wh.UserID,
	)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("DELETE FROM work_history_points WHERE work_history_id = ?", wh.ID); err != nil {
		return err
	}
	if err := insertPoints(tx, wh.ID, wh.Points); err != nil {
		return err
	}
	return tx.Commit()
}

// DeleteWorkHistory hapus work history milik user (poin ikut kehapus lewat ON DELETE CASCADE di DB).
// WHERE id=? AND user_id=? sama kayak UpdateWorkHistory: mencegah user hapus riwayat kerja milik user lain.
func DeleteWorkHistory(db *sql.DB, id, userID int64) error {
	_, err := db.Exec("DELETE FROM work_histories WHERE id = ? AND user_id = ?", id, userID)
	return err
}

// insertPoints insert semua poin (skip yang kosong/whitespace) buat satu work_history_id.
// Dipanggil di dalam transaction (tx), bukan *sql.DB langsung, biar ikut ke-rollback kalau ada yang gagal.
func insertPoints(tx *sql.Tx, workHistoryID int64, points []string) error {
	for _, p := range points {
		if strings.TrimSpace(p) == "" {
			continue
		}
		if _, err := tx.Exec("INSERT INTO work_history_points (work_history_id, point) VALUES (?, ?)", workHistoryID, p); err != nil {
			return err
		}
	}
	return nil
}

// noEnd merepresentasikan "masih berlangsung" (end_date nil) sebagai angka bulan yang sangat besar,
// supaya bisa dibandingkan pakai operator matematika biasa (<=) dengan angka bulan riwayat lain.
const noEnd = 1 << 30

// WorkHistoryHasOverlap cek apakah rentang [startDate,endDate] tabrakan sama riwayat kerja user lain
// yang sudah ada. excludeID dipakai saat update supaya baris yang sedang diedit gak dibandingkan
// sama dirinya sendiri (kalau tidak, riwayat itu selalu "overlap" dengan tanggalnya sendiri).
//
// Rumus overlap dua rentang [s1,e1] & [s2,e2]: overlap kalau s1 <= e2 DAN s2 <= e1.
// Di sini s1/e1 = rentang baru yang mau disimpan, s2/e2 = tiap rentang existing dari DB.
func WorkHistoryHasOverlap(db *sql.DB, userID int64, startDate string, endDate *string, excludeID int64) (bool, error) {
	// Ambil semua riwayat kerja user ini SELAIN baris yang lagi diedit (excludeID).
	rows, err := db.Query(
		"SELECT start_date, end_date FROM work_histories WHERE user_id = ? AND id != ?",
		userID, excludeID,
	)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	newStart := monthIndex(startDate)
	newEnd := noEnd
	if endDate != nil && *endDate != "" {
		newEnd = monthIndex(*endDate)
	}

	for rows.Next() {
		var start, end sql.NullString
		if err := rows.Scan(&start, &end); err != nil {
			return false, err
		}

		existingStart := monthIndex(toMonth(start.String))
		existingEnd := noEnd
		if end.Valid && end.String != "" {
			existingEnd = monthIndex(toMonth(end.String))
		}

		// newStart <= existingEnd && existingStart <= newEnd → dua rentang bersinggungan di
		// minimal satu bulan. Begitu ketemu satu yang overlap, langsung berhenti (gak perlu cek sisanya).
		if newStart <= existingEnd && existingStart <= newEnd {
			return true, nil
		}
	}
	return false, rows.Err()
}

// monthIndex ubah "YYYY-MM" jadi angka yang bisa dibandingkan (year*12+month), supaya perbandingan
// overlap bulan tinggal pakai operator angka biasa tanpa perlu parsing tanggal beneran.
func monthIndex(yyyymm string) int {
	parts := strings.Split(yyyymm, "-")
	if len(parts) != 2 {
		return 0
	}
	year, _ := strconv.Atoi(parts[0])
	month, _ := strconv.Atoi(parts[1])
	return year*12 + month
}

// toMonth potong "YYYY-MM-DD" (format asli dari kolom DATE di DB) jadi "YYYY-MM" (format yang dipakai FE,
// karena form cuma pilih bulan+tahun, gak ada tanggal harian).
func toMonth(date string) string {
	if len(date) >= 7 {
		return date[:7]
	}
	return date
}

// toDate lengkapi "YYYY-MM" (dari FE) jadi "YYYY-MM-01" (tanggal 1 di bulan itu) supaya valid
// disimpan sebagai kolom bertipe DATE di MySQL.
func toDate(month string) string {
	if len(month) == 7 {
		return month + "-01"
	}
	return month
}

// endDateValue ubah *string "YYYY-MM" (atau nil/kosong) jadi value yang siap dipakai sebagai parameter
// query: nil kalau masih berlangsung (supaya kolom end_date beneran NULL di DB, bukan string kosong).
func endDateValue(endMonth *string) interface{} {
	if endMonth == nil || *endMonth == "" {
		return nil
	}
	return toDate(*endMonth)
}
