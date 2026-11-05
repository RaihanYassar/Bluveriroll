# Product Requirements Document (PRD)
## BLUVERIROLL — AI-Powered Anime Movie & Series Discovery Platform

---

## 1. Executive Summary & Background
Penonton film dan anime sering mengalami *choice overload* (kebingungan memilih tontonan) ketika membuka katalog ribuan judul. Pencarian konvensional hanya mengandalkan filter genre kaku, bukan suasana hati (*mood*), skenario emosional, atau histori selera pengguna.

**BLUVERIROLL** hadir sebagai platform *Full-Stack Discovery & Personal Watchlist Tracker* yang menggabungkan:
1. **Katalog Movie & Series Real-Time** (via **Jikan / MyAnimeList API** — mendukung filter **Movies**, **TV Series**, **OVA**, dan **Special**).
2. **MoodSync AI Engine** (via **OpenAI GPT-4o-mini API** + **Pollinations AI**): Menerjemahkan curhatan atau suasana hati pengguna menggunakan *Natural Language Understanding (NLU)* menjadi rekomendasi film/anime yang tepat, lengkap dengan visualisasi *Mood Banner* dari AI.
3. **Personal Watchlist & Review Tracker (Full CRUD)**: Menyimpan film/anime favorit, mengatur status tontonan, mencatat progres episode/menit, memberikan skor pribadi (1–10), serta menulis catatan review.
4. **Anime/Cinema DNA Analytics**: Menganalisis data watchlist pengguna untuk menampilkan *Dominant Vibe*, *Favorite Genres*, rata-rata skor, dan *Watch Journey Timeline*.

---

## 2. Compliance Terhadap Requirement Individual Project Hacktiv8
| No | Requirement Hacktiv8 | Implementasi di BLUVERIROLL | Status |
| :--- | :--- | :--- | :--- |
| 1 | **Tema Aplikasi** | Movies / Anime Entertainment Discovery | ✅ |
| 2 | **Arsitektur Client-Server** | `server/` (Express + Sequelize + PostgreSQL) & `client/` (Vite + React) | ✅ |
| 3 | **REST API + Full CRUD** | Autentikasi, Katalog Movie/Anime, AI MoodSync, dan Full CRUD `Watchlists` (`POST`, `GET`, `PUT`, `DELETE`) dengan Authentication & Authorization | ✅ |
| 4 | **Server Testing (Min 90% Coverage)** | Jest & Supertest untuk seluruh endpoint, model, middleware, helper, dan service (> 90% coverage) | ✅ |
| 5 | **API Documentation** | Dokumentasi lengkap seluruh endpoint di `README.md` / `server/API_DOC.md` | ✅ |
| 6 | **State Management Redux (Single Source of Truth)** | Seluruh proses *data fetching* (`axios`) dijalankan melalui **Redux Toolkit Async Thunks** di `store/slices/` dan didistribusikan ke komponen melalui `useSelector` | ✅ |
| 7 | **Fitur Utama Berbasis AI** | Natural Language Understanding (NLU), Personalization & Recommendation, serta Data Analysis (MoodSync AI + DNA Profile) | ✅ |
| 8 | **Social Media Sign-In (Google)** | Google OAuth 2.0 (`@react-oauth/google` di Client & `google-auth-library` di Server) | ✅ |
| 9 | **Minimal 2 Jenis 3rd Party API** | 1) **OpenAI API** (`gpt-4o-mini`) <br> 2) **Jikan Movie/Anime API** (`api.jikan.moe/v4`) <br> 3) **Pollinations AI** (AI Mood Poster Generator) | ✅ |

---

## 3. User Stories & Functional Requirements

### 3.1. Authentication & User Management
- **US-01 (Register)**: Sebagai pengunjung, saya dapat mendaftarkan akun baru dengan `username`, `email`, dan `password`.
- **US-02 (Login)**: Sebagai pengguna terdaftar, saya dapat login menggunakan `email` dan `password` untuk mendapatkan JWT `access_token`.
- **US-03 (Google OAuth Sign-In)**: Sebagai pengguna, saya dapat login secara instan menggunakan akun Google saya.

### 3.2. Movie & Series Discovery (Public)
- **US-04 (Browse Popular & Filter by Type)**: Sebagai pengguna, saya dapat melihat daftar Movie & Series terpopuler serta memfilter berdasarkan tipe (**All**, **Movie**, **TV Series**, **OVA**) maupun pencarian judul/kata kunci.
- **US-05 (Movie/Anime Detail)**: Sebagai pengguna, saya dapat melihat detail lengkap (sinopsis, skor, tahun rilis, durasi/jumlah episode, genre, trailer/studio) dan langsung menambahkannya ke Watchlist.

### 3.3. MoodSync AI Recommender (3rd Party AI API)
- **US-06 (AI Mood Analysis & Recommendation)**: Sebagai pengguna, saya dapat mengetikkan suasana hati dalam bahasa sehari-hari (misal: *"Lagi capek kerja, pengen nonton movie yang hangat dan bikin tenang"*), lalu AI akan menganalisis mood tersebut, membuatkan ilustrasi visual mood via Pollinations AI, dan mencarikan rekomendasi film/anime yang paling cocok.

### 3.4. Personal Watchlist Tracker (Protected — Full CRUD + Ownership Authorization)
- **US-07 (Create Watchlist Item)**: Pengguna yang login dapat menambahkan film/anime ke Watchlist dengan status awal (`Plan to Watch`, `Watching`, `Completed`, `On Hold`, `Dropped`).
- **US-08 (Read & Filter Watchlist)**: Pengguna dapat melihat seluruh koleksi Watchlist miliknya dan memfilter berdasarkan tab status.
- **US-09 (Update Watchlist Item)**: Pengguna dapat mengubah status tontonan, menambah progres episode (`+1 Ep`), mengubah skor pribadi (`1-10`), dan menulis catatan/review singkat (`notes`).
- **US-10 (Delete Watchlist Item)**: Pengguna dapat menghapus film/anime dari Watchlist miliknya sendiri.

### 3.5. Cinema / Anime DNA Profile (Protected — Analytics)
- **US-11 (Taste DNA & Watch Journey)**: Pengguna dapat melihat profil analitik otomatis berdasarkan daftar tontonan mereka (Total Logged, Average Score, Top Genres, Dominant Vibe, dan histori perubahan terbaru).

