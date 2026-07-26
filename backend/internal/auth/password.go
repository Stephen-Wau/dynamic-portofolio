// Package auth berisi helper password hashing dan JWT untuk login CMS.
package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword meng-hash password plaintext, dipakai saat seed/buat user baru.
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(hash), err
}

// CheckPassword membandingkan password plaintext dengan hash tersimpan, dipakai saat login.
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}
