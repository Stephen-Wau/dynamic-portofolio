package models

import "database/sql"

// AppSetting satu baris key-value setting global aplikasi (bukan per-user) — ex: user mana yang
// lagi ditampilkan di landing page publik. Tabel ini generic (setting_key/setting_value) biar
// setting baru ke depannya tinggal nambah row, gak perlu migration baru tiap kali.

// GetSetting ambil value setting berdasarkan key. Balikin ("", nil) kalau belum pernah di-set
// (bukan error, karena wajar kalau setting-nya belum ada nilainya).
func GetSetting(db *sql.DB, key string) (string, error) {
	var value sql.NullString
	err := db.QueryRow("SELECT setting_value FROM app_settings WHERE setting_key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return value.String, nil
}

// SetSetting simpan/update value setting (upsert berdasarkan setting_key yang UNIQUE).
func SetSetting(db *sql.DB, key, value string) error {
	_, err := db.Exec(
		`INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
		 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
		key, value,
	)
	return err
}
