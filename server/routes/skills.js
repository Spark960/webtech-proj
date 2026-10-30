// skills.js — Skill card routes (CRUD for teach/learn skill cards)
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/skills — Create a new skill card
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, title, description, category } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Type and title are required'
      });
    }

    // Type must be either "teach" or "learn"
    if (type !== 'teach' && type !== 'learn') {
      return res.status(400).json({
        success: false,
        message: 'Type must be "teach" or "learn"'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO skills (user_id, type, title, description, category) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, type, title, description || null, category || null]
    );

    res.status(201).json({
      success: true,
      message: 'Skill card created',
      data: { skillId: result.insertId }
    });
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ success: false, message: 'Error creating skill card' });
  }
});

// GET /api/skills/mine — Get current user's skill cards
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [skills] = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email, u.department
       FROM skills s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [req.session.userId]
    );

    res.json({
      success: true,
      message: 'Your skills retrieved',
      data: skills
    });
  } catch (err) {
    console.error('Get my skills error:', err);
    res.status(500).json({ success: false, message: 'Error fetching your skills' });
  }
});

// GET /api/skills — List all skills with optional filtering
router.get('/', async (req, res) => {
  try {
    const { search, type, category } = req.query;

    // Build the query dynamically based on filters
    let query = `
      SELECT s.*, u.name AS user_name, u.email AS user_email, u.department
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by search term (matches title or description)
    if (search) {
      query += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filter by type (teach or learn)
    if (type && (type === 'teach' || type === 'learn')) {
      query += ' AND s.type = ?';
      params.push(type);
    }

    // Filter by category
    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    query += ' ORDER BY s.created_at DESC';

    const [skills] = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Skills retrieved',
      data: skills
    });
  } catch (err) {
    console.error('Get skills error:', err);
    res.status(500).json({ success: false, message: 'Error fetching skills' });
  }
});

// GET /api/skills/:id — Get a single skill with full user info
router.get('/:id', async (req, res) => {
  try {
    const [skills] = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email, u.department, u.bio AS user_bio
       FROM skills s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (skills.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    res.json({
      success: true,
      message: 'Skill retrieved',
      data: skills[0]
    });
  } catch (err) {
    console.error('Get skill error:', err);
    res.status(500).json({ success: false, message: 'Error fetching skill' });
  }
});

// PUT /api/skills/:id — Update your own skill card
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { type, title, description, category } = req.body;

    // First check if the skill exists and belongs to the current user
    const [existing] = await pool.query(
      'SELECT user_id FROM skills WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    if (existing[0].user_id !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own skills'
      });
    }

    // Validate required fields
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Type and title are required'
      });
    }

    if (type !== 'teach' && type !== 'learn') {
      return res.status(400).json({
        success: false,
        message: 'Type must be "teach" or "learn"'
      });
    }

    await pool.query(
      'UPDATE skills SET type = ?, title = ?, description = ?, category = ? WHERE id = ?',
      [type, title, description || null, category || null, req.params.id]
    );

    res.json({
      success: true,
      message: 'Skill updated successfully'
    });
  } catch (err) {
    console.error('Update skill error:', err);
    res.status(500).json({ success: false, message: 'Error updating skill' });
  }
});

// DELETE /api/skills/:id — Delete your own skill card
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Check ownership before deleting
    const [existing] = await pool.query(
      'SELECT user_id FROM skills WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    if (existing[0].user_id !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own skills'
      });
    }

    await pool.query('DELETE FROM skills WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (err) {
    console.error('Delete skill error:', err);
    res.status(500).json({ success: false, message: 'Error deleting skill' });
  }
});

module.exports = router;
