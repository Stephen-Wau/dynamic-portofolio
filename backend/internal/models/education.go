package models

import (
	"database/sql"
	"fmt"

	"dynamic-portofolio/backend/internal/listquery"
)

// educationSortColumns whitelist kolom yang boleh dipakai buat ORDER BY dari query param sort_by.
// WAJIB pakai whitelist ini, jangan pernah interpolate sort_by mentah-mentah ke SQL (SQL injection).
var educationSortColumns = map[string]string{
	"place":      "place",
	"major":      "major",
	"start_date": "start_date",
}

// Education satu entri riwayat pendidikan milik user.
type Education struct {
	ID        int64   `json:"id"`
	UserID    int64   `json:"user_id"`
	Place     string  `json:"place"`
	Major     string  `json:"major"`
	StartDate string  `json:"start_date"` // format "YYYY-MM"
	EndDate   *string `json:"end_date"`   // nil = masih berlangsung
}

// ListEducationsByUser ambil riwayat pendidikan user (dengan search/sort/pagination dari
// listquery.Params), plus total baris yang match filter (buat listquery.Meta, sebelum LIMIT).
func ListEducationsByUser(db *sql.DB, userID int64, params listquery.Params) ([]Education, int, error) {
	whereClause := " WHERE user_id = ?"
	args := []interface{}{userID}

	// searchword dicari di place ATAU major (dua-duanya kolom teks bebas yang relevan buat dicari).
	if params.SearchWord != "" {
		whereClause += " AND (place LIKE ? OR major LIKE ?)"
		args = append(args, "%"+params.SearchWord+"%", "%"+params.SearchWord+"%")
	}

	var total int
	if err := db.QueryRow("SELECT COUNT(*) FROM educations"+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	sortCol := params.SortColumn(educationSortColumns, "start_date")
	query := "SELECT id, user_id, place, major, start_date, end_date FROM educations" + whereClause +
		fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortCol, params.SortDirSQL())
	args = append(args, params.PerPage, params.Offset())

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	educations := []Education{}
	for rows.Next() {
		var (
			e                  Education
			place, major       sql.NullString
			startDate, endDate sql.NullString
		)
		if err := rows.Scan(&e.ID, &e.UserID, &place, &major, &startDate, &endDate); err != nil {
			return nil, 0, err
		}
		e.Place = place.String
		e.Major = major.String
		e.StartDate = toMonth(startDate.String)
		if endDate.Valid && endDate.String != "" {
			m := toMonth(endDate.String)
			e.EndDate = &m
		}
		educations = append(educations, e)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return educations, total, nil
}

// CreateEducation simpan riwayat pendidikan baru.
func CreateEducation(db *sql.DB, e Education) (int64, error) {
	res, err := db.Exec(
		"INSERT INTO educations (user_id, place, major, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
		e.UserID, e.Place, e.Major, toDate(e.StartDate), endDateValue(e.EndDate),
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// UpdateEducation ubah data riwayat pendidikan. WHERE id=? AND user_id=? sekaligus jadi ownership
// check: kalau id itu bukan milik user ini, 0 baris keupdate (gak error, tapi juga gak ngubah apa-apa).
func UpdateEducation(db *sql.DB, e Education) error {
	_, err := db.Exec(
		"UPDATE educations SET place = ?, major = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?",
		e.Place, e.Major, toDate(e.StartDate), endDateValue(e.EndDate), e.ID, e.UserID,
	)
	return err
}

// DeleteEducation hapus riwayat pendidikan milik user. WHERE id=? AND user_id=? mencegah user
// hapus riwayat pendidikan milik user lain.
func DeleteEducation(db *sql.DB, id, userID int64) error {
	_, err := db.Exec("DELETE FROM educations WHERE id = ? AND user_id = ?", id, userID)
	return err
}

// EducationHasOverlap cek apakah rentang [startDate,endDate] tabrakan sama riwayat pendidikan
// user lain yang sudah ada. excludeID dipakai saat update supaya baris yang sedang diedit gak
// dibandingkan sama dirinya sendiri (kalau tidak, riwayat itu selalu "overlap" dengan tanggalnya sendiri).
//
// Rumus overlap dua rentang [s1,e1] & [s2,e2]: overlap kalau s1 <= e2 DAN s2 <= e1.
// Di sini s1/e1 = rentang baru yang mau disimpan, s2/e2 = tiap rentang existing dari DB.
// noEnd/monthIndex/toMonth dipakai bareng dari work_history.go (satu package models).
func EducationHasOverlap(db *sql.DB, userID int64, startDate string, endDate *string, excludeID int64) (bool, error) {
	// Ambil semua riwayat pendidikan user ini SELAIN baris yang lagi diedit (excludeID).
	rows, err := db.Query(
		"SELECT start_date, end_date FROM educations WHERE user_id = ? AND id != ?",
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
