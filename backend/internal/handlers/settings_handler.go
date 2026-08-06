package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"dynamic-portofolio/backend/internal/models"
)

// featuredUserSettingKey key di tabel app_settings buat nyimpen id user yang lagi ditampilkan
// di landing page publik.
const featuredUserSettingKey = "featured_user_id"
const activeLandingPageSettingKey = "active_landing_page"
const landingPage1 = "landing_page_1"
const landingPage2 = "landing_page_2"
const landingPage3 = "landing_page_3"

// SettingsUsersHandler menangani GET /api/settings/users — daftar semua user buat card picker.
func SettingsUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		users, err := models.ListAllUsers(db)
		if err != nil {
			http.Error(w, "failed to load users", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	}
}

// featuredUserResponse bentuk response GET/PUT featured user setting.
type featuredUserResponse struct {
	UserID *int64 `json:"user_id"`
}

// SettingsFeaturedUserHandler menangani GET (baca) & PUT (set) user mana yang lagi ditampilkan
// di landing page publik, disimpan di app_settings lewat key featuredUserSettingKey.
func SettingsFeaturedUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getFeaturedUser(w, db)
		case http.MethodPut:
			setFeaturedUser(w, r, db)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

type landingPageOption struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Preview     string `json:"preview"`
}

type activeLandingPageResponse struct {
	ActiveLandingPage string              `json:"active_landing_page"`
	Options           []landingPageOption `json:"options"`
}

// SettingsActiveLandingPageHandler menangani GET/PUT active landing page yang dipakai publik.
func SettingsActiveLandingPageHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getActiveLandingPage(w, db)
		case http.MethodPut:
			setActiveLandingPage(w, r, db)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// getFeaturedUser balikin {"user_id": null} kalau belum pernah di-set.
func getFeaturedUser(w http.ResponseWriter, db *sql.DB) {
	value, err := models.GetSetting(db, featuredUserSettingKey)
	if err != nil {
		http.Error(w, "failed to load setting", http.StatusInternalServerError)
		return
	}

	resp := featuredUserResponse{}
	if value != "" {
		id, err := strconv.ParseInt(value, 10, 64)
		if err == nil {
			resp.UserID = &id
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// setFeaturedUser simpan user_id yang dipilih. Ditolak (400) kalau body invalid, atau (404)
// kalau user_id yang dikirim gak ada di tabel users.
func setFeaturedUser(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var req struct {
		UserID int64 `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == 0 {
		http.Error(w, "user_id wajib diisi.", http.StatusBadRequest)
		return
	}

	users, err := models.ListAllUsers(db)
	if err != nil {
		http.Error(w, "failed to validate user", http.StatusInternalServerError)
		return
	}
	found := false
	for _, u := range users {
		if u.ID == req.UserID {
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "User tidak ditemukan.", http.StatusNotFound)
		return
	}

	if err := models.SetSetting(db, featuredUserSettingKey, strconv.FormatInt(req.UserID, 10)); err != nil {
		http.Error(w, "failed to save setting", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(featuredUserResponse{UserID: &req.UserID})
}

func availableLandingPageOptions() []landingPageOption {
	return []landingPageOption{
		{
			ID:          landingPage1,
			Name:        "Landing Page 1",
			Description: "Landing page editorial dengan glassmorphism, glow background, dan section portfolio lengkap.",
			Preview:     "Mode landing pertama yang mengambil featured user dari settings.",
		},
		{
			ID:          landingPage2,
			Name:        "Landing Page 2",
			Description: "Tema ungu-hitam gradien dengan orbit badge berputar, tilt 3D, marquee, dan animated counter.",
			Preview:     "Mode landing kedua, lebih hidup & profesional dengan banyak efek animasi.",
		},
		{
			ID:          landingPage3,
			Name:        "Landing Page 3",
			Description: "Tema biru cerah gradien, model navigasi app-like (klik nav ganti konten tanpa scroll) dengan animasi Lottie.",
			Preview:     "Mode landing ketiga, nuansa dashboard backend engineering yang interaktif.",
		},
	}
}

func getActiveLandingPage(w http.ResponseWriter, db *sql.DB) {
	value, err := models.GetSetting(db, activeLandingPageSettingKey)
	if err != nil {
		http.Error(w, "failed to load setting", http.StatusInternalServerError)
		return
	}
	if value == "" {
		value = landingPage1
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activeLandingPageResponse{
		ActiveLandingPage: value,
		Options:           availableLandingPageOptions(),
	})
}

func setActiveLandingPage(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var req struct {
		ActiveLandingPage string `json:"active_landing_page"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ActiveLandingPage == "" {
		http.Error(w, "active_landing_page wajib diisi.", http.StatusBadRequest)
		return
	}

	valid := false
	for _, option := range availableLandingPageOptions() {
		if option.ID == req.ActiveLandingPage {
			valid = true
			break
		}
	}
	if !valid {
		http.Error(w, "Landing page tidak valid.", http.StatusBadRequest)
		return
	}

	if err := models.SetSetting(db, activeLandingPageSettingKey, req.ActiveLandingPage); err != nil {
		http.Error(w, "failed to save setting", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activeLandingPageResponse{
		ActiveLandingPage: req.ActiveLandingPage,
		Options:           availableLandingPageOptions(),
	})
}
