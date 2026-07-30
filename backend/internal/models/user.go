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

// UserSummary ringkasan user + profil buat ditampilin sebagai card di menu Settings (pilih user
// mana yang mau ditampilkan di landing page publik) — bukan struct lengkap User/UserProfile
// karena cuma butuh info identitas visual, gak perlu password_hash/email/dll.
type UserSummary struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Image    string `json:"image"`
}

// ListAllUsers ambil semua user beserta full_name & foto profilnya (LEFT JOIN, karena profil
// bisa aja belum pernah diisi), diurutkan by username.
func ListAllUsers(db *sql.DB) ([]UserSummary, error) {
	rows, err := db.Query(`
		SELECT u.id, u.username, p.full_name, p.image
		FROM users u
		LEFT JOIN user_profiles p ON p.user_id = u.id
		ORDER BY u.username ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []UserSummary{}
	for rows.Next() {
		var (
			u                  UserSummary
			fullName, imageURL sql.NullString
		)
		if err := rows.Scan(&u.ID, &u.Username, &fullName, &imageURL); err != nil {
			return nil, err
		}
		u.FullName = fullName.String
		u.Image = imageURL.String
		users = append(users, u)
	}
	return users, rows.Err()
}
