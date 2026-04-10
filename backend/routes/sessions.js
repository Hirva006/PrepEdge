// routes/sessions.js
const express = require('express');
const router  = express.Router();
const { saveSession, getHistory, getSession, getStats } = require('../controllers/sessionsController');
const auth = require('../middleware/auth');

// All session routes require authentication
router.use(auth);

router.get('/stats',  getStats);    // GET /api/sessions/stats
router.get('/',       getHistory);  // GET /api/sessions
router.get('/:id',    getSession);  // GET /api/sessions/42
router.post('/',      saveSession); // POST /api/sessions

module.exports = router;
