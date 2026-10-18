/**
 * routes/categories.js
 * ---------------------------------------------------------------------------
 * GET /api/categories  -  all event categories.
 * Used by the client search drop-down and by the admin event forms.
 */

const express = require('express');
const { query } = require('../event_db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await query(
      'SELECT category_id, name, description FROM categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
