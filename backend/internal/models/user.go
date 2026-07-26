// Package models berisi struct data & query database.
package models

import "database/sql"

// User merepresentasikan baris tabel users.
type User struct {
	ID           int64
	Username     string
	PasswordHash string
}

// GetUserByUsername mencari user berdasarkan username, dipakai saat login.
// Return sql.ErrNoRows kalau tidak ditemukan.
func GetUserByUsername(db *sql.DB, username string) (*User, error) {
	row := db.QueryRow("SELECT id, username, password_hash FROM users WHERE username = ?", username)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash); err != nil {
		return nil, err
	}
	return &u, nil
}
