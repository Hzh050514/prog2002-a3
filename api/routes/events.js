/**
 * routes/events.js
 * ---------------------------------------------------------------------------
 * PROG2002 - Assessment 3 (Part 2: RESTful API improvement)
 *
 * Endpoints
 *   GET    /api/events           list / search events   (client Home + Search)
 *   GET    /api/events/:id       one event + ALL of its registrations
 *                                (client Event Detail page)
 *   POST   /api/events           create a charity event        (admin New)
 *   PUT    /api/events/:id       update an existing event      (admin Update)
 *   DELETE /api/events/:id       delete an event - BLOCKED when the event
 *                                already has registrations     (admin Delete)
 */

const express = require('express');
const { query, execute } = require('../event_db');

const router = express.Router();

/** Columns returned by every "read event" query. */
const SELECT_EVENT = `
  SELECT e.event_id, e.event_name, e.event_description, e.event_date,
         e.event_location, e.latitude, e.longitude,
         e.organiser_name, e.contact_email, e.contact_phone,
         e.category_id, c.name AS category_name, e.status,
         e.target_funding, e.current_funding
  FROM events e
  JOIN categories c ON c.category_id = e.category_id
`;

/** Columns returned by every "read registration" query. */
const SELECT_REGISTRATION = `
  SELECT registration_id, event_id, name, email, phone,
         number_of_tickets, registration_date
  FROM registrations
`;

/** Valid life-cycle values (matches the ENUM in the schema). */
const VALID_STATUSES = ['Active', 'Past', 'Suspended'];

/**
 * GET /api/events
 * Optional query-string filters used by the client search page:
 *   ?q=            free text on name / description / organiser
 *   ?category_id=  filter by category
 *   ?status=       Active | Past | Suspended
 *   ?location=     partial match on the location string
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, category_id, status, location } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push('(e.event_name LIKE ? OR e.event_description LIKE ? OR e.organiser_name LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (category_id) {
      where.push('e.category_id = ?');
      params.push(category_id);
    }
    if (status) {
      where.push('e.status = ?');
      params.push(status);
    }
    if (location) {
      where.push('e.event_location LIKE ?');
      params.push(`%${location}%`);
    }

    let sql = SELECT_EVENT;
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    sql += ' ORDER BY e.event_date ASC';

    const events = await query(sql, params);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/events/:id
 * Returns the event together with every registration recorded for it,
 * sorted by the LATEST purchase date first (requirement of Part 3).
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id.' });
    }

    const rows = await query(SELECT_EVENT + ' WHERE e.event_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: `Event ${id} was not found.` });
    }

    const registrations = await query(
      SELECT_REGISTRATION + ' WHERE event_id = ? ORDER BY registration_date DESC',
      [id]
    );

    const totalTickets = registrations.reduce(
      (sum, r) => sum + Number(r.number_of_tickets),
      0
    );

    res.json({ ...rows[0], registrations, total_tickets: totalTickets });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/events  -  insert a new charity event.
 * Body: event_name, event_description, event_date, event_location,
 *       latitude, longitude, organiser_name, contact_email, contact_phone,
 *       category_id, status, target_funding, current_funding
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      event_name,
      event_description = '',
      event_date,
      event_location,
      latitude = null,
      longitude = null,
      organiser_name,
      contact_email = '',
      contact_phone = '',
      category_id,
      status = 'Active',
      target_funding = 0,
      current_funding = 0,
    } = req.body || {};

    // --- server side validation -------------------------------------------
    const required = { event_name, event_date, event_location, organiser_name, category_id };
    const missing = Object.keys(required).filter((key) => !required[key]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missing.join(', ')}.`,
      });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}.` });
    }

    const categories = await query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [category_id]
    );
    if (categories.length === 0) {
      return res.status(400).json({ error: 'The selected category does not exist.' });
    }

    // --- insert ------------------------------------------------------------
    const result = await execute(
      `INSERT INTO events
         (event_name, event_description, event_date, event_location,
          latitude, longitude, organiser_name, contact_email, contact_phone,
          category_id, status, target_funding, current_funding)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_name, event_description, event_date, event_location,
        latitude, longitude, organiser_name, contact_email, contact_phone,
        category_id, status, target_funding, current_funding,
      ]
    );

    res.status(201).json({
      message: 'Charity event created successfully.',
      event_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/events/:id  -  update the details of an existing event.
 * Only the fields that are actually supplied are written, so the admin form
 * can submit a partial payload.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id.' });
    }

    const existing = await query('SELECT event_id FROM events WHERE event_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: `Event ${id} was not found.` });
    }

    const allowed = [
      'event_name', 'event_description', 'event_date', 'event_location',
      'latitude', 'longitude', 'organiser_name', 'contact_email', 'contact_phone',
      'category_id', 'status', 'target_funding', 'current_funding',
    ];

    const fields = [];
    const params = [];

    for (const field of allowed) {
      if (req.body && req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields supplied to update.' });
    }
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}.` });
    }

    params.push(id);
    await execute(`UPDATE events SET ${fields.join(', ')} WHERE event_id = ?`, params);

    res.json({ message: 'Charity event updated successfully.', event_id: id });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/events/:id
 * Data-integrity rule: an event may only be removed while it has NOT received
 * any registration. Otherwise a 409 Conflict is returned and nothing is deleted.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id.' });
    }

    const existing = await query('SELECT event_id, event_name FROM events WHERE event_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: `Event ${id} was not found.` });
    }

    const registrationCount = await query(
      'SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?',
      [id]
    );

    if (Number(registrationCount[0].total) > 0) {
      return res.status(409).json({
        error:
          `Cannot delete "${existing[0].event_name}" because it already has ` +
          `${registrationCount[0].total} registration(s). Remove the registrations first.`,
      });
    }

    await execute('DELETE FROM events WHERE event_id = ?', [id]);
    res.json({ message: 'Charity event deleted successfully.', event_id: id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
