// server.js — Main Express application entry point
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./db');
const { addUserToLocals } = require('./middleware/auth');

// Import route handlers
const authRoutes = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const interestRoutes = require('./routes/interests');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));

// Make user data available on every request
app.use(addUserToLocals);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Routes ---

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/interests', interestRoutes);

// Default route — serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --- Error Handler ---

// Catch-all error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server'
  });
});

// --- Start Server ---

async function startServer() {
  // Test database connection before starting
  await testConnection();

  app.listen(PORT, () => {
    console.log(`SkillSwap server running at http://localhost:${PORT}`);
  });
}

startServer();
