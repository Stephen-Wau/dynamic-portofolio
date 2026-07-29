package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/listquery"
	"dynamic-portofolio/backend/internal/models"
)

// educationRequest bentuk body request create/update, dipetakan manual ke models.Education
// (user_id sengaja gak ada di sini, selalu diambil dari JWT bukan dari body).
type educationRequest struct {
	Place     string  `json:"place"`
	Major     string  `json:"major"`
	StartDate string  `json:"start_date"`
	EndDate   *string `json:"end_date"`
}

// EducationsHandler menangani GET (list) & POST (create) di /api/educations.
func EducationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		switch r.Method {
		case http.MethodGet:
			listEducations(w, r, db, claims.UserID)
		case http.MethodPost:
			createEducation(w, r, db, claims.UserID)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// EducationHandler menangani PUT (update) & DELETE di /api/educations/{id}.
func EducationHandler(db *sql.DB) http.HandlerFunc {
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
			updateEducation(w, r, db, claims.UserID, id)
		case http.MethodDelete:
			deleteEducation(w, db, claims.UserID, id)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// listEducations balikin riwayat pendidikan milik user yang sedang login.
// Support ?searchword=...&sort_by=...&sort_dir=asc|desc&page=...&per_page=... lewat listquery.Parse
// (kontrak standar semua endpoint list yang FE-nya pakai DataTableComponent), dibungkus {data, meta}.
func listEducations(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	params := listquery.Parse(r)
	educations, total, err := models.ListEducationsByUser(db, userID, params)
	if err != nil {
		http.Error(w, "failed to load educations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listquery.ListResponse[models.Education]{
		Data: educations,
		Meta: listquery.BuildMeta(params, total),
	})
}

// validateEducationRequest cek field wajib & format tanggal di server, terlepas dari validasi
// yang udah ada di FE — jaga-jaga kalau ada request yang gak lewat form (ex: hit API langsung),
// biar data yang gak valid tetap ketolak sebelum nyampe ke database.
// end_date boleh kosong (masih menempuh pendidikan sampai sekarang), field lain wajib.
// Balikin pesan error (bahasa Indonesia, siap ditampilkan ke user) atau "" kalau semua valid.
func validateEducationRequest(req educationRequest) string {
	if strings.TrimSpace(req.Place) == "" {
		return "Tempat pendidikan wajib diisi."
	}
	if strings.TrimSpace(req.Major) == "" {
		return "Jurusan wajib diisi."
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
	return ""
}

// createEducation bikin riwayat pendidikan baru. Ditolak (400) kalau ada field wajib yang kosong/invalid,
// atau (409) kalau rentang tanggalnya tumpang tindih sama riwayat pendidikan lain milik user yang sama.
func createEducation(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	var req educationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateEducationRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	// excludeID=0 karena ini record baru, belum punya id buat di-exclude dari pengecekan.
	overlap, err := models.EducationHasOverlap(db, userID, req.StartDate, req.EndDate, 0)
	if err != nil {
		http.Error(w, "failed to validate education", http.StatusInternalServerError)
		return
	}
	if overlap {
		http.Error(w, "Tanggal tumpang tindih dengan riwayat pendidikan lain.", http.StatusConflict)
		return
	}

	e := models.Education{
		UserID:    userID,
		Place:     req.Place,
		Major:     req.Major,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	id, err := models.CreateEducation(db, e)
	if err != nil {
		http.Error(w, "failed to save education", http.StatusInternalServerError)
		return
	}
	e.ID = id

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

// updateEducation ubah riwayat pendidikan yang sudah ada. Validasi sama seperti create (field wajib,
// lalu overlap) — overlap exclude dirinya sendiri (id), biar gak "nabrak diri sendiri" pas user
// save ulang tanpa ganti tanggal.
func updateEducation(w http.ResponseWriter, r *http.Request, db *sql.DB, userID, id int64) {
	var req educationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateEducationRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	overlap, err := models.EducationHasOverlap(db, userID, req.StartDate, req.EndDate, id)
	if err != nil {
		http.Error(w, "failed to validate education", http.StatusInternalServerError)
		return
	}
	if overlap {
		http.Error(w, "Tanggal tumpang tindih dengan riwayat pendidikan lain.", http.StatusConflict)
		return
	}

	e := models.Education{
		ID:        id,
		UserID:    userID,
		Place:     req.Place,
		Major:     req.Major,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	// UpdateEducation juga meng-update ownership check (WHERE id=? AND user_id=?), jadi
	// user gak bisa update riwayat pendidikan milik user lain walau tau id-nya.
	if err := models.UpdateEducation(db, e); err != nil {
		http.Error(w, "failed to update education", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(e)
}

// deleteEducation hapus riwayat pendidikan, discoped ke userID biar user cuma bisa hapus
// riwayat pendidikan miliknya sendiri.
func deleteEducation(w http.ResponseWriter, db *sql.DB, userID, id int64) {
	if err := models.DeleteEducation(db, id, userID); err != nil {
		http.Error(w, "failed to delete education", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
