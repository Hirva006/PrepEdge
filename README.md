# PrepEdge 🎯

**AI-powered mock interview platform** — practice role-specific questions, get instant feedback, and track your progress over time.

Built with **Node.js · Express · MongoDB · JWT · Vanilla JS**

---

## ✨ Features

- 🔐 **Auth** — Signup / login with bcrypt-hashed passwords and JWT sessions
- 💬 **Mock Interviews** — Timed, role-specific question sets fetched from the database
- 🤖 **AI Feedback** — Per-answer scoring across Clarity, Relevance, Depth, and Structure
- 📊 **Dashboard** — Live stats: sessions done, average score, top role
- 📋 **Session History** — Every completed session is saved and reviewable
- 🖥️ **Single Server** — Frontend served by Express; no Live Server or separate dev server needed

---

## 🗂 Project Structure

```
prepedge/
├── server.js                   ← Entry point — serves API + frontend
├── .env.example                ← Environment variable template
├── package.json
│
├── public/                     ← Frontend (served as static files)
│   ├── index.html
│   ├── app.js
│   └── index.css
│
├── config/
│   └── db.js                   ← MongoDB connection
│
├── models/
│   ├── User.js
│   ├── Question.js
│   └── Session.js
│
├── controllers/
│   ├── authController.js
│   ├── questionsController.js
│   └── sessionsController.js
│
├── routes/
│   ├── auth.js                 ← /api/auth/*
│   ├── questions.js            ← /api/questions/*
│   └── sessions.js             ← /api/sessions/*
│
├── middleware/
│   └── auth.js                 ← JWT verification
│
└── db/
    └── seed.js                 ← Seeds question bank into MongoDB
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) — local install **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/prepedge.git
cd prepedge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/prepedge_db
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> **Generate a strong JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Seed the question bank

```bash
node db/seed.js
```

This populates MongoDB with interview questions for: Frontend Dev, Backend Dev, Data Science, Product Manager, and more.

### 5. Start the server

```bash
# Development — auto-restarts on file changes
npm run dev

# Production
npm start
```

Then open **http://localhost:5000** in your browser. That's it — frontend and backend run on the same server.

---

## 🔗 API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/api/auth/signup` | ✗ | `{ full_name, email, password }` |
| POST | `/api/auth/login` | ✗ | `{ email, password }` |
| GET | `/api/auth/me` | ✓ | — |

### Questions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questions?role=Frontend Dev&limit=5` | ✓ | Random questions for a role |
| GET | `/api/questions/roles` | ✓ | List all available roles |

### Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sessions` | ✓ | Save a completed session |
| GET | `/api/sessions` | ✓ | Get current user's history |
| GET | `/api/sessions/stats` | ✓ | Dashboard statistics |
| GET | `/api/sessions/:id` | ✓ | Single session with answers |

---

## 🧪 Testing the API

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Alex","email":"alex@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@test.com","password":"test123"}'

# Fetch questions (paste token from login response)
curl "http://localhost:5000/api/questions?role=Frontend%20Dev" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Health check
curl http://localhost:5000/api/health
```

---

## 🗄 Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| `full_name` | String | Required |
| `email` | String | Unique |
| `password_hash` | String | bcrypt |
| `createdAt` | Date | Auto |

### Question
| Field | Type | Notes |
|-------|------|-------|
| `role` | String | e.g. `"Frontend Dev"` |
| `category` | String | e.g. `"React"` |
| `question_text` | String | |
| `difficulty` | String | `easy` / `medium` / `hard` |

### Session
| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId | Ref → User |
| `role` | String | |
| `avg_score` | Number | 0–100 |
| `duration_seconds` | Number | |
| `answers` | Array | Embedded answer objects |
| `completedAt` | Date | |

Each answer in the array stores: `question_text`, `answer_text`, `score_clarity`, `score_relevance`, `score_depth`, `score_structure`, `overall_score`, `ai_feedback`, `time_taken_seconds`.

---

## 🌐 Deployment

### Railway (recommended — free tier)
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a MongoDB plugin or set `MONGO_URI` to a MongoDB Atlas connection string
4. Set all environment variables from `.env.example` in the Railway dashboard
5. Done — Railway auto-detects Node and runs `npm start`

### Render
1. New Web Service → connect your GitHub repo
2. Build command: `npm install`
3. Start command: `npm start`
4. Add environment variables in the Render dashboard

### Environment variables for production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/prepedge_db
JWT_SECRET=<strong 64-char secret>
JWT_EXPIRES_IN=7d
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla JS, HTML, CSS |
| Dev tooling | nodemon, dotenv |
