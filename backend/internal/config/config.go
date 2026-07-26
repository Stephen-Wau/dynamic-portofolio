// Package config membaca konfigurasi aplikasi dari environment variable.
package config

import "os"

// Config menyimpan semua nilai env yang dipakai aplikasi.
type Config struct {
	DBUser          string
	DBPassword      string
	DBHost          string
	DBPort          string
	DBName          string
	FrontendOrigin  string
	JWTSecret       string
	JWTExpiryHours  int
}

// Load membaca env var dengan fallback default, dipanggil sekali di main.go.
func Load() Config {
	return Config{
		DBUser:         getEnv("DB_USER", "root"),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBHost:         getEnv("DB_HOST", "127.0.0.1"),
		DBPort:         getEnv("DB_PORT", "3306"),
		DBName:         getEnv("DB_NAME", "dynamic_portofolio"),
		FrontendOrigin: getEnv("FRONTEND_ORIGIN", "http://localhost:4200"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		JWTExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 24),
	}
}

// getEnv mengambil env var, atau fallback kalau kosong.
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// getEnvInt sama seperti getEnv tapi untuk nilai integer (jam expiry token).
func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n := 0
	for _, c := range v {
		if c < '0' || c > '9' {
			return fallback
		}
		n = n*10 + int(c-'0')
	}
	return n
}
