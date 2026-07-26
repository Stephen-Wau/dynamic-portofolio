# Dynamic Portofolio

## Setup MySQL

1. Buat database:
   ```sql
   CREATE DATABASE dynamic_portofolio;
   ```
2. Copy `.env.example` menjadi `.env` di `backend/` dan sesuaikan kredensial MySQL.

## Menjalankan Backend

```bash
cd backend
go mod tidy
go run main.go
```

Backend berjalan di `http://localhost:8080`.

## Menjalankan Frontend

```bash
cd frontend
npm install
npm start
```

Frontend berjalan di `http://localhost:4200`.
