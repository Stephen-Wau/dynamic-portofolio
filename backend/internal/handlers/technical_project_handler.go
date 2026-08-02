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

// technicalProjectFileRequest satu file lampiran dari body request (base64 data URI, sama seperti
// user_profiles.image di FE).
type technicalProjectFileRequest struct {
	FileName string `json:"file_name"`
	FileData string `json:"file_data"`
}

// technicalProjectRequest bentuk body request create/update, dipetakan manual ke
// models.TechnicalProject (user_id sengaja gak ada di sini, selalu diambil dari JWT bukan dari body).
type technicalProjectRequest struct {
	NameProject      string                        `json:"name_project"`
	UserRole         string                        `json:"user_role"`
	Description      string                        `json:"description"`
	TechStack        string                        `json:"tech_stack"`
	KeyContributions []string                      `json:"key_contributions"`
	Files            []technicalProjectFileRequest `json:"files"`
}

// TechnicalProjectsHandler menangani GET (list) & POST (create) di /api/technical-projects.
func TechnicalProjectsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		switch r.Method {
		case http.MethodGet:
			listTechnicalProjects(w, r, db, claims.UserID)
		case http.MethodPost:
			createTechnicalProject(w, r, db, claims.UserID)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// TechnicalProjectHandler menangani PUT (update) & DELETE di /api/technical-projects/{id}.
func TechnicalProjectHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodPut:
			updateTechnicalProject(w, r, db, claims.UserID, id)
		case http.MethodDelete:
			deleteTechnicalProject(w, db, claims.UserID, id)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// listTechnicalProjects balikin technical project milik user yang sedang login, lengkap dengan
// key contribution & file lampirannya. Support ?searchword=...&sort_by=...&sort_dir=asc|desc&
// page=...&per_page=... lewat listquery.Parse (kontrak standar semua endpoint list yang FE-nya
// pakai DataTableComponent), dibungkus {data, meta}.
func listTechnicalProjects(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	params := listquery.Parse(r)
	projects, total, err := models.ListTechnicalProjectsByUser(db, userID, params)
	if err != nil {
		http.Error(w, "failed to load technical projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listquery.ListResponse[models.TechnicalProject]{
		Data: projects,
		Meta: listquery.BuildMeta(params, total),
	})
}

// validateTechnicalProjectRequest cek aturan wajib di server, terlepas dari validasi yang udah ada
// di FE — jaga-jaga kalau ada request yang gak lewat form (ex: hit API langsung).
// Semua kolom wajib diisi kecuali file lampiran (nullable, boleh 0). Kolom di DB tetap nullable
// (lihat migration) — ini murni aturan bisnis di level aplikasi, bukan constraint DB.
// Balikin pesan error (bahasa Indonesia, siap ditampilkan ke user) atau "" kalau valid.
func validateTechnicalProjectRequest(req technicalProjectRequest) string {
	if len(strings.TrimSpace(req.NameProject)) < 5 {
		return "Nama project wajib diisi, minimal 5 karakter."
	}
	if len(strings.TrimSpace(req.UserRole)) < 2 {
		return "Role wajib diisi, minimal 2 karakter."
	}
	if len(strings.TrimSpace(req.Description)) < 5 {
		return "Deskripsi wajib diisi, minimal 5 karakter."
	}
	if len(strings.TrimSpace(req.TechStack)) < 5 {
		return "Tech stack wajib diisi, minimal 5 karakter."
	}

	hasContribution := false
	for _, c := range req.KeyContributions {
		if strings.TrimSpace(c) != "" {
			hasContribution = true
			break
		}
	}
	if !hasContribution {
		return "Minimal harus ada 1 key contribution."
	}
	return ""
}

// toTechnicalProjectFiles petakan file dari body request ke models.TechnicalProjectFile.
func toTechnicalProjectFiles(files []technicalProjectFileRequest) []models.TechnicalProjectFile {
	result := make([]models.TechnicalProjectFile, 0, len(files))
	for _, f := range files {
		result = append(result, models.TechnicalProjectFile{FileName: f.FileName, FileData: f.FileData})
	}
	return result
}

// createTechnicalProject bikin technical project baru. Ditolak (400) kalau tidak ada key
// contribution yang diisi.
func createTechnicalProject(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	var req technicalProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateTechnicalProjectRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	p := models.TechnicalProject{
		UserID:           userID,
		NameProject:      req.NameProject,
		UserRole:         req.UserRole,
		Description:      req.Description,
		TechStack:        req.TechStack,
		KeyContributions: req.KeyContributions,
		Files:            toTechnicalProjectFiles(req.Files),
	}
	id, err := models.CreateTechnicalProject(db, p)
	if err != nil {
		http.Error(w, "failed to save technical project", http.StatusInternalServerError)
		return
	}
	p.ID = id

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// updateTechnicalProject ubah technical project yang sudah ada. Validasi sama seperti create
// (minimal 1 key contribution).
func updateTechnicalProject(w http.ResponseWriter, r *http.Request, db *sql.DB, userID, id int64) {
	var req technicalProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateTechnicalProjectRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	p := models.TechnicalProject{
		ID:               id,
		UserID:           userID,
		NameProject:      req.NameProject,
		UserRole:         req.UserRole,
		Description:      req.Description,
		TechStack:        req.TechStack,
		KeyContributions: req.KeyContributions,
		Files:            toTechnicalProjectFiles(req.Files),
	}
	// UpdateTechnicalProject juga meng-update ownership check (WHERE id=? AND user_id=?), jadi
	// user gak bisa update project milik user lain walau tau id-nya.
	if err := models.UpdateTechnicalProject(db, p); err != nil {
		http.Error(w, "failed to update technical project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// deleteTechnicalProject hapus technical project (key contribution & file ikut kehapus lewat
// ON DELETE CASCADE di DB), discoped ke userID biar user cuma bisa hapus project miliknya sendiri.
func deleteTechnicalProject(w http.ResponseWriter, db *sql.DB, userID, id int64) {
	if err := models.DeleteTechnicalProject(db, id, userID); err != nil {
		http.Error(w, "failed to delete technical project", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
