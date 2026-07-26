// Command seed membuat satu admin user awal dengan kredensial hardcoded di bawah.
// Jalankan: go run ./cmd/seed
package main

import (
	"log"

	"github.com/joho/godotenv"

	"dynamic-portofolio/backend/internal/auth"
	"dynamic-portofolio/backend/internal/config"
	"dynamic-portofolio/backend/internal/db"
)

const (
	adminUsername = "stephen.wau"
	adminPassword = "password123"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	conn, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer conn.Close()

	hash, err := auth.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	_, err = conn.Exec(
		"INSERT INTO users (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
		adminUsername, hash,
	)
	if err != nil {
		log.Fatalf("failed to seed admin user: %v", err)
	}

	log.Printf("admin user %q ready", adminUsername)
}
