package auth

import (
	"context"
	"net/http"
	"strings"
)

// contextKey menghindari collision key di context.Context.
type contextKey string

const claimsContextKey contextKey = "claims"

// RequireAuth membungkus handler, menolak request tanpa/berisi JWT tidak valid dengan 401.
func RequireAuth(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		tokenString := strings.TrimPrefix(header, "Bearer ")
		if tokenString == "" || tokenString == header {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := ParseToken(secret, tokenString)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next(w, r.WithContext(ctx))
	}
}

// ClaimsFromContext mengambil claims user yang sudah divalidasi RequireAuth.
func ClaimsFromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*Claims)
	return claims, ok
}
