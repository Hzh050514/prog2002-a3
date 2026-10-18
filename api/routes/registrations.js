/**
 * routes/registrations.js
 * ---------------------------------------------------------------------------
 * POST /api/registrations         - create a registration (client Register page)
 * GET  /api/registrations         - list registrations, optionally ?event_id=
 */

const express = require('express');
const { query, execute } = require('../event_db');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/registrations
 * Sorted by the latest registration date first, which is the order required on
 * the client event detail page.
 */
router.get('/', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    const params = [];
    let sql = `
      SELECT registration_id, event_id, name, email, phone,
             number_of_tickets, registration_date
      FROM registrations
    `;

    if (event_id) {
      sql += ' WHERE event_id = ?';
      params.push(event_id);
    }

    sql += ' ORDER BY registration_date DESC';
    res.json(await query(sql, params));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/registrations
 * Body: event_id, name, email, phone, number_of_tickets
 *
 * Rules enforced here:
 *   - the event must exist
 *   - the same email can only register once per event (UNIQUE constraint)
 *   - number_of_tickets must be a positive whole number
 */
router.post('/', async (req, res, next) => {
  try {
    const { event_id, name, email, phone = '', number_of_tickets } = req.body || {};

    // --- validation --------------------------------------------------------
    const missing = ['event_id', 'name', 'email', 'number_of_tickets'].filter(
      (key) => req.body?.[key] === undefined || req.body?.[key] === ''
    );
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}.` });
    }
    if (!EMAIL_PATTERN.test(String(email))) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const tickets = Number(number_of_tickets);
    if (!Number.isInteger(tickets) || tickets < 1) {
      return res.status(400).json({ error: 'The number of tickets must be a whole number of 1 or more.' });
    }

    const events = await query('SELECT event_id FROM events WHERE event_id = ?', [event_id]);
    if (events.length === 0) {
      return res.status(404).json({ error: `Event ${event_id} was not found.` });
    }

    // --- insert ------------------------------------------------------------
    try {
      const result = await execute(
        `INSERT INTO registrations (event_id, name, email, phone, number_of_tickets)
         VALUES (?, ?, ?, ?, ?)`,
        [event_id, name, email, phone, tickets]
      );

      res.status(201).json({
        message: 'Registration recorded successfully.',
        registration_id: result.insertId,
      });
    } catch (err) {
      // MySQL error 1062 = duplicate entry -> the UNIQUE (event_id, email) rule
      if (err && err.errno === 1062) {
        return res.status(409).json({
          error: 'This email address is already registered for this event.',
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
