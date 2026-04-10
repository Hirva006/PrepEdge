// app.js — PrepEdge Frontend (API-connected version)
// ─────────────────────────────────────────────
//  All API calls go to the backend defined in API_BASE.
//  The token is saved to localStorage after login.
// ─────────────────────────────────────────────

require('dotenv').config();

const API_BASE = 'http://localhost:5000/api'; // change in production

// ── AUTH STATE ────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem('pe_user') || 'null');
let token       = localStorage.getItem('pe_token') || '';

let currentQ        = 0;
let selectedRole    = '';
let timerInterval   = null;
let timeLeft        = 120;
let loadedQuestions = [];          // questions fetched from DB for this session
let sessionAnswers  = [];          // answers collected during the session
let sessionStartTime = null;

// ── HELPERS ───────────────────────────────────

// apiCall wraps fetch with auth headers and JSON parsing
async function apiCall(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'interview') startTimer();
  else stopTimer();
  if (name === 'dashboard') loadDashboard();
  if (name === 'history')   loadHistory();
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' toast-' + type : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── SIGN UP ───────────────────────────────────
async function handleSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  try {
    const data = await apiCall('/auth/signup', 'POST', { full_name: name, email, password });
    token       = data.token;
    currentUser = data.user;
    localStorage.setItem('pe_token', token);
    localStorage.setItem('pe_user', JSON.stringify(currentUser));
    showPage('roles');
    showToast('Account created! Pick your role.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── LOGIN ─────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    token       = data.token;
    currentUser = data.user;
    localStorage.setItem('pe_token', token);
    localStorage.setItem('pe_user', JSON.stringify(currentUser));
    showPage('dashboard');
    showToast('Signed in successfully!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── LOGOUT ────────────────────────────────────
function logout() {
  token       = '';
  currentUser = null;
  localStorage.removeItem('pe_token');
  localStorage.removeItem('pe_user');
  showPage('home');
  showToast('Logged out.');
}

// ── ROLE SELECTION ────────────────────────────
function selectRole(el, role) {
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedRole = role;
  const btn = document.getElementById('start-btn');
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
  document.getElementById('interview-role-title').textContent = role + ' — Interview Session';
  document.getElementById('q-role-tag').textContent = role;
}

// ── START INTERVIEW (fetches questions from DB) ──
async function startInterview() {
  if (!selectedRole) return showToast('Please select a role first.');
  try {
    showToast('Loading questions…');
    const data = await apiCall('/questions?role=' + encodeURIComponent(selectedRole) + '&limit=5');
    loadedQuestions = data.questions;
    sessionAnswers  = [];
    currentQ        = 0;
    sessionStartTime = Date.now();
    updateQuestion();
    showPage('interview');
  } catch (err) {
    showToast('Failed to load questions: ' + err.message, 'error');
  }
}

// ── QUESTION DISPLAY ──────────────────────────
function updateQuestion() {
  const q = loadedQuestions[currentQ];
  document.getElementById('q-label').textContent   = 'QUESTION ' + (currentQ + 1);
  document.getElementById('q-text').textContent    = q.question_text;
  document.getElementById('q-num-tag').textContent = 'Q ' + (currentQ + 1) + ' / ' + loadedQuestions.length;
  document.getElementById('q-progress').style.width = ((currentQ + 1) / loadedQuestions.length * 100) + '%';
  document.getElementById('answer-input').value    = '';
  document.getElementById('feedback-panel').style.display = 'none';
  timeLeft = 120;
  updateTimerDisplay();
  document.getElementById('prev-btn').style.opacity = currentQ === 0 ? '.3' : '1';
  const nb = document.getElementById('next-btn');
  nb.textContent = currentQ === loadedQuestions.length - 1 ? 'Submit ✓' : 'Next →';
}

// ── NEXT QUESTION / SUBMIT ────────────────────
async function nextQ() {
  const ans = document.getElementById('answer-input').value.trim();
  if (ans.length < 10) {
    return showToast('Write at least a few words to continue.');
  }

  const q = loadedQuestions[currentQ];

  // Simulate AI scoring (replace with real AI call if desired)
  const timeTaken    = 120 - timeLeft;
  const mockScores   = generateMockScores(ans);

  // Record this answer
  sessionAnswers.push({
    question_id:        q.id,
    question_text:      q.question_text,
    answer_text:        ans,
    score_clarity:      mockScores.clarity,
    score_relevance:    mockScores.relevance,
    score_depth:        mockScores.depth,
    score_structure:    mockScores.structure,
    overall_score:      mockScores.overall,
    ai_feedback:        mockScores.feedback,
    time_taken_seconds: timeTaken,
  });

  // Show feedback panel
  renderFeedback(mockScores);
  document.getElementById('feedback-panel').style.display = 'block';
  document.getElementById('feedback-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('AI feedback generated!');

  if (currentQ < loadedQuestions.length - 1) {
    setTimeout(() => { currentQ++; updateQuestion(); }, 1800);
  } else {
    // Last question — save session and go to history
    setTimeout(async () => {
      await submitSession();
    }, 2000);
  }
}

// ── SUBMIT SESSION TO BACKEND ─────────────────
async function submitSession() {
  const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
  try {
    await apiCall('/sessions', 'POST', {
      role: selectedRole,
      answers: sessionAnswers,
      duration_seconds: durationSeconds,
    });
    showPage('history');
    showToast('Session complete! Results saved.');
  } catch (err) {
    showToast('Session could not be saved: ' + err.message, 'error');
    showPage('history');
  }
}

// ── LOAD DASHBOARD ────────────────────────────
async function loadDashboard() {
  try {
    const data = await apiCall('/sessions/stats');
    const s = data.stats;
    document.getElementById('dash-sessions').textContent   = s.total_sessions || 0;
    document.getElementById('dash-avg').textContent        = (s.avg_score || 0) + '%';
    document.getElementById('dash-questions').textContent  = s.total_questions || 0;
    document.getElementById('dash-top-role').textContent   = s.top_role || '—';
  } catch (err) {
    console.error('Dashboard load error:', err.message);
  }
}

// ── LOAD HISTORY ──────────────────────────────
async function loadHistory() {
  try {
    const data = await apiCall('/sessions');
    const list = document.getElementById('history-list-dynamic');
    if (!list) return;

    if (data.sessions.length === 0) {
      list.innerHTML = '<p style="color:var(--pe-muted);padding:1rem 0">No sessions yet. Start practising!</p>';
      return;
    }

    list.innerHTML = data.sessions.map(s => {
      const scoreColor = s.avg_score >= 75 ? 'var(--pe-green)' : s.avg_score >= 55 ? 'var(--pe-amber)' : 'var(--pe-red)';
      const scoreBg    = s.avg_score >= 75 ? 'rgba(34,211,160,.1)' : s.avg_score >= 55 ? 'rgba(245,158,11,.1)' : 'rgba(248,113,113,.1)';
      const date = new Date(s.completed_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
      const mins = Math.round((s.duration_seconds || 0) / 60);
      return `
        <div class="hist-item">
          <div class="hist-score" style="background:${scoreBg};color:${scoreColor}">${Math.round(s.avg_score)}%</div>
          <div class="hist-info">
            <div class="hist-role">${s.role}</div>
            <div class="hist-date">${date} · ${s.total_questions} questions · ${mins} min</div>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('History load error:', err.message);
  }
}

// ── MOCK SCORE GENERATOR ──────────────────────
// Gives instant feedback without a separate AI call.
// Replace with a real API call to Claude/OpenAI if desired.
function generateMockScores(answer) {
  const len = answer.split(' ').length;
  const base = Math.min(50 + len * 1.5, 95);
  const clarity    = Math.round(base + (Math.random() * 10 - 5));
  const relevance  = Math.round(base + (Math.random() * 10 - 5));
  const depth      = Math.round(base - 10 + (Math.random() * 10));
  const structure  = Math.round(base + (Math.random() * 8 - 4));
  const overall    = Math.round((clarity + relevance + depth + structure) / 4);
  return {
    clarity, relevance, depth, structure, overall,
    feedback: `Good answer! Consider adding concrete examples to strengthen clarity. Overall score: ${overall}%.`
  };
}

// ── RENDER FEEDBACK PANEL ─────────────────────
function renderFeedback(scores) {
  const fill = (id, pct, color) => {
    const el = document.getElementById(id);
    if (el) { el.style.width = pct + '%'; el.style.background = color; }
  };
  fill('fb-fill-clarity',   scores.clarity,   '#5b6ef5');
  fill('fb-fill-relevance', scores.relevance, '#22d3a0');
  fill('fb-fill-depth',     scores.depth,     '#a78bfa');
  fill('fb-fill-structure', scores.structure, '#f59e0b');

  ['clarity','relevance','depth','structure'].forEach(k => {
    const el = document.getElementById('fb-val-' + k);
    if (el) el.textContent = scores[k] + '%';
  });
  const note = document.getElementById('fb-note-text');
  if (note) note.textContent = scores.feedback;

  const scoreEl = document.getElementById('fb-overall-score');
  if (scoreEl) scoreEl.textContent = scores.overall + '%';
}

function prevQ() {
  if (currentQ > 0) { currentQ--; updateQuestion(); }
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
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = m + ':' + s;
}
