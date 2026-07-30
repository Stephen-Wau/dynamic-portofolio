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

// userSkillRequest bentuk body request create/update, dipetakan manual ke models.UserSkill
// (user_id sengaja gak ada di sini, selalu diambil dari JWT bukan dari body).
type userSkillRequest struct {
	Title string `json:"title"`
	Type  string `json:"type"`
}

// allowedSkillTypes whitelist nilai "type" yang valid — hardcode 3 kategori sesuai permintaan,
// bukan dari tabel/config terpisah karena kategorinya emang fix gak akan sering berubah.
var allowedSkillTypes = map[string]bool{
	"soft_skill":     true,
	"hard_skill":     true,
	"software_skill": true,
}

// UserSkillsHandler menangani GET (list) & POST (create) di /api/user-skills.
func UserSkillsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		switch r.Method {
		case http.MethodGet:
			listUserSkills(w, r, db, claims.UserID)
		case http.MethodPost:
			createUserSkill(w, r, db, claims.UserID)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// UserSkillHandler menangani PUT (update) & DELETE di /api/user-skills/{id}.
func UserSkillHandler(db *sql.DB) http.HandlerFunc {
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
			updateUserSkill(w, r, db, claims.UserID, id)
		case http.MethodDelete:
			deleteUserSkill(w, db, claims.UserID, id)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// listUserSkills balikin skill milik user yang sedang login.
// Support ?searchword=...&sort_by=...&sort_dir=asc|desc&page=...&per_page=... lewat listquery.Parse
// (kontrak standar semua endpoint list yang FE-nya pakai DataTableComponent), dibungkus {data, meta}.
func listUserSkills(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	params := listquery.Parse(r)
	skills, total, err := models.ListUserSkillsByUser(db, userID, params)
	if err != nil {
		http.Error(w, "failed to load user skills", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listquery.ListResponse[models.UserSkill]{
		Data: skills,
		Meta: listquery.BuildMeta(params, total),
	})
}

// validateUserSkillRequest cek field wajib & whitelist type di server, terlepas dari validasi
// yang udah ada di FE — jaga-jaga kalau ada request yang gak lewat form (ex: hit API langsung).
// Balikin pesan error (bahasa Indonesia, siap ditampilkan ke user) atau "" kalau semua valid.
func validateUserSkillRequest(req userSkillRequest) string {
	if strings.TrimSpace(req.Title) == "" {
		return "Nama skill wajib diisi."
	}
	if !allowedSkillTypes[req.Type] {
		return "Tipe skill wajib diisi dan harus salah satu dari: soft_skill, hard_skill, software_skill."
	}
	return ""
}

// createUserSkill bikin skill baru. Ditolak (400) kalau field wajib kosong/invalid, atau (409)
// kalau user ini udah punya skill dengan title yang sama (uniqueness per user, bukan global).
func createUserSkill(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	var req userSkillRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateUserSkillRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	// excludeID=0 karena ini record baru, belum punya id buat di-exclude dari pengecekan.
	exists, err := models.UserSkillTitleExists(db, userID, req.Title, 0)
	if err != nil {
		http.Error(w, "failed to validate user skill", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Skill dengan nama ini sudah ada.", http.StatusConflict)
		return
	}

	s := models.UserSkill{UserID: userID, Title: req.Title, Type: req.Type}
	id, err := models.CreateUserSkill(db, s)
	if err != nil {
		http.Error(w, "failed to save user skill", http.StatusInternalServerError)
		return
	}
	s.ID = id

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

// updateUserSkill ubah skill yang sudah ada. Validasi sama seperti create (field wajib, lalu
// uniqueness) — uniqueness exclude dirinya sendiri (id), biar gak "nabrak diri sendiri" pas user
// save ulang tanpa ganti title.
func updateUserSkill(w http.ResponseWriter, r *http.Request, db *sql.DB, userID, id int64) {
	var req userSkillRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if msg := validateUserSkillRequest(req); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	exists, err := models.UserSkillTitleExists(db, userID, req.Title, id)
	if err != nil {
		http.Error(w, "failed to validate user skill", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Skill dengan nama ini sudah ada.", http.StatusConflict)
		return
	}

	s := models.UserSkill{ID: id, UserID: userID, Title: req.Title, Type: req.Type}
	// UpdateUserSkill juga meng-update ownership check (WHERE id=? AND user_id=?), jadi user
	// gak bisa update skill milik user lain walau tau id-nya.
	if err := models.UpdateUserSkill(db, s); err != nil {
		http.Error(w, "failed to update user skill", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// deleteUserSkill hapus skill, discoped ke userID biar user cuma bisa hapus skill miliknya sendiri.
func deleteUserSkill(w http.ResponseWriter, db *sql.DB, userID, id int64) {
	if err := models.DeleteUserSkill(db, id, userID); err != nil {
		http.Error(w, "failed to delete user skill", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
