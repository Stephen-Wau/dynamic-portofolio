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
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	conn, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	conn.SetConnMaxLifetime(time.Minute * 3)
	return conn, nil
}
