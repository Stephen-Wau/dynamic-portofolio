package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/config"
	"dynamic-portofolio/backend/internal/db"
	"dynamic-portofolio/backend/internal/handlers"
)

type healthResponse struct {
	API      string `json:"api"`
	Database string `json:"database"`
}

// withCORS membungkus handler dengan header CORS & menangani preflight OPTIONS.
func withCORS(frontendOrigin string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", frontendOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	conn, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer conn.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("/health", withCORS(cfg.FrontendOrigin, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := healthResponse{API: "ok"}
		if err := conn.Ping(); err != nil {
			resp.Database = "down"
		} else {
			resp.Database = "ok"
		}
		json.NewEncoder(w).Encode(resp)
	}))

	mux.HandleFunc("/api/auth/login", withCORS(cfg.FrontendOrigin,
		handlers.LoginHandler(conn, cfg.JWTSecret, cfg.JWTExpiryHours)))

	// Endpoint publik (TANPA auth) dipakai landing page portofolio.
	mux.HandleFunc("/api/public/portfolio", withCORS(cfg.FrontendOrigin,
		handlers.PublicPortfolioHandler(conn)))

	mux.HandleFunc("/api/auth/me", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.MeHandler)))

	mux.HandleFunc("/api/profile", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.ProfileHandler(conn))))

	mux.HandleFunc("/api/work-histories", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.WorkHistoriesHandler(conn))))

	mux.HandleFunc("/api/work-histories/{id}", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.WorkHistoryHandler(conn))))

	mux.HandleFunc("/api/educations", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.EducationsHandler(conn))))

	mux.HandleFunc("/api/educations/{id}", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.EducationHandler(conn))))

	mux.HandleFunc("/api/user-skills", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.UserSkillsHandler(conn))))

	mux.HandleFunc("/api/user-skills/{id}", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.UserSkillHandler(conn))))

	mux.HandleFunc("/api/technical-projects", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.TechnicalProjectsHandler(conn))))

	mux.HandleFunc("/api/technical-projects/{id}", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.TechnicalProjectHandler(conn))))

	mux.HandleFunc("/api/settings/users", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.SettingsUsersHandler(conn))))

	mux.HandleFunc("/api/settings/featured-user", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.SettingsFeaturedUserHandler(conn))))

	mux.HandleFunc("/api/settings/active-landing-page", withCORS(cfg.FrontendOrigin,
		auth.RequireAuth(cfg.JWTSecret, handlers.SettingsActiveLandingPageHandler(conn))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := "0.0.0.0:" + port
	log.Printf("server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
