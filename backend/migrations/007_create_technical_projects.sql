CREATE TABLE IF NOT EXISTS technical_projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name_project VARCHAR(191) NULL,
    user_role VARCHAR(191) NULL,
    description TEXT NULL,
    tech_stack VARCHAR(500) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_technical_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS technical_project_key_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    technical_project_id BIGINT NOT NULL,
    contribution TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_technical_project_key_contributions_project FOREIGN KEY (technical_project_id) REFERENCES technical_projects(id) ON DELETE CASCADE
);

-- file_data disimpan sebagai base64 data URI langsung di kolom (LONGTEXT), sama seperti
-- user_profiles.image — bukan file terpisah di disk/object storage.
CREATE TABLE IF NOT EXISTS technical_project_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    technical_project_id BIGINT NOT NULL,
    file_name VARCHAR(191) NULL,
    file_data LONGTEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_technical_project_files_project FOREIGN KEY (technical_project_id) REFERENCES technical_projects(id) ON DELETE CASCADE
);
