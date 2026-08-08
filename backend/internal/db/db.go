// Package db menangani koneksi database MySQL.
package db

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"

	"dynamic-portofolio/backend/internal/config"
)

// Connect membuka koneksi MySQL berdasarkan config, dipanggil sekali di main.go.
func Connect(cfg config.Config) (*sql.DB, error) {
	tlsParam := "false"
	if cfg.DBUseTLS {
		tlsParam = "skip-verify"
	}
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&tls=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, tlsParam)

	conn, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	conn.SetConnMaxLifetime(time.Minute * 3)
	return conn, nil
}
