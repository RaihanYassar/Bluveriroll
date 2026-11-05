# BLUVERIROLL

Aplikasi Full-Stack JavaScript (Express.js, PostgreSQL, React, Redux Toolkit) untuk eksplorasi katalog film dan anime, rekomendasi berbasis suasana hati (MoodSync), pengelolaan daftar tontonan pribadi (Watchlist), dan statistik profil tontonan.

---

## Tech Stack & 3rd Party APIs

- **Backend (`server/`)**: Node.js, Express 5, Sequelize ORM, PostgreSQL (Supabase), JWT, Bcryptjs, Jest & Supertest.
- **Frontend (`client/`)**: React 19, Vite, Tailwind CSS v4, Redux Toolkit (`createAsyncThunk` Single Source of Truth), React Router v7.
- **3rd Party APIs Integrated**:
  1. **OpenAI API (`gpt-4o-mini`)** — Natural Language Understanding (NLU) untuk analisis mood dan rekomendasi tontonan.
  2. **Jikan / MyAnimeList API (`api.jikan.moe/v4`)** — Katalog Movie, TV Series, OVA, genre, pencarian, dan detail lengkap.
  3. **Pollinations AI (`image.pollinations.ai`)** — AI Image Generation untuk membuat *Visual Mood Banner* secara dinamis.
  4. **Google OAuth 2.0 (`google-auth-library` & `@react-oauth/google`)** — Social Media Sign-In dengan akun Google.

---

## Quick Start (Cara Menjalankan Project)

### 1. Setup Backend (`server`)
```bash
cd server
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

Untuk menjalankan unit & integration testing beserta laporan coverage (>= 90%):
```bash
cd server
npm run test:coverage
```

### 2. Setup Frontend (`client`)
```bash
cd client
npm install
npm run dev
```

---

## REST API Documentation

Base URL: `http://localhost:3000/api`

### 1. Authentication Endpoints

#### `POST /api/auth/register`
Mendaftarkan pengguna baru.
- **Request Body**:
  ```json
  {
    "username": "RaihanYassar",
    "email": "raihan@bluveriroll.com",
    "password": "password123"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "id": "uuid",
      "username": "RaihanYassar",
      "email": "raihan@bluveriroll.com",
      "avatarUrl": null,
      "createdAt": "2026-11-05T07:00:00.000Z"
    }
  }
  ```

#### `POST /api/auth/login`
Login menggunakan email dan password.
- **Request Body**:
  ```json
  {
    "email": "demo@bluveriroll.com",
    "password": "password123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "statusCode": 200,
    "message": "Login successful",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "RaihanOtaku",
      "email": "demo@bluveriroll.com",
      "avatarUrl": "https://..."
    }
  }
  ```

#### `POST /api/auth/google` (atau `/api/auth/google-login`)
Login/Register otomatis menggunakan Google OAuth ID Token.
- **Request Body**:
  ```json
  {
    "token": "google_id_token_string"
  }
  ```

#### `GET /api/auth/me`
Mengambil profil user yang sedang login.
- **Headers**: `Authorization: Bearer <access_token>`

---

### 2. Movies & Anime Discovery Endpoints

#### `GET /api/anime/popular`
Mengambil daftar Movie / Series terpopuler.
- **Query Params**: `page` (default `1`), `limit` (default `24`, max `25`), `type` (`movie` | `tv` | `ova` | `ona` | `special` | `all`), `filter` (`bypopularity` | `airing` | `upcoming` | `favorite`).

#### `GET /api/anime/search`
Mencari Movie / Series berdasarkan kata kunci, tipe format, dan genre.
- **Query Params**: `q`, `type` (`movie` | `tv` | `ova` | `ona` | `special`), `genres`, `order_by`, `sort`, `page`, `limit`.

#### `GET /api/anime/genres`
Mengambil daftar seluruh genre.

#### `GET /api/anime/:id`
Mengambil detail lengkap Movie / Series berdasarkan ID (termasuk `trailer` embed URL dan `streaming` links).

#### `GET /api/anime/:id/episodes`
Mengambil daftar episode lengkap beserta judul episode & status filler (`page` default `1`).

---

### 3. MoodSync AI Endpoint

#### `POST /api/moodsync/recommend`
Menganalisis mood pengguna menggunakan **OpenAI (`gpt-4o-mini`)**, membuatkan *Mood Visual Banner* via **Pollinations AI**, dan mengembalikan rekomendasi yang sesuai dari **Jikan API**.
- **Request Body**:
  ```json
  {
    "mood": "Feeling stressed after work, want a heartwarming movie",
    "type": "movie"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "moodAnalysis": {
      "moodAnalysis": "You need a comforting, emotionally warm story to unwind.",
      "recommendedGenres": ["Slice of Life", "Drama"],
      "keywords": ["healing"],
      "vibeDescription": "Gentle pacing and uplifting atmosphere",
      "bannerUrl": "https://image.pollinations.ai/prompt/..."
    },
    "recommendations": []
  }
  ```

---

### 4. Personal Watchlist Endpoints (Full CRUD — Protected)

Seluruh endpoint di bawah wajib menyertakan header:
`Authorization: Bearer <access_token>`

#### `GET /api/watchlist`
Mengambil seluruh daftar tontonan milik user yang sedang login.

#### `POST /api/watchlist`
Menambahkan Movie / Series ke dalam Watchlist.
- **Request Body**:
  ```json
  {
    "animeId": 32281,
    "title": "Kimi no Na wa. (Your Name)",
    "imageUrl": "https://cdn.myanimelist.net/images/anime/5/87048l.jpg",
    "status": "Completed",
    "score": 9.5,
    "currentEpisode": 1,
    "totalEpisodes": 1,
    "genres": ["Drama", "Romance"],
    "notes": "Masterpiece!"
  }
  ```

#### `PUT /api/watchlist/:id`
Memperbarui status, progres episode, skor pribadi, atau catatan review pada item Watchlist (dilindungi oleh `watchlistAuthorization` ownership check).
- **Request Body**:
  ```json
  {
    "status": "Completed",
    "score": 10,
    "currentEpisode": 1,
    "notes": "Rewatched and still 10/10"
  }
  ```

#### `DELETE /api/watchlist/:id`
Menghapus item dari Watchlist milik user (dilindungi oleh `watchlistAuthorization` ownership check).

---

### 5. Cinema / Anime DNA Analytics Endpoints (Protected)

- **`GET /api/profile/dna`**: Menghitung statistik Watchlist user (`totalLogged`, `averageRating`, `favoriteGenres`, `dominantVibe`, `hasEnoughData`).
- **`GET /api/profile/journey`**: Mengambil 10 aktivitas perubahan Watchlist terbaru.
