package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/listquery"
	"dynamic-portofolio/backend/internal/models"
)

// workHistoryRequest bentuk body request create/update, dipetakan manual ke models.WorkHistory
// (user_id sengaja gak ada di sini, selalu diambil dari JWT bukan dari body).
type workHistoryRequest struct {
	CompanyName string   `json:"company_name"`
	Position    string   `json:"position"`
	StartDate   string   `json:"start_date"`
	EndDate     *string  `json:"end_date"`
	Points      []string `json:"points"`
}

// monthPattern format tanggal yang diterima dari FE: "YYYY-MM" (input type="month").
var monthPattern = regexp.MustCompile(`^\d{4}-\d{2}$`)

// WorkHistoriesHandler menangani GET (list) & POST (create) di /api/work-histories.
func WorkHistoriesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		switch r.Method {
		case http.MethodGet:
			listWorkHistories(w, r, db, claims.UserID)
		case http.MethodPost:
			createWorkHistory(w, r, db, claims.UserID)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// WorkHistoryHandler menangani PUT (update) & DELETE di /api/work-histories/{id}.
func WorkHistoryHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		// {id} datang dari path (Go 1.22+ ServeMux pattern), bukan dari body — dipakai buat
		// nentuin baris mana yang diupdate/dihapus.
		id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodPut:
			updateWorkHistory(w, r, db, claims.UserID, id)
		case http.MethodDelete:
			deleteWorkHistory(w, db, claims.UserID, id)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// listWorkHistories balikin riwayat kerja milik user yang sedang login, lengkap dengan poin-poinnya.
// Support ?searchword=...&sort_by=...&sort_dir=asc|desc&page=...&per_page=... lewat listquery.Parse
// (kontrak standar semua endpoint list yang FE-nya pakai DataTableComponent), dibungkus {data, meta}.
func listWorkHistories(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	params := listquery.Parse(r)
	histories, total, err := models.ListWorkHistoriesByUser(db, userID, params)
	if err != nil {
		http.Error(w, "failed to load work histories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listquery.ListResponse[models.WorkHistory]{
		Data: histories,
		Meta: listquery.BuildMeta(params, total),
	})
}

// validateWorkHistoryRequest cek field wajib & format tanggal di server, terlepas dari validasi
// yang udah ada di FE — jaga-jaga kalau ada request yang gak lewat form (ex: hit API langsung),
// biar data yang gak valid tetap ketolak sebelum nyampe ke database.
// Balikin pesan error (bahasa Indonesia, siap ditampilkan ke user) atau "" kalau semua valid.
func validateWorkHistoryRequest(req workHistoryRequest) string {
	if strings.TrimSpace(req.CompanyName) == "" {
		return "Nama kantor / tempat bekerja wajib diisi."
	}
	if strings.TrimSpace(req.Position) == "" {
		return "Posisi wajib diisi."
	}
	if !monthPattern.MatchString(req.StartDate) {
		return "Tanggal mulai wajib diisi."
	}
	if req.EndDate != nil && *req.EndDate != "" {
		if !monthPattern.MatchString(*req.EndDate) {
			return "Format tanggal selesai tidak valid."
		}
		// Perbandingan string langsung valid buat format "YYYY-MM" (zero-padded), gak perlu parsing tanggal.
		if req.StartDate > *req.EndDate {
			return "Tanggal selesai tidak boleh sebelum tanggal mulai."
		}
	}

	hasPoint := false
	for _, p := range req.Points {
		if strings.TrimSpace(p) != "" {
			hasPoint = true
			break
		}
	}
	if !hasPoint {
		return "Minimal harus ada 1 poin pekerjaan."
	}
	return ""
}

// createWorkHistory bikin riwayat kerja baru. Ditolak (400) kalau ada field wajib yang kosong/invalid,
// atau (409) kalau rentang tanggalnya tumpang tindih sama riwayat kerja lain milik user yang sama.
func createWorkHistory(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	var req workHistoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateWorkHistoryRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	// excludeID=0 karena ini record baru, belum punya id buat di-exclude dari pengecekan.
	overlap, err := models.WorkHistoryHasOverlap(db, userID, req.StartDate, req.EndDate, 0)
	if err != nil {
		http.Error(w, "failed to validate work history", http.StatusInternalServerError)
		return
	}
	if overlap {
		http.Error(w, "Tanggal tumpang tindih dengan riwayat kerja lain.", http.StatusConflict)
		return
	}

	wh := models.WorkHistory{
		UserID:      userID,
		CompanyName: req.CompanyName,
		Position:    req.Position,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Points:      req.Points,
	}
	id, err := models.CreateWorkHistory(db, wh)
	if err != nil {
		http.Error(w, "failed to save work history", http.StatusInternalServerError)
		return
	}
	wh.ID = id

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wh)
}

// updateWorkHistory ubah riwayat kerja yang sudah ada. Validasi sama seperti create (field wajib,
// lalu overlap) — overlap exclude dirinya sendiri (id), biar gak "nabrak diri sendiri" pas user
// save ulang tanpa ganti tanggal.
func updateWorkHistory(w http.ResponseWriter, r *http.Request, db *sql.DB, userID, id int64) {
	var req workHistoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateWorkHistoryRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	overlap, err := models.WorkHistoryHasOverlap(db, userID, req.StartDate, req.EndDate, id)
	if err != nil {
		http.Error(w, "failed to validate work history", http.StatusInternalServerError)
		return
	}
	if overlap {
		http.Error(w, "Tanggal tumpang tindih dengan riwayat kerja lain.", http.StatusConflict)
		return
	}

	wh := models.WorkHistory{
		ID:          id,
		UserID:      userID,
		CompanyName: req.CompanyName,
		Position:    req.Position,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Points:      req.Points,
	}
	// UpdateWorkHistory juga meng-update ownership check (WHERE id=? AND user_id=?), jadi
	// user gak bisa update riwayat kerja milik user lain walau tau id-nya.
	if err := models.UpdateWorkHistory(db, wh); err != nil {
		http.Error(w, "failed to update work history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wh)
}

// deleteWorkHistory hapus riwayat kerja (poin-poinnya ikut kehapus lewat ON DELETE CASCADE di DB),
// discoped ke userID biar user cuma bisa hapus riwayat kerja miliknya sendiri.
func deleteWorkHistory(w http.ResponseWriter, db *sql.DB, userID, id int64) {
	if err := models.DeleteWorkHistory(db, id, userID); err != nil {
		http.Error(w, "failed to delete work history", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
