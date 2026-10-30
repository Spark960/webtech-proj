// server.js — Main Express application entry point
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
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

// --- Routes ---

// Helper to serve HTML with server-side rendered navigation
function sendPage(req, res, filename) {
  const filePath = path.join(__dirname, '..', 'public', filename);
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page');

    const isLoggedIn = !!(req.session && req.session.userId);
    const navItems = isLoggedIn
      ? `<li><a href="/index.html">Browse Skills</a></li>
          <li><a href="/dashboard.html">My Dashboard</a></li>
          <li><a href="#" id="logout-btn">Logout</a></li>`
      : `<li><a href="/index.html">Browse Skills</a></li>
          <li><a href="/login.html">Login / Register</a></li>`;

    const rendered = html.replace(
      /<ul id="nav-list">[\s\S]*?<\/ul>/,
      `<ul id="nav-list">\n          ${navItems}\n        </ul>`
    );

    res.send(rendered);
  });
}

// Page routes (rendered with authentic server session state)
app.get(['/', '/index.html'], (req, res) => {
  sendPage(req, res, 'index.html');
});

app.get('/dashboard.html', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login.html');
  }
  sendPage(req, res, 'dashboard.html');
});

app.get('/login.html', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard.html');
  }
  sendPage(req, res, 'login.html');
});

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/interests', interestRoutes);

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
