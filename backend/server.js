const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const learningRoutes = require('./routes/learningRoutes');
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminWithdrawalRoutes = require('./routes/adminWithdrawalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adRoutes = require('./routes/adRoutes');

const app = express();

// Middleware
const rawOrigin = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigin.includes(',') ? rawOrigin.split(',').map(s => s.trim()) : rawOrigin;
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Health-check endpoint (Preserved from Step 1)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VELoop Rewards Backend is running!'
  });
});

// Step 2: Learning API Module (Isolated, in-memory endpoints for learning REST fundamentals)
app.use('/api/learning/users', learningRoutes);

// Step 5: Authentication & Authorization Modules
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);

// Step 6 & 8-11: User Profile & Wallet Rewards Module
app.use('/api/profile', profileRoutes);

// Step 11: Admin Withdrawal Management Module
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);

// Admin Management Console & Security Audit Ledger
app.use('/api/admin', adminRoutes);

// Phase 2B.1: Ad Watching & Reward Engine Module
app.use('/api/ads', adRoutes);

// Error handling middleware for malformed JSON and unexpected server errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received'
    });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

/**
 * Asynchronously starts the backend:
 * 1. Connects to MongoDB Atlas first.
 * 2. Starts Express HTTP listener only after database is connected.
 * 3. Safely exits with code 1 if database connection fails.
 */
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Accepting requests from: ${rawOrigin}`);
    });
  } catch (error) {
    console.error(`[Server Startup Aborted] Server will not start: ${error.message}`);
    process.exit(1);
  }
};

// Start the server when executed directly (node server.js or nodemon server.js).
// When imported by automated tests (Supertest), this block is skipped to keep unit tests fast and independent.
if (require.main === module) {
  startServer();
}

module.exports = app;
