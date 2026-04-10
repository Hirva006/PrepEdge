// routes/questions.js
const express = require('express');
const router  = express.Router();
const { getQuestions, getRoles } = require('../controllers/questionsController');
const auth = require('../middleware/auth');

// GET /api/questions/roles
router.get('/roles', auth, getRoles);

// GET /api/questions?role=Frontend Dev&limit=5
router.get('/', auth, getQuestions);

module.exports = router;
