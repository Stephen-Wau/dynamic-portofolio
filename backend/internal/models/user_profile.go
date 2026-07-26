package models

import "database/sql"

// UserProfile data profil 1-1 milik satu user (user_id unique, FK ke users.id).
type UserProfile struct {
	ID       int64  `json:"id"`
	UserID   int64  `json:"user_id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	WaNumber string `json:"wa_number"`
	Linkedin string `json:"linkedin"`
	Github   string `json:"github"`
	City     string `json:"city"`
	AboutMe  string `json:"about_me"`
}

// GetProfileByUserID ambil profil milik user. Return sql.ErrNoRows kalau belum pernah diisi.
func GetProfileByUserID(db *sql.DB, userID int64) (*UserProfile, error) {
	row := db.QueryRow(
		"SELECT id, user_id, full_name, email, wa_number, linkedin, github, city, about_me FROM user_profiles WHERE user_id = ?",
		userID,
	)

	var (
		p                                                          UserProfile
		fullName, email, waNumber, linkedin, github, city, aboutMe sql.NullString
	)
	if err := row.Scan(&p.ID, &p.UserID, &fullName, &email, &waNumber, &linkedin, &github, &city, &aboutMe); err != nil {
		return nil, err
	}

	p.FullName = fullName.String
	p.Email = email.String
	p.WaNumber = waNumber.String
	p.Linkedin = linkedin.String
	p.Github = github.String
	p.City = city.String
	p.AboutMe = aboutMe.String
	return &p, nil
}

// UpsertProfile bikin baru kalau belum ada, update kalau sudah ada (satu user cuma 1 baris).
// Field kosong disimpan sebagai NULL, bukan string kosong.
func UpsertProfile(db *sql.DB, p UserProfile) error {
	_, err := db.Exec(
		`INSERT INTO user_profiles (user_id, full_name, email, wa_number, linkedin, github, city, about_me)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   full_name = VALUES(full_name),
		   email = VALUES(email),
		   wa_number = VALUES(wa_number),
		   linkedin = VALUES(linkedin),
		   github = VALUES(github),
		   city = VALUES(city),
		   about_me = VALUES(about_me)`,
		p.UserID,
		nullIfEmpty(p.FullName), nullIfEmpty(p.Email), nullIfEmpty(p.WaNumber),
		nullIfEmpty(p.Linkedin), nullIfEmpty(p.Github), nullIfEmpty(p.City), nullIfEmpty(p.AboutMe),
	)
	return err
}

// nullIfEmpty ubah string kosong jadi SQL NULL, dipakai UpsertProfile buat semua field opsional.
func nullIfEmpty(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}
