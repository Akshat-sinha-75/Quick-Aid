const express = require('express');
const multer = require('multer');
const path = require('path');
const getSupabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { analyzeWound } = require('../services/aiService');
const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// POST /api/wounds - Create new wound case
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, bodyLocation, description, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a wound image' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Analyze with Gemini
    const aiResult = await analyzeWound(imagePath, notes || description || '');

    // Create wound record
    const { data: wound, error: woundError } = await getSupabase()
      .from('wounds')
      .insert({
        user_id: req.user._id,
        title,
        body_location: bodyLocation || null,
        description: description || null,
      })
      .select()
      .single();

    if (woundError) throw woundError;

    // Create initial entry
    const { data: entry, error: entryError } = await getSupabase()
      .from('wound_entries')
      .insert({
        wound_id: wound.id,
        image_url: imageUrl,
        analysis: aiResult.analysis || {},
        treatment: aiResult.treatment || {},
        progress: { status: 'initial', comparedToPrevious: 'Initial wound assessment', percentageHealed: 0 },
        notes: notes || null,
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // Return wound with entries (match frontend expected shape)
    res.status(201).json({
      _id: wound.id,
      ...wound,
      entries: [{ ...entry, imageUrl: entry.image_url }],
    });
  } catch (error) {
    console.error('Create wound error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wounds - Get all wounds for current user
router.get('/', protect, async (req, res) => {
  try {
    const { data: wounds, error } = await getSupabase()
      .from('wounds')
      .select('*')
      .eq('user_id', req.user._id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Fetch entries for each wound
    const woundsWithEntries = await Promise.all(
      wounds.map(async (wound) => {
        const { data: entries } = await getSupabase()
          .from('wound_entries')
          .select('*')
          .eq('wound_id', wound.id)
          .order('created_at', { ascending: true });

        return {
          _id: wound.id,
          ...wound,
          userId: wound.user_id,
          bodyLocation: wound.body_location,
          createdAt: wound.created_at,
          updatedAt: wound.updated_at,
          entries: (entries || []).map(e => ({
            ...e,
            imageUrl: e.image_url,
            createdAt: e.created_at,
          })),
        };
      })
    );

    res.json(woundsWithEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wounds/:id - Get wound details
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: wound, error } = await getSupabase()
      .from('wounds')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user._id)
      .single();

    if (error || !wound) {
      return res.status(404).json({ message: 'Wound not found' });
    }

    const { data: entries } = await getSupabase()
      .from('wound_entries')
      .select('*')
      .eq('wound_id', wound.id)
      .order('created_at', { ascending: true });

    res.json({
      _id: wound.id,
      ...wound,
      userId: wound.user_id,
      bodyLocation: wound.body_location,
      createdAt: wound.created_at,
      updatedAt: wound.updated_at,
      entries: (entries || []).map(e => ({
        ...e,
        imageUrl: e.image_url,
        createdAt: e.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/wounds/:id/entries - Add follow-up entry
router.post('/:id/entries', protect, upload.single('image'), async (req, res) => {
  try {
    // Verify wound belongs to user
    const { data: wound, error: woundErr } = await getSupabase()
      .from('wounds')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user._id)
      .single();

    if (woundErr || !wound) {
      return res.status(404).json({ message: 'Wound not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a wound image' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;
    const { notes } = req.body;

    // Get previous entries for comparison
    const { data: prevEntries } = await getSupabase()
      .from('wound_entries')
      .select('analysis, treatment')
      .eq('wound_id', wound.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const previousAnalysis = prevEntries?.[0] ? {
      analysis: prevEntries[0].analysis,
      treatment: prevEntries[0].treatment,
    } : null;

    // Analyze with Gemini (with previous context)
    const aiResult = await analyzeWound(imagePath, notes || '', previousAnalysis);

    // Insert new entry
    const { data: entry, error: entryErr } = await getSupabase()
      .from('wound_entries')
      .insert({
        wound_id: wound.id,
        image_url: imageUrl,
        analysis: aiResult.analysis || {},
        treatment: aiResult.treatment || {},
        progress: aiResult.progress || { status: 'stable', comparedToPrevious: 'Unable to determine progress', percentageHealed: 0 },
        notes: notes || null,
      })
      .select()
      .single();

    if (entryErr) throw entryErr;

    // Update wound updated_at
    await getSupabase()
      .from('wounds')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', wound.id);

    // Return full wound with all entries
    const { data: allEntries } = await getSupabase()
      .from('wound_entries')
      .select('*')
      .eq('wound_id', wound.id)
      .order('created_at', { ascending: true });

    res.status(201).json({
      _id: wound.id,
      ...wound,
      userId: wound.user_id,
      bodyLocation: wound.body_location,
      createdAt: wound.created_at,
      updatedAt: new Date().toISOString(),
      entries: (allEntries || []).map(e => ({
        ...e,
        imageUrl: e.image_url,
        createdAt: e.created_at,
      })),
    });
  } catch (error) {
    console.error('Add entry error:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/wounds/:id - Update wound status
router.patch('/:id', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.title) updates.title = req.body.title;
    updates.updated_at = new Date().toISOString();

    const { data: wound, error } = await getSupabase()
      .from('wounds')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user._id)
      .select()
      .single();

    if (error || !wound) {
      return res.status(404).json({ message: 'Wound not found' });
    }

    const { data: entries } = await getSupabase()
      .from('wound_entries')
      .select('*')
      .eq('wound_id', wound.id)
      .order('created_at', { ascending: true });

    res.json({
      _id: wound.id,
      ...wound,
      userId: wound.user_id,
      bodyLocation: wound.body_location,
      createdAt: wound.created_at,
      updatedAt: wound.updated_at,
      entries: (entries || []).map(e => ({
        ...e,
        imageUrl: e.image_url,
        createdAt: e.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
