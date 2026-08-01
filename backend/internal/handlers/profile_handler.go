package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/models"
)

type profileRequest struct {
	FullName string `json:"full_name"`
	Position string `json:"position"`
	Email    string `json:"email"`
	WaNumber string `json:"wa_number"`
	Linkedin string `json:"linkedin"`
	Github   string `json:"github"`
	City     string `json:"city"`
	AboutMe  string `json:"about_me"`
	Image    string `json:"image"`
}

// ProfileHandler menangani GET (ambil profil) & POST (simpan profil) untuk user yang sedang login.
// Satu path karena withCORS butuh menangkap preflight OPTIONS untuk semua method di path ini.
func ProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := auth.ClaimsFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		switch r.Method {
		case http.MethodGet:
			getProfile(w, db, claims.UserID)
		case http.MethodPost:
			saveProfile(w, r, db, claims.UserID)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// getProfile balikin profil, atau objek kosong (200) kalau user belum pernah isi.
func getProfile(w http.ResponseWriter, db *sql.DB, userID int64) {
	profile, err := models.GetProfileByUserID(db, userID)
	if err == sql.ErrNoRows {
		profile = &models.UserProfile{UserID: userID}
	} else if err != nil {
		http.Error(w, "failed to load profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// saveProfile upsert profil milik user yang sedang login (user_id selalu dari JWT, bukan body).
func saveProfile(w http.ResponseWriter, r *http.Request, db *sql.DB, userID int64) {
	var req profileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Position) == "" {
		http.Error(w, "Posisi wajib diisi.", http.StatusBadRequest)
		return
	}

	profile := models.UserProfile{
		UserID:   userID,
		FullName: req.FullName,
		Position: req.Position,
		Email:    req.Email,
		WaNumber: req.WaNumber,
		Linkedin: req.Linkedin,
		Github:   req.Github,
		City:     req.City,
		AboutMe:  req.AboutMe,
		Image:    req.Image,
	}

	if err := models.UpsertProfile(db, profile); err != nil {
		http.Error(w, "failed to save profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}
