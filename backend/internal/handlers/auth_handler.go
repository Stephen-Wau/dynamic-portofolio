// Package handlers berisi HTTP handler untuk tiap endpoint API.
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/models"
)

// loginRequest bentuk body POST /api/auth/login.
type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// loginResponse dikirim balik ke FE setelah login sukses; token dipakai FE buat header Authorization.
type loginResponse struct {
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

// LoginHandler memvalidasi kredensial dan mengembalikan JWT. POST /api/auth/login.
func LoginHandler(db *sql.DB, jwtSecret string, jwtExpiryHours int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		user, err := models.GetUserByUsername(db, req.Username)
		if err != nil {
			http.Error(w, "invalid username or password", http.StatusUnauthorized)
			return
		}
		if !auth.CheckPassword(user.PasswordHash, req.Password) {
			http.Error(w, "invalid username or password", http.StatusUnauthorized)
			return
		}

		token, expiresAt, err := auth.GenerateToken(jwtSecret, jwtExpiryHours, user.ID, user.Username)
		if err != nil {
			http.Error(w, "failed to generate token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(loginResponse{
			Token:     token,
			ExpiresAt: expiresAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}
}

// MeHandler mengembalikan identitas user dari token, dipakai FE untuk validasi sesi. GET /api/auth/me.
func MeHandler(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":       claims.UserID,
		"username": claims.Username,
	})
}
