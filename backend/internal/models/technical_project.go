package models

import (
	"database/sql"
	"fmt"
	"strings"

	"dynamic-portofolio/backend/internal/listquery"
)

// technicalProjectSortColumns whitelist kolom yang boleh dipakai buat ORDER BY dari query param
// sort_by. WAJIB pakai whitelist ini, jangan pernah interpolate sort_by mentah-mentah ke SQL
// (SQL injection).
var technicalProjectSortColumns = map[string]string{
	"name_project": "name_project",
	"user_role":    "user_role",
}

// TechnicalProjectFile satu file lampiran milik project (base64 data URI, bukan file di disk —
// sama seperti user_profiles.image).
type TechnicalProjectFile struct {
	ID       int64  `json:"id"`
	FileName string `json:"file_name"`
	FileData string `json:"file_data"`
}

// TechnicalProject satu proyek teknikal milik user, beserta key contribution-nya (wajib minimal 1,
// divalidasi di handler) dan file lampirannya (opsional, boleh kosong).
type TechnicalProject struct {
	ID               int64                  `json:"id"`
	UserID           int64                  `json:"user_id"`
	NameProject      string                 `json:"name_project"`
	UserRole         string                 `json:"user_role"`
	Description      string                 `json:"description"`
	TechStack        string                 `json:"tech_stack"`
	KeyContributions []string               `json:"key_contributions"`
	Files            []TechnicalProjectFile `json:"files"`
}

// ListTechnicalProjectsByUser ambil technical project user (dengan search/sort/pagination dari
// listquery.Params), plus total baris yang match filter (buat listquery.Meta, sebelum LIMIT).
func ListTechnicalProjectsByUser(db *sql.DB, userID int64, params listquery.Params) ([]TechnicalProject, int, error) {
	whereClause := " WHERE user_id = ?"
	args := []interface{}{userID}

	// searchword dicari di name_project aja (kolom teks bebas paling relevan buat dicari di tabel ini).
	if params.SearchWord != "" {
		whereClause += " AND name_project LIKE ?"
		args = append(args, "%"+params.SearchWord+"%")
	}

	var total int
	if err := db.QueryRow("SELECT COUNT(*) FROM technical_projects"+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	sortCol := params.SortColumn(technicalProjectSortColumns, "name_project")
	query := "SELECT id, user_id, name_project, user_role, description, tech_stack FROM technical_projects" + whereClause +
		fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortCol, params.SortDirSQL())
	args = append(args, params.PerPage, params.Offset())

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	projects := []TechnicalProject{}
	ids := []int64{}
	for rows.Next() {
		var (
			p                                             TechnicalProject
			nameProject, userRole, description, techStack sql.NullString
		)
		if err := rows.Scan(&p.ID, &p.UserID, &nameProject, &userRole, &description, &techStack); err != nil {
			return nil, 0, err
		}
		p.NameProject = nameProject.String
		p.UserRole = userRole.String
		p.Description = description.String
		p.TechStack = techStack.String
		p.KeyContributions = []string{}
		p.Files = []TechnicalProjectFile{}
		projects = append(projects, p)
		ids = append(ids, p.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Ambil key contribution & file semua project sekaligus (2 query tambahan) dibanding query
	// per-baris di loop, biar gak N+1 query kalau project-nya banyak.
	contributionsByProject, err := keyContributionsForProjects(db, ids)
	if err != nil {
		return nil, 0, err
	}
	filesByProject, err := filesForProjects(db, ids)
	if err != nil {
		return nil, 0, err
	}
	for i := range projects {
		// Pakai comma-ok: kalau project ini gak punya baris di map (nil slice), biarkan
		// slice kosong yang udah di-init di atas, supaya JSON-nya "[]" bukan "null".
		if c, ok := contributionsByProject[projects[i].ID]; ok {
			projects[i].KeyContributions = c
		}
		if f, ok := filesByProject[projects[i].ID]; ok {
			projects[i].Files = f
		}
	}
	return projects, total, nil
}

// keyContributionsForProjects ambil semua key contribution buat sekumpulan technical_project id
// sekaligus (query pakai IN (...)), hasilnya di-group jadi map[technical_project_id][]kontribusi.
func keyContributionsForProjects(db *sql.DB, ids []int64) (map[int64][]string, error) {
	result := map[int64][]string{}
	if len(ids) == 0 {
		return result, nil
	}

	placeholders, args := idPlaceholders(ids)
	rows, err := db.Query(
		fmt.Sprintf("SELECT technical_project_id, contribution FROM technical_project_key_contributions WHERE technical_project_id IN (%s) ORDER BY id", placeholders),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var projectID int64
		var contribution sql.NullString
		if err := rows.Scan(&projectID, &contribution); err != nil {
			return nil, err
		}
		result[projectID] = append(result[projectID], contribution.String)
	}
	return result, rows.Err()
}

// filesForProjects ambil semua file lampiran buat sekumpulan technical_project id sekaligus
// (query pakai IN (...)), hasilnya di-group jadi map[technical_project_id][]file.
func filesForProjects(db *sql.DB, ids []int64) (map[int64][]TechnicalProjectFile, error) {
	result := map[int64][]TechnicalProjectFile{}
	if len(ids) == 0 {
		return result, nil
	}

	placeholders, args := idPlaceholders(ids)
	rows, err := db.Query(
		fmt.Sprintf("SELECT technical_project_id, id, file_name, file_data FROM technical_project_files WHERE technical_project_id IN (%s) ORDER BY id", placeholders),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var projectID int64
		var f TechnicalProjectFile
		var fileName, fileData sql.NullString
		if err := rows.Scan(&projectID, &f.ID, &fileName, &fileData); err != nil {
			return nil, err
		}
		f.FileName = fileName.String
		f.FileData = fileData.String
		result[projectID] = append(result[projectID], f)
	}
	return result, rows.Err()
}

// idPlaceholders bangun placeholder "?,?,?..." sejumlah ids buat klausa IN (?), karena
// database/sql gak bisa terima slice langsung.
func idPlaceholders(ids []int64) (string, []interface{}) {
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}
	return strings.Join(placeholders, ","), args
}

// CreateTechnicalProject simpan technical project baru + key contribution & file-nya dalam satu
// transaction (biar kalau insert child gagal di tengah, insert technical_projects-nya ikut
// di-rollback, gak nyisa data setengah jadi).
func CreateTechnicalProject(db *sql.DB, p TechnicalProject) (int64, error) {
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		"INSERT INTO technical_projects (user_id, name_project, user_role, description, tech_stack) VALUES (?, ?, ?, ?, ?)",
		p.UserID, nullIfEmpty(p.NameProject), nullIfEmpty(p.UserRole), nullIfEmpty(p.Description), nullIfEmpty(p.TechStack),
	)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	if err := insertKeyContributions(tx, id, p.KeyContributions); err != nil {
		return 0, err
	}
	if err := insertFiles(tx, id, p.Files); err != nil {
		return 0, err
	}
	return id, tx.Commit()
}

// UpdateTechnicalProject ubah data technical project + replace semua key contribution & file-nya.
// Strategi child rows: hapus semua baris lama punya project ini, lalu insert ulang dari awal —
// lebih simple daripada diffing "baris mana yang berubah/ditambah/dihapus" satu-satu.
func UpdateTechnicalProject(db *sql.DB, p TechnicalProject) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// WHERE id=? AND user_id=? sekaligus jadi ownership check: kalau id itu bukan milik
	// user ini, WHERE-nya gak match apapun, jadi 0 baris keupdate (gak error, tapi juga gak ngubah apa-apa).
	_, err = tx.Exec(
		"UPDATE technical_projects SET name_project = ?, user_role = ?, description = ?, tech_stack = ? WHERE id = ? AND user_id = ?",
		nullIfEmpty(p.NameProject), nullIfEmpty(p.UserRole), nullIfEmpty(p.Description), nullIfEmpty(p.TechStack), p.ID, p.UserID,
	)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("DELETE FROM technical_project_key_contributions WHERE technical_project_id = ?", p.ID); err != nil {
		return err
	}
	if err := insertKeyContributions(tx, p.ID, p.KeyContributions); err != nil {
		return err
	}

	if _, err := tx.Exec("DELETE FROM technical_project_files WHERE technical_project_id = ?", p.ID); err != nil {
		return err
	}
	if err := insertFiles(tx, p.ID, p.Files); err != nil {
		return err
	}

	return tx.Commit()
}

// DeleteTechnicalProject hapus technical project milik user (key contribution & file ikut kehapus
// lewat ON DELETE CASCADE di DB). WHERE id=? AND user_id=? mencegah user hapus project milik user lain.
func DeleteTechnicalProject(db *sql.DB, id, userID int64) error {
	_, err := db.Exec("DELETE FROM technical_projects WHERE id = ? AND user_id = ?", id, userID)
	return err
}

// insertKeyContributions insert semua key contribution (skip yang kosong/whitespace) buat satu
// technical_project_id. Dipanggil di dalam transaction (tx), bukan *sql.DB langsung, biar ikut
// ke-rollback kalau ada yang gagal.
func insertKeyContributions(tx *sql.Tx, technicalProjectID int64, contributions []string) error {
	for _, c := range contributions {
		if strings.TrimSpace(c) == "" {
			continue
		}
		if _, err := tx.Exec(
			"INSERT INTO technical_project_key_contributions (technical_project_id, contribution) VALUES (?, ?)",
			technicalProjectID, c,
		); err != nil {
			return err
		}
	}
	return nil
}

// insertFiles insert semua file lampiran (skip yang gak punya file_data) buat satu
// technical_project_id. Dipanggil di dalam transaction (tx), bukan *sql.DB langsung, biar ikut
// ke-rollback kalau ada yang gagal.
func insertFiles(tx *sql.Tx, technicalProjectID int64, files []TechnicalProjectFile) error {
	for _, f := range files {
		if strings.TrimSpace(f.FileData) == "" {
			continue
		}
		if _, err := tx.Exec(
			"INSERT INTO technical_project_files (technical_project_id, file_name, file_data) VALUES (?, ?, ?)",
			technicalProjectID, nullIfEmpty(f.FileName), f.FileData,
		); err != nil {
			return err
		}
	}
	return nil
}
