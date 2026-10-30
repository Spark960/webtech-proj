// auth.js — Authentication routes (register, login, logout, profile)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// POST /api/auth/register — Create a new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Basic email format check
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash the password and insert the new user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, department, bio) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, department || null, bio || null]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { userId: result.insertId }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/login — Sign in with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Store user info in session
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: { userId: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/logout — End the current session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/me — Get current logged-in user info from session
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not logged in'
    });
  }

  res.json({
    success: true,
    message: 'User session found',
    data: {
      userId: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail
    }
  });
});

// GET /api/auth/profile — Get full profile from database
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT name, email, department, bio, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile retrieved',
      data: users[0]
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

// PUT /api/auth/profile — Update user profile (name, department, bio)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, department, bio } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    await pool.query(
      'UPDATE users SET name = ?, department = ?, bio = ? WHERE id = ?',
      [name, department || null, bio || null, req.session.userId]
    );

    // Update the session name in case it changed
    req.session.userName = name;

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

module.exports = router;
