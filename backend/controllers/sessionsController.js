// controllers/sessionsController.js
const Session = require('../models/Session');

// POST /api/sessions  (protected)
async function saveSession(req, res) {
  const { role, answers, duration_seconds = 0 } = req.body;
  const userId = req.user.id;

  if (!role || !Array.isArray(answers) || answers.length === 0)
    return res.status(400).json({ error: 'role and answers are required.' });

  try {
    const avgScore =
      answers.reduce((sum, a) => sum + (a.overall_score || 0), 0) / answers.length;

    const session = await Session.create({
      user_id: userId,
      role,
      total_questions: answers.length,
      avg_score: parseFloat(avgScore.toFixed(2)),
      duration_seconds,
      answers,
    });

    res.status(201).json({
      message: 'Session saved!',
      session_id: session._id,
      avg_score: session.avg_score,
    });
  } catch (err) {
    console.error('Save session error:', err);
    res.status(500).json({ error: 'Failed to save session.' });
  }
}

// GET /api/sessions  (protected)
async function getHistory(req, res) {
  const userId = req.user.id;
  try {
    const sessions = await Session.find({ user_id: userId })
      .sort({ completed_at: -1 })
      .limit(50)
      .select('role total_questions avg_score duration_seconds completed_at');

    res.json({ sessions });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
}

// GET /api/sessions/:id  (protected)
async function getSession(req, res) {
  const userId = req.user.id;
  try {
    const session = await Session.findOne({ _id: req.params.id, user_id: userId });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json({ session, answers: session.answers });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
}

// GET /api/sessions/stats  (protected)
async function getStats(req, res) {
  const userId = req.user.id;
  try {
    const agg = await Session.aggregate([
      { $match: { user_id: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      {
        $group: {
          _id: null,
          total_sessions:  { $sum: 1 },
          avg_score:       { $avg: '$avg_score' },
          total_questions: { $sum: '$total_questions' },
        },
      },
    ]);

    // Find most-used role
    const roleAgg = await Session.aggregate([
      { $match: { user_id: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const base = agg[0] || { total_sessions: 0, avg_score: 0, total_questions: 0 };
    res.json({
      stats: {
        total_sessions:  base.total_sessions,
        avg_score:       parseFloat((base.avg_score || 0).toFixed(2)),
        total_questions: base.total_questions,
        top_role:        roleAgg[0]?._id || null,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
}

module.exports = { saveSession, getHistory, getSession, getStats };
