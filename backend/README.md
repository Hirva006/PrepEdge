# PrepEdge — Backend Setup Guide

A complete Node.js + Express + PostgreSQL backend for the PrepEdge interview practice app.

---

## 📁 Project Structure

```
prepedge-backend/
├── server.js                  ← Entry point — starts Express server
├── .env.example               ← Copy this to .env and fill values
├── package.json
│
├── config/
│   └── db.js                  ← PostgreSQL connection pool
│
├── db/
│   ├── migrate.js             ← Creates all DB tables (run once)
│   └── seed.js                ← Inserts sample questions (run once)
│
├── middleware/
│   └── auth.js                ← JWT verification middleware
│
├── controllers/
│   ├── authController.js      ← Signup, login, get current user
│   ├── questionsController.js ← Fetch questions by role
│   └── sessionsController.js  ← Save/retrieve interview sessions
│
├── routes/
│   ├── auth.js                ← /api/auth/*
│   ├── questions.js           ← /api/questions/*
│   └── sessions.js            ← /api/sessions/*
│
└── app.js                     ← Updated frontend JS (drop-in replacement)
```

---

## 🛠 Step-by-Step Setup

### STEP 1 — Install PostgreSQL

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**On macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**On Windows:**  
Download the installer from https://www.postgresql.org/download/windows/

---

### STEP 2 — Create the Database

Open the PostgreSQL shell:
```bash
# Linux/macOS
sudo -u postgres psql

# Windows
psql -U postgres
```

Inside the psql shell:
```sql
CREATE DATABASE prepedge_db;
CREATE USER prepedge_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE prepedge_db TO prepedge_user;
\q
```

---

### STEP 3 — Clone & Install Dependencies

```bash
cd prepedge-backend
npm install
```

This installs:
| Package      | Purpose                                    |
|--------------|--------------------------------------------|
| express      | Web framework                              |
| pg           | PostgreSQL driver (connection pool)        |
| bcryptjs     | Password hashing                           |
| jsonwebtoken | JWT creation and verification              |
| dotenv       | Loads .env file into process.env           |
| cors         | Allows your frontend to call the API       |
| nodemon      | Auto-restarts server on file changes (dev) |

---

### STEP 4 — Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prepedge_db
DB_USER=prepedge_user
DB_PASSWORD=your_strong_password

JWT_SECRET=paste_a_64_char_random_string_here
JWT_EXPIRES_IN=7d

CLIENT_ORIGIN=http://localhost:3000
PORT=5000
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### STEP 5 — Run Migrations (creates tables)

```bash
node db/migrate.js
```

Expected output:
```
✅ PostgreSQL connected successfully
🔄 Running migrations...
  ✅ Table: users
  ✅ Table: questions
  ✅ Table: sessions
  ✅ Table: answers
✅ All migrations completed successfully!
```

---

### STEP 6 — Seed Questions

```bash
node db/seed.js
```

This inserts sample questions for: Frontend Dev, Backend Dev, Data Science, Product Manager.

---

### STEP 7 — Start the Server

```bash
# Production
npm start

# Development (auto-restart on save)
npm run dev
```

Expected output:
```
✅ PostgreSQL connected successfully

🚀 PrepEdge API running on http://localhost:5000
   Environment: development
   Health check: http://localhost:5000/api/health
```

---

## 🔗 API Reference

### Auth Endpoints

| Method | Endpoint          | Auth | Body                              |
|--------|-------------------|------|-----------------------------------|
| POST   | /api/auth/signup  | No   | { full_name, email, password }    |
| POST   | /api/auth/login   | No   | { email, password }               |
| GET    | /api/auth/me      | Yes  | —                                 |

**Signup response:**
```json
{
  "message": "Account created successfully!",
  "token": "eyJhbGci...",
  "user": { "id": 1, "full_name": "Alex", "email": "alex@email.com" }
}
```

---

### Questions Endpoints

| Method | Endpoint               | Auth | Description                          |
|--------|------------------------|------|--------------------------------------|
| GET    | /api/questions/roles   | Yes  | List all available roles             |
| GET    | /api/questions?role=X  | Yes  | Get 5 random questions for a role    |

Add `&limit=10` to get more questions.

---

### Sessions Endpoints

| Method | Endpoint            | Auth | Description                      |
|--------|---------------------|------|----------------------------------|
| GET    | /api/sessions       | Yes  | Get all sessions for current user|
| GET    | /api/sessions/:id   | Yes  | Get one session with answers     |
| GET    | /api/sessions/stats | Yes  | Dashboard statistics             |
| POST   | /api/sessions       | Yes  | Save a completed session         |

**POST /api/sessions body:**
```json
{
  "role": "Frontend Dev",
  "duration_seconds": 480,
  "answers": [
    {
      "question_id": 1,
      "question_text": "Explain the Virtual DOM...",
      "answer_text": "The Virtual DOM is...",
      "score_clarity": 82,
      "score_relevance": 75,
      "score_depth": 68,
      "score_structure": 80,
      "overall_score": 76,
      "ai_feedback": "Good answer! Consider...",
      "time_taken_seconds": 95
    }
  ]
}
```

---

## 🗄 Database Schema

### users
| Column        | Type         | Notes                    |
|---------------|--------------|--------------------------|
| id            | SERIAL PK    | Auto-increment           |
| full_name     | VARCHAR(100) |                          |
| email         | VARCHAR(150) | UNIQUE                   |
| password_hash | VARCHAR(255) | bcrypt hash              |
| created_at    | TIMESTAMP    |                          |

### questions
| Column        | Type         | Notes                          |
|---------------|--------------|--------------------------------|
| id            | SERIAL PK    |                                |
| role          | VARCHAR(100) | e.g. "Frontend Dev"            |
| category      | VARCHAR(100) | e.g. "React"                   |
| question_text | TEXT         |                                |
| difficulty    | VARCHAR(20)  | easy / medium / hard           |

### sessions
| Column           | Type     | Notes                      |
|------------------|----------|----------------------------|
| id               | SERIAL   |                            |
| user_id          | INTEGER  | FK → users.id              |
| role             | VARCHAR  |                            |
| total_questions  | INTEGER  |                            |
| avg_score        | NUMERIC  |                            |
| duration_seconds | INTEGER  |                            |
| completed_at     | TIMESTAMP|                            |

### answers
| Column           | Type    | Notes                       |
|------------------|---------|-----------------------------|
| id               | SERIAL  |                             |
| session_id       | INTEGER | FK → sessions.id            |
| question_id      | INTEGER | FK → questions.id           |
| answer_text      | TEXT    |                             |
| score_clarity    | INTEGER | 0–100                       |
| score_relevance  | INTEGER | 0–100                       |
| score_depth      | INTEGER | 0–100                       |
| score_structure  | INTEGER | 0–100                       |
| overall_score    | INTEGER | 0–100                       |
| ai_feedback      | TEXT    |                             |

---

## 🔄 Connect Frontend to Backend

1. Replace your existing `app.js` with the new `app.js` from this folder.

2. In your `index.html`, update the signup/login buttons to call the new functions:
   ```html
   <!-- Signup button -->
   <button onclick="handleSignup()">Create Account</button>

   <!-- Login button -->
   <button onclick="handleLogin()">Sign In</button>

   <!-- Start interview (requires role selected first) -->
   <button id="start-btn" onclick="startInterview()" disabled>Start Interview</button>
   ```

3. Add `id` attributes to the auth inputs:
   ```html
   <!-- Signup -->
   <input id="signup-name"  type="text"     .../>
   <input id="signup-email" type="email"    .../>
   <input id="signup-password" type="password" .../>

   <!-- Login -->
   <input id="login-email"    type="email"    .../>
   <input id="login-password" type="password" .../>
   ```

4. Add `id` attributes to dashboard elements:
   ```html
   <div id="dash-sessions">0</div>
   <div id="dash-avg">0%</div>
   <div id="dash-questions">0</div>
   <div id="dash-top-role">—</div>
   ```

5. Add a container for dynamic history:
   ```html
   <div id="history-list-dynamic" class="history-list"></div>
   ```

---

## 🧪 Quick Test with curl

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get questions (use token from login)
curl http://localhost:5000/api/questions?role=Frontend%20Dev \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚀 Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Use a strong 64-char `JWT_SECRET`
- [ ] Set `CLIENT_ORIGIN` to your actual frontend domain
- [ ] Use environment variables from your host (never commit `.env`)
- [ ] Use a managed PostgreSQL service (Supabase, Railway, Neon, AWS RDS)
- [ ] Add HTTPS (use a reverse proxy like Nginx or a platform like Render/Railway)
- [ ] Consider adding rate limiting (`express-rate-limit`) to auth routes

---

## 📦 Recommended Hosting Options

| Platform  | Free Tier | Notes                              |
|-----------|-----------|------------------------------------|
| Railway   | Yes       | Easiest — deploys from GitHub      |
| Render    | Yes       | Free PostgreSQL add-on             |
| Supabase  | Yes       | Managed PostgreSQL + Auth built-in |
| Heroku    | Paid      | Classic but no free tier now       |
