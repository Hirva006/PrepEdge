// app.js — PrepEdge Frontend
// All API calls go to the backend defined in API_BASE.
// The JWT token is saved to localStorage after login.

const API_BASE = window.location.origin.startsWith("http")
  ? window.location.origin + "/api"
  : "http://localhost:5000/api"; // fallback when opened from file://

// ── AUTH STATE ────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem("pe_user") || "null");
let token = localStorage.getItem("pe_token") || "";

let currentQ = 0;
let selectedRole = "";
let timerInterval = null;
let timeLeft = 120;
let loadedQuestions = [];
let sessionAnswers = [];
let sessionStartTime = null;
let signupInProgress = false;

// ── INIT ──────────────────────────────────────
// On load, reflect auth state in nav and go to right page
(function init() {
  updateNav();
  if (token && currentUser) showPage("dashboard");
})();

function updateNav() {
  document.getElementById("nav-guest").style.display = token ? "none" : "flex";
  document.getElementById("nav-user").style.display = token ? "flex" : "none";
}

// ── API HELPER ────────────────────────────────
async function apiCall(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ── PAGE ROUTING ──────────────────────────────
function showPage(name) {
  // Guard protected pages
  const protected_ = ["dashboard", "history", "roles", "interview"];
  if (protected_.includes(name) && !token) {
    showToast("Please sign in to continue.", "error");
    name = "login";
  }

  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  window.scrollTo(0, 0);

  if (name === "interview") startTimer();
  else stopTimer();
  if (name === "dashboard") loadDashboard();
  if (name === "history") loadHistory();
}

// ── TOAST ─────────────────────────────────────
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (type ? " toast-" + type : "");
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ── SIGN UP ───────────────────────────────────
async function handleSignup() {
  if (signupInProgress) return;

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!name || !email || !password)
    return showToast("All fields are required.", "error");

  try {
    signupInProgress = true;
    const data = await apiCall("/auth/signup", "POST", {
      full_name: name,
      email,
      password,
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("pe_token", token);
    localStorage.setItem("pe_user", JSON.stringify(currentUser));
    updateNav();
    showPage("roles");
    showToast("Account created! Pick your role.");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    signupInProgress = false;
  }
}

// ── LOGIN ─────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password)
    return showToast("Email and password are required.", "error");

  try {
    const data = await apiCall("/auth/login", "POST", { email, password });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("pe_token", token);
    localStorage.setItem("pe_user", JSON.stringify(currentUser));
    updateNav();
    showPage("dashboard");
    showToast("Signed in successfully!");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ── LOGOUT ────────────────────────────────────
function logout() {
  token = "";
  currentUser = null;
  localStorage.removeItem("pe_token");
  localStorage.removeItem("pe_user");
  updateNav();
  showPage("home");
  showToast("Logged out.");
}

// ── ROLE SELECTION ────────────────────────────
function selectRole(el, role) {
  document
    .querySelectorAll(".role-card")
    .forEach((c) => c.classList.remove("selected"));
  el.classList.add("selected");
  selectedRole = role;
  const btn = document.getElementById("start-btn");
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
  document.getElementById("interview-role-title").textContent =
    role + " — Interview Session";
  document.getElementById("q-role-tag").textContent = role;
}

// ── START INTERVIEW ───────────────────────────
async function startInterview() {
  if (!selectedRole) return showToast("Please select a role first.");
  try {
    showToast("Loading questions…");
    const data = await apiCall(
      "/questions?role=" + encodeURIComponent(selectedRole) + "&limit=5",
    );
    loadedQuestions = data.questions;
    sessionAnswers = [];
    currentQ = 0;
    sessionStartTime = Date.now();
    updateQuestion();
    showPage("interview");
  } catch (err) {
    showToast("Failed to load questions: " + err.message, "error");
  }
}

// ── QUESTION DISPLAY ──────────────────────────
function updateQuestion() {
  const q = loadedQuestions[currentQ];
  document.getElementById("q-label").textContent = "QUESTION " + (currentQ + 1);
  document.getElementById("q-text").textContent = q.question_text;
  document.getElementById("q-num-tag").textContent =
    "Q " + (currentQ + 1) + " / " + loadedQuestions.length;
  document.getElementById("q-progress").style.width =
    ((currentQ + 1) / loadedQuestions.length) * 100 + "%";
  document.getElementById("answer-input").value = "";
  document.getElementById("feedback-panel").style.display = "none";
  timeLeft = 120;
  updateTimerDisplay();
  document.getElementById("prev-btn").style.opacity =
    currentQ === 0 ? ".3" : "1";
  const nb = document.getElementById("next-btn");
  nb.textContent =
    currentQ === loadedQuestions.length - 1 ? "Submit ✓" : "Next →";
}

// ── NEXT / SUBMIT ─────────────────────────────
async function nextQ() {
  const ans = document.getElementById("answer-input").value.trim();
  if (ans.length < 10)
    return showToast("Write at least a few words to continue.");

  const q = loadedQuestions[currentQ];
  const timeTaken = 120 - timeLeft;
  const scores = generateMockScores(ans);

  sessionAnswers.push({
    question_id: q.id,
    question_text: q.question_text,
    answer_text: ans,
    score_clarity: scores.clarity,
    score_relevance: scores.relevance,
    score_depth: scores.depth,
    score_structure: scores.structure,
    overall_score: scores.overall,
    ai_feedback: scores.feedback,
    time_taken_seconds: timeTaken,
  });

  renderFeedback(scores);
  document.getElementById("feedback-panel").style.display = "block";
  document
    .getElementById("feedback-panel")
    .scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("AI feedback generated!");

  if (currentQ < loadedQuestions.length - 1) {
    setTimeout(() => {
      currentQ++;
      updateQuestion();
    }, 1800);
  } else {
    setTimeout(submitSession, 2000);
  }
}

function prevQ() {
  if (currentQ > 0) {
    currentQ--;
    updateQuestion();
  }
}

// ── SUBMIT SESSION ────────────────────────────
async function submitSession() {
  const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
  try {
    await apiCall("/sessions", "POST", {
      role: selectedRole,
      answers: sessionAnswers,
      duration_seconds: durationSeconds,
    });
    showPage("history");
    showToast("Session complete! Results saved.");
  } catch (err) {
    showToast("Session could not be saved: " + err.message, "error");
    showPage("history");
  }
}

// ── MOCK SCORE GENERATOR ──────────────────────
function generateMockScores(answer) {
  const len = answer.split(" ").length;
  const base = Math.min(50 + len * 1.5, 95);
  const clarity = Math.round(base + (Math.random() * 10 - 5));
  const relevance = Math.round(base + (Math.random() * 10 - 5));
  const depth = Math.round(base - 10 + Math.random() * 10);
  const structure = Math.round(base + (Math.random() * 8 - 4));
  const overall = Math.round((clarity + relevance + depth + structure) / 4);
  return {
    clarity,
    relevance,
    depth,
    structure,
    overall,
    feedback: `💡 Good answer! Consider adding concrete examples to strengthen clarity. Overall score: ${overall}%.`,
  };
}

// ── RENDER FEEDBACK ───────────────────────────
function renderFeedback(scores) {
  const fill = (id, pct, color) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.width = pct + "%";
      el.style.background = color;
    }
  };
  fill("fb-fill-clarity", scores.clarity, "#5b6ef5");
  fill("fb-fill-relevance", scores.relevance, "#22d3a0");
  fill("fb-fill-depth", scores.depth, "#a78bfa");
  fill("fb-fill-structure", scores.structure, "#f59e0b");

  ["clarity", "relevance", "depth", "structure"].forEach((k) => {
    const el = document.getElementById("fb-val-" + k);
    if (el) el.textContent = scores[k] + "%";
  });

  const noteEl = document.getElementById("fb-note-text");
  if (noteEl) noteEl.textContent = scores.feedback;

  const scoreEl = document.getElementById("fb-overall-score");
  if (scoreEl) scoreEl.textContent = scores.overall + "%";

  // Animate the SVG ring (circumference = 2π×28 ≈ 176)
  const arc = document.getElementById("fb-ring-arc");
  if (arc) arc.style.strokeDashoffset = 176 - (176 * scores.overall) / 100;
}

// ── DASHBOARD ─────────────────────────────────
async function loadDashboard() {
  try {
    const [statsData, histData] = await Promise.all([
      apiCall("/sessions/stats"),
      apiCall("/sessions"),
    ]);
    const s = statsData.stats;
    document.getElementById("dash-sessions").textContent =
      s.total_sessions || 0;
    document.getElementById("dash-avg").textContent = (s.avg_score || 0) + "%";
    document.getElementById("dash-questions").textContent =
      s.total_questions || 0;
    document.getElementById("dash-top-role").textContent = s.top_role || "—";

    const recent = histData.sessions.slice(0, 3);
    const list = document.getElementById("dash-recent-list");
    if (!list) return;
    if (recent.length === 0) {
      list.innerHTML =
        '<p style="color:var(--pe-muted);padding:1rem 0">No sessions yet. Start practising!</p>';
      return;
    }
    list.innerHTML = recent.map((s) => renderHistItem(s)).join("");
  } catch (err) {
    console.error("Dashboard load error:", err.message);
  }
}

// ── HISTORY ───────────────────────────────────
async function loadHistory() {
  try {
    const data = await apiCall("/sessions");
    const list = document.getElementById("history-list-dynamic");
    if (!list) return;
    if (data.sessions.length === 0) {
      list.innerHTML =
        '<p style="color:var(--pe-muted);padding:1rem 0">No sessions yet. Start practising!</p>';
      return;
    }
    list.innerHTML = data.sessions.map((s) => renderHistItem(s)).join("");
  } catch (err) {
    console.error("History load error:", err.message);
  }
}

function renderHistItem(s) {
  const score = Math.round(s.avg_score);
  const scoreColor =
    score >= 75
      ? "var(--pe-green)"
      : score >= 55
        ? "var(--pe-accent2)"
        : "var(--pe-red)";
  const scoreBg =
    score >= 75
      ? "rgba(34,211,160,.1)"
      : score >= 55
        ? "rgba(167,139,250,.1)"
        : "rgba(248,113,113,.1)";
  const date = new Date(s.completed_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const mins = Math.round((s.duration_seconds || 0) / 60);
  return `
        <div class="hist-item">
            <div class="hist-score" style="background:${scoreBg};color:${scoreColor}">${score}%</div>
            <div class="hist-info">
                <div class="hist-role">${s.role}</div>
                <div class="hist-date">${date} · ${s.total_questions} questions · ${mins} min</div>
            </div>
        </div>`;
}

// ── TIMER ─────────────────────────────────────
function startTimer() {
  stopTimer();
  timeLeft = 120;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) stopTimer();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer-display").textContent = m + ":" + s;
}
