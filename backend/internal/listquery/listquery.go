// Package listquery menyeragamkan cara parse query param search, sort, & pagination buat semua
// endpoint list yang FE-nya pakai DataTableComponent (search box, klik header buat sort, pager).
// Kontrak param standar: ?searchword=...&sort_by=...&sort_dir=asc|desc&page=1&per_page=10
// Response standar: {"data": [...], "meta": {"page", "per_page", "total", "total_pages"}}
package listquery

import (
	"net/http"
	"strconv"
	"strings"
)

const (
	defaultPerPage = 10
	maxPerPage     = 100
)

// Params hasil parse query string, siap dipakai model buat bangun WHERE/ORDER BY/LIMIT.
type Params struct {
	SearchWord string
	SortBy     string
	SortDir    string // selalu "asc" atau "desc", default "asc" kalau kosong/invalid
	Page       int    // 1-indexed, minimal 1
	PerPage    int    // minimal 1, dibatasi maxPerPage biar gak ada yang minta seluruh tabel sekaligus
}

// Parse ambil searchword/sort_by/sort_dir/page/per_page dari request. Dipanggil di awal tiap handler list.
func Parse(r *http.Request) Params {
	q := r.URL.Query()

	dir := strings.ToLower(strings.TrimSpace(q.Get("sort_dir")))
	if dir != "asc" && dir != "desc" {
		dir = "asc"
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 {
		perPage = defaultPerPage
	} else if perPage > maxPerPage {
		perPage = maxPerPage
	}

	return Params{
		SearchWord: strings.TrimSpace(q.Get("searchword")),
		SortBy:     strings.TrimSpace(q.Get("sort_by")),
		SortDir:    dir,
		Page:       page,
		PerPage:    perPage,
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

// Offset buat dipakai langsung sebagai parameter SQL "LIMIT ? OFFSET ?".
func (p Params) Offset() int {
	return (p.Page - 1) * p.PerPage
}

// Meta info pagination standar, dibalikin bareng "data" di semua response endpoint list.
type Meta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// BuildMeta hitung total_pages dari total baris (hasil query COUNT) & params yang dipakai.
func BuildMeta(p Params, total int) Meta {
	totalPages := 1
	if p.PerPage > 0 && total > 0 {
		totalPages = (total + p.PerPage - 1) / p.PerPage
	}
	return Meta{
		Page:       p.Page,
		PerPage:    p.PerPage,
		Total:      total,
		TotalPages: totalPages,
	}
}

// ListResponse bentuk response JSON standar semua endpoint list: {"data": [...], "meta": {...}}.
// Generic biar dipakai model apa aja (WorkHistory, dst) tanpa duplikasi struct per-endpoint.
type ListResponse[T any] struct {
	Data []T  `json:"data"`
	Meta Meta `json:"meta"`
}
