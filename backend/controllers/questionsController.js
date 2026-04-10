// controllers/questionsController.js
const Question = require('../models/Question');

// GET /api/questions?role=Frontend Dev&limit=5
async function getQuestions(req, res) {
  const { role, limit = 5 } = req.query;

  if (!role)
    return res.status(400).json({ error: 'role query parameter is required.' });

  try {
    // Aggregate with $sample for random selection
    const questions = await Question.aggregate([
      { $match: { role } },
      { $sample: { size: parseInt(limit) } },
      { $project: { id: '$_id', _id: 0, question_text: 1, category: 1, difficulty: 1 } },
    ]);

    if (questions.length === 0)
      return res.status(404).json({ error: `No questions found for role: ${role}` });

    res.json({ questions });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Server error fetching questions.' });
  }
}

// GET /api/questions/roles
async function getRoles(req, res) {
  try {
    const roles = await Question.distinct('role');
    res.json({ roles: roles.sort() });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching roles.' });
  }
}

module.exports = { getQuestions, getRoles };
