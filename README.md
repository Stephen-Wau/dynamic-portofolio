# Dynamic Portofolio

## Setup MySQL

1. Buat database:
   ```sql
   CREATE DATABASE dynamic_portofolio;
   ```
2. Copy `.env.example` menjadi `.env` di `backend/` dan sesuaikan kredensial MySQL serta `JWT_SECRET`.
3. Jalankan migration:
   ```bash
   mysql -u root dynamic_portofolio < backend/migrations/001_create_users.sql
   ```
4. Buat admin pertama (kredensial di-hardcode di `cmd/seed/main.go`):
   ```bash
   cd backend
   go run ./cmd/seed
   ```

## Menjalankan Backend

```bash
cd backend
go mod tidy
go run main.go
```

Login CMS: `POST /api/auth/login` dengan `{"username", "password"}` → dapat JWT. Kirim JWT via header `Authorization: Bearer <token>` ke endpoint protected seperti `GET /api/auth/me`.

Backend berjalan di `http://localhost:8080`.

## Menjalankan Frontend

```bash
cd frontend
npm install
npm start
```

Frontend berjalan di `http://localhost:4200`. CMS login ada di `http://localhost:4200/admin-cms/login`.
