// interests.js — Interest routes (send, view, accept/decline skill exchange requests)
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// All interest routes require authentication
router.use(requireAuth);

// POST /api/interests — Send interest in a skill
router.post('/', async (req, res) => {
  try {
    const { skill_id, message } = req.body;

    if (!skill_id) {
      return res.status(400).json({
        success: false,
        message: 'Skill ID is required'
      });
    }

    // Find the skill and its owner
    const [skills] = await pool.query(
      'SELECT id, user_id FROM skills WHERE id = ?',
      [skill_id]
    );

    if (skills.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const skill = skills[0];

    // Can't send interest in your own skill
    if (skill.user_id === req.session.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot express interest in your own skill'
      });
    }

    // Check for duplicate interest (same user, same skill)
    const [duplicate] = await pool.query(
      'SELECT id FROM interests WHERE from_user = ? AND skill_id = ?',
      [req.session.userId, skill_id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already expressed interest in this skill'
      });
    }

    // Insert the interest record
    const [result] = await pool.query(
      'INSERT INTO interests (from_user, to_user, skill_id, message) VALUES (?, ?, ?, ?)',
      [req.session.userId, skill.user_id, skill_id, message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Interest sent successfully',
      data: { interestId: result.insertId }
    });
  } catch (err) {
    console.error('Send interest error:', err);
    res.status(500).json({ success: false, message: 'Error sending interest' });
  }
});

// GET /api/interests/incoming — Get interests others sent TO your skills
router.get('/incoming', async (req, res) => {
  try {
    const [interests] = await pool.query(
      `SELECT i.*, 
              u.name AS sender_name, u.email AS sender_email, u.department AS sender_department,
              s.title AS skill_title, s.type AS skill_type, s.category AS skill_category
       FROM interests i
       JOIN users u ON i.from_user = u.id
       JOIN skills s ON i.skill_id = s.id
       WHERE i.to_user = ?
       ORDER BY i.created_at DESC`,
      [req.session.userId]
    );

    res.json({
      success: true,
      message: 'Incoming interests retrieved',
      data: interests
    });
  } catch (err) {
    console.error('Get incoming interests error:', err);
    res.status(500).json({ success: false, message: 'Error fetching incoming interests' });
  }
});

// GET /api/interests/outgoing — Get interests you sent to others
router.get('/outgoing', async (req, res) => {
  try {
    const [interests] = await pool.query(
      `SELECT i.*,
              u.name AS recipient_name, u.email AS recipient_email, u.department AS recipient_department,
              s.title AS skill_title, s.type AS skill_type, s.category AS skill_category
       FROM interests i
       JOIN users u ON i.to_user = u.id
       JOIN skills s ON i.skill_id = s.id
       WHERE i.from_user = ?
       ORDER BY i.created_at DESC`,
      [req.session.userId]
    );

    res.json({
      success: true,
      message: 'Outgoing interests retrieved',
      data: interests
    });
  } catch (err) {
    console.error('Get outgoing interests error:', err);
    res.status(500).json({ success: false, message: 'Error fetching outgoing interests' });
  }
});

// PUT /api/interests/:id/accept — Accept an interest (skill owner only)
router.put('/:id/accept', async (req, res) => {
  try {
    // Find the interest and verify ownership
    const [interests] = await pool.query(
      'SELECT i.*, u.email AS sender_email, u.name AS sender_name FROM interests i JOIN users u ON i.from_user = u.id WHERE i.id = ?',
      [req.params.id]
    );

    if (interests.length === 0) {
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }

    const interest = interests[0];

    // Only the skill owner (to_user) can accept
    if (interest.to_user !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the skill owner can accept interests'
      });
    }

    // Check it's still pending
    if (interest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This interest has already been ${interest.status}`
      });
    }

    // Update status to accepted
    await pool.query(
      'UPDATE interests SET status = ? WHERE id = ?',
      ['accepted', req.params.id]
    );

    // Return the sender's email so they can get in touch
    res.json({
      success: true,
      message: 'Interest accepted! You can now connect.',
      data: {
        senderEmail: interest.sender_email,
        senderName: interest.sender_name
      }
    });
  } catch (err) {
    console.error('Accept interest error:', err);
    res.status(500).json({ success: false, message: 'Error accepting interest' });
  }
});

// PUT /api/interests/:id/decline — Decline an interest (skill owner only)
router.put('/:id/decline', async (req, res) => {
  try {
    const [interests] = await pool.query(
      'SELECT * FROM interests WHERE id = ?',
      [req.params.id]
    );

    if (interests.length === 0) {
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }

    const interest = interests[0];

    // Only the skill owner can decline
    if (interest.to_user !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the skill owner can decline interests'
      });
    }

    if (interest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This interest has already been ${interest.status}`
      });
    }

    await pool.query(
      'UPDATE interests SET status = ? WHERE id = ?',
      ['declined', req.params.id]
    );

    res.json({
      success: true,
      message: 'Interest declined'
    });
  } catch (err) {
    console.error('Decline interest error:', err);
    res.status(500).json({ success: false, message: 'Error declining interest' });
  }
});

module.exports = router;
