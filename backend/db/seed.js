// db/seed.js
// Command: node db/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

const questions = [
  // ── Frontend Dev ──────────────────────────
  { role: 'Frontend Dev', category: 'JavaScript', question_text: 'Explain the difference between var, let, and const in JavaScript. When would you use each?', difficulty: 'easy' },
  { role: 'Frontend Dev', category: 'React', question_text: 'What is the Virtual DOM in React and how does it improve performance?', difficulty: 'medium' },
  { role: 'Frontend Dev', category: 'CSS', question_text: 'Describe the CSS Box Model. How do margin, border, padding, and content interact?', difficulty: 'easy' },
  { role: 'Frontend Dev', category: 'JavaScript', question_text: 'What is event delegation and why is it useful in JavaScript?', difficulty: 'medium' },
  { role: 'Frontend Dev', category: 'JavaScript', question_text: 'Explain the difference between synchronous and asynchronous code. Give an example.', difficulty: 'medium' },
  { role: 'Frontend Dev', category: 'React', question_text: 'What are React hooks? Explain useState and useEffect with examples.', difficulty: 'medium' },
  { role: 'Frontend Dev', category: 'Performance', question_text: 'How would you optimize the performance of a slow React application?', difficulty: 'hard' },

  // ── Backend Dev ───────────────────────────
  { role: 'Backend Dev', category: 'REST', question_text: 'What is the difference between REST and GraphQL? When would you choose one over the other?', difficulty: 'medium' },
  { role: 'Backend Dev', category: 'Database', question_text: 'Explain database indexing. Why is it important and when can it hurt performance?', difficulty: 'medium' },
  { role: 'Backend Dev', category: 'Node.js', question_text: 'How does Node.js handle concurrency despite being single-threaded?', difficulty: 'medium' },
  { role: 'Backend Dev', category: 'Security', question_text: 'Explain SQL injection and how you would prevent it in a Node.js application.', difficulty: 'hard' },
  { role: 'Backend Dev', category: 'Auth', question_text: 'How does JWT authentication work? Describe the token lifecycle.', difficulty: 'medium' },

  // ── Data Science ──────────────────────────
  { role: 'Data Science', category: 'ML', question_text: 'What is the difference between supervised and unsupervised learning?', difficulty: 'easy' },
  { role: 'Data Science', category: 'Statistics', question_text: 'Explain overfitting. How do you detect and prevent it?', difficulty: 'medium' },
  { role: 'Data Science', category: 'Python', question_text: 'What is Pandas and how does it differ from NumPy for data manipulation?', difficulty: 'easy' },
  { role: 'Data Science', category: 'ML', question_text: 'Explain the bias-variance tradeoff in machine learning.', difficulty: 'hard' },

  // ── Product Manager ───────────────────────
  { role: 'Product Manager', category: 'Strategy', question_text: 'How would you prioritize a product backlog? Describe your framework.', difficulty: 'medium' },
  { role: 'Product Manager', category: 'Metrics', question_text: 'What KPIs would you track for a new mobile app feature launch?', difficulty: 'medium' },
  { role: 'Product Manager', category: 'Leadership', question_text: 'Describe a time you had to make a product decision with incomplete data.', difficulty: 'hard' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepedge_db');
    console.log('🌱 Seeding questions...');
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log(`✅ Inserted ${questions.length} questions`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
