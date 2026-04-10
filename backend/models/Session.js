// models/Session.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
  question_text:      { type: String, required: true },
  answer_text:        { type: String, required: true },
  score_clarity:      { type: Number, default: 0 },
  score_relevance:    { type: Number, default: 0 },
  score_depth:        { type: Number, default: 0 },
  score_structure:    { type: Number, default: 0 },
  overall_score:      { type: Number, default: 0 },
  ai_feedback:        { type: String, default: null },
  time_taken_seconds: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at' } });

const sessionSchema = new mongoose.Schema({
  user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:             { type: String, required: true },
  total_questions:  { type: Number, default: 5 },
  avg_score:        { type: Number, default: 0 },
  duration_seconds: { type: Number, default: 0 },
  answers:          [answerSchema],
}, { timestamps: { createdAt: 'completed_at', updatedAt: false } });

module.exports = mongoose.model('Session', sessionSchema);
