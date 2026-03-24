const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const getSupabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const { data: existing } = await getSupabase()
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error } = await getSupabase()
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .select('id, name, email, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await getSupabase()
      .from('users')
      .select('id, name, email, password')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (email) {
      const { data: existing } = await getSupabase()
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', req.user.id)
        .single();

      if (existing) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    const { data: updatedUser, error } = await getSupabase()
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, name, email, created_at')
      .single();

    if (error) throw error;

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      token: generateToken(updatedUser.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
