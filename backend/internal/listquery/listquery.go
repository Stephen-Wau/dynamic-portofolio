// Package listquery menyeragamkan cara parse query param search & sort buat semua endpoint
// list yang FE-nya pakai DataTableComponent (search box + klik header buat sort).
// Kontrak param standar: ?searchword=...&sort_by=...&sort_dir=asc|desc
package listquery

import (
	"net/http"
	"strings"
)

// Params hasil parse query string, siap dipakai model buat bangun WHERE/ORDER BY.
type Params struct {
	SearchWord string
	SortBy     string
	SortDir    string // selalu "asc" atau "desc", default "asc" kalau kosong/invalid
}

// Parse ambil searchword/sort_by/sort_dir dari request. Dipanggil di awal tiap handler list.
func Parse(r *http.Request) Params {
	q := r.URL.Query()

	dir := strings.ToLower(strings.TrimSpace(q.Get("sort_dir")))
	if dir != "asc" && dir != "desc" {
		dir = "asc"
	}

	return Params{
		SearchWord: strings.TrimSpace(q.Get("searchword")),
		SortBy:     strings.TrimSpace(q.Get("sort_by")),
		SortDir:    dir,
	}
}

// SortColumn pilih nama kolom SQL yang aman buat ORDER BY berdasarkan whitelist per-endpoint
// (jangan pernah interpolate SortBy mentah-mentah ke query, itu SQL injection). Kalau SortBy
// gak ada di whitelist (atau kosong), balikin defaultCol.
func (p Params) SortColumn(allowed map[string]string, defaultCol string) string {
	if col, ok := allowed[p.SortBy]; ok {
		return col
	}
	return defaultCol
}

// SortDirSQL balikin "ASC"/"DESC" buat ditempel langsung ke query (aman, cuma 2 kemungkinan value).
func (p Params) SortDirSQL() string {
	if p.SortDir == "desc" {
		return "DESC"
	}
	return "ASC"
}
