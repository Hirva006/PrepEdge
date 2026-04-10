// models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  role:          { type: String, required: true, trim: true },
  category:      { type: String, trim: true },
  question_text: { type: String, required: true },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Question', questionSchema);
