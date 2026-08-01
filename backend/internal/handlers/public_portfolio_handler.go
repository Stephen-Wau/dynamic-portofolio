package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"dynamic-portofolio/backend/internal/listquery"
	"dynamic-portofolio/backend/internal/models"
)

// publicPortfolioListParams parameter list generik buat ambil "semua baris" (bukan paginated)
// pas nyusun data portofolio publik — urut dari yang paling baru, dibatasi maxPerPage (100)
// yang udah lebih dari cukup buat riwayat kerja/pendidikan/skill 1 orang.
func publicPortfolioListParams(sortBy string) listquery.Params {
	return listquery.Params{SortBy: sortBy, SortDir: "desc", Page: 1, PerPage: 100}
}

// publicPortfolioResponse bentuk data portofolio lengkap 1 user, dipakai landing page publik.
type publicPortfolioResponse struct {
	ActiveLandingPage string               `json:"active_landing_page"`
	Username      string               `json:"username"`
	Profile       *models.UserProfile  `json:"profile"`
	WorkHistories []models.WorkHistory `json:"work_histories"`
	Educations    []models.Education   `json:"educations"`
	Skills        []models.UserSkill   `json:"skills"`
}

// PublicPortfolioHandler menangani GET /api/public/portfolio — endpoint TANPA auth, dipakai
// landing page publik. Balikin data lengkap milik user yang lagi di-set sebagai "featured user"
// lewat menu Settings (app_settings key "featured_user_id").
func PublicPortfolioHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rawUserID, err := models.GetSetting(db, "featured_user_id")
		if err != nil {
			http.Error(w, "failed to load setting", http.StatusInternalServerError)
			return
		}
		if rawUserID == "" {
			http.Error(w, "Belum ada user yang dipilih untuk ditampilkan.", http.StatusNotFound)
			return
		}
		userID, err := strconv.ParseInt(rawUserID, 10, 64)
		if err != nil {
			http.Error(w, "invalid featured user setting", http.StatusInternalServerError)
			return
		}

		user, err := models.GetUserByID(db, userID)
		if err == sql.ErrNoRows {
			http.Error(w, "User yang dipilih tidak ditemukan.", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to load user", http.StatusInternalServerError)
			return
		}

		// Profil boleh belum pernah diisi (ErrNoRows) — bukan error, cuma berarti section
		// profile-nya kosong di landing page.
		profile, err := models.GetProfileByUserID(db, userID)
		if err != nil && err != sql.ErrNoRows {
			http.Error(w, "failed to load profile", http.StatusInternalServerError)
			return
		}

		workHistories, _, err := models.ListWorkHistoriesByUser(db, userID, publicPortfolioListParams("start_date"))
		if err != nil {
			http.Error(w, "failed to load work histories", http.StatusInternalServerError)
			return
		}

		educations, _, err := models.ListEducationsByUser(db, userID, publicPortfolioListParams("start_date"))
		if err != nil {
			http.Error(w, "failed to load educations", http.StatusInternalServerError)
			return
		}

		skills, _, err := models.ListUserSkillsByUser(db, userID, publicPortfolioListParams("title"))
		if err != nil {
			http.Error(w, "failed to load skills", http.StatusInternalServerError)
			return
		}

		activeLandingPage, err := models.GetSetting(db, "active_landing_page")
		if err != nil {
			http.Error(w, "failed to load landing page setting", http.StatusInternalServerError)
			return
		}
		if activeLandingPage == "" {
			activeLandingPage = "landing_page_1"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(publicPortfolioResponse{
			ActiveLandingPage: activeLandingPage,
			Username:      user.Username,
			Profile:       profile,
			WorkHistories: workHistories,
			Educations:    educations,
			Skills:        skills,
		})
	}
}
