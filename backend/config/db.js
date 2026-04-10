// config/db.js
// ─────────────────────────────────────────────
//  MongoDB connection using Mongoose.
//  Call connectDB() once at server startup.
// ─────────────────────────────────────────────
const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/prepedge_db';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
