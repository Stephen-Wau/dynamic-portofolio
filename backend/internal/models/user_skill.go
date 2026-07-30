package models

import (
	"database/sql"
	"fmt"

	"dynamic-portofolio/backend/internal/listquery"
)

// userSkillSortColumns whitelist kolom yang boleh dipakai buat ORDER BY dari query param sort_by.
// WAJIB pakai whitelist ini, jangan pernah interpolate sort_by mentah-mentah ke SQL (SQL injection).
var userSkillSortColumns = map[string]string{
	"title": "title",
	"type":  "type",
}

// UserSkill satu keahlian milik user (soft skill/hard skill/software skill).
type UserSkill struct {
	ID     int64  `json:"id"`
	UserID int64  `json:"user_id"`
	Title  string `json:"title"`
	Type   string `json:"type"`
}

// ListUserSkillsByUser ambil skill user (dengan search/sort/pagination dari listquery.Params),
// plus total baris yang match filter (buat listquery.Meta, sebelum LIMIT).
func ListUserSkillsByUser(db *sql.DB, userID int64, params listquery.Params) ([]UserSkill, int, error) {
	whereClause := " WHERE user_id = ?"
	args := []interface{}{userID}

	// searchword dicari di title aja (satu-satunya kolom teks bebas di tabel ini).
	if params.SearchWord != "" {
		whereClause += " AND title LIKE ?"
		args = append(args, "%"+params.SearchWord+"%")
	}

	var total int
	if err := db.QueryRow("SELECT COUNT(*) FROM user_skills"+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	sortCol := params.SortColumn(userSkillSortColumns, "title")
	query := "SELECT id, user_id, title, type FROM user_skills" + whereClause +
		fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortCol, params.SortDirSQL())
	args = append(args, params.PerPage, params.Offset())

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	skills := []UserSkill{}
	for rows.Next() {
		var (
			s          UserSkill
			title, typ sql.NullString
		)
		if err := rows.Scan(&s.ID, &s.UserID, &title, &typ); err != nil {
			return nil, 0, err
		}
		s.Title = title.String
		s.Type = typ.String
		skills = append(skills, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return skills, total, nil
}

// UserSkillTitleExists cek apakah user ini sudah punya skill dengan title yang sama (case-insensitive
// gak dicek di sini, exact match aja, cukup buat kebutuhan uniqueness per user). excludeID dipakai
// saat update supaya baris yang sedang diedit gak dibandingkan sama dirinya sendiri.
func UserSkillTitleExists(db *sql.DB, userID int64, title string, excludeID int64) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM user_skills WHERE user_id = ? AND title = ? AND id != ?",
		userID, title, excludeID,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CreateUserSkill simpan skill baru.
func CreateUserSkill(db *sql.DB, s UserSkill) (int64, error) {
	res, err := db.Exec(
		"INSERT INTO user_skills (user_id, title, type) VALUES (?, ?, ?)",
		s.UserID, s.Title, s.Type,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// UpdateUserSkill ubah data skill. WHERE id=? AND user_id=? sekaligus jadi ownership check: kalau
// id itu bukan milik user ini, 0 baris keupdate (gak error, tapi juga gak ngubah apa-apa).
func UpdateUserSkill(db *sql.DB, s UserSkill) error {
	_, err := db.Exec(
		"UPDATE user_skills SET title = ?, type = ? WHERE id = ? AND user_id = ?",
		s.Title, s.Type, s.ID, s.UserID,
	)
	return err
}

// DeleteUserSkill hapus skill milik user. WHERE id=? AND user_id=? mencegah user hapus skill
// milik user lain.
func DeleteUserSkill(db *sql.DB, id, userID int64) error {
	_, err := db.Exec("DELETE FROM user_skills WHERE id = ? AND user_id = ?", id, userID)
	return err
}
