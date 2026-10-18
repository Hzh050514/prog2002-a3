/**
 * server.js
 * ---------------------------------------------------------------------------
 * PROG2002 - Assessment 3
 * Entry point of the RESTful API. Serves BOTH websites:
 *   - the client-side website (public)
 *   - the admin-side website  (event management)
 *
 * Run:  npm install && npm start
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const eventsRoutes = require('./routes/events');
const registrationsRoutes = require('./routes/registrations');
const categoriesRoutes = require('./routes/categories');
const weatherRoutes = require('./routes/weather');
const { ping } = require('./event_db');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Allow the two Angular sites (running on different ports / deployed on
// different cPanel folders) to call this API from the browser.
app.use(cors());
app.use(express.json());

// cPanel deploys this app under a sub-path (e.g. https://host/a3api/api/...).
// Passenger forwards the FULL URL, so strip the mount prefix ("/a3api")
// before routing - locally there is no prefix and this is a no-op.
app.use((req, res, next) => {
  if (req.url === '/a3api' || req.url === '/a3api/') {
    req.url = '/';
  } else if (req.url.startsWith('/a3api/')) {
    req.url = req.url.slice('/a3api'.length);
  }
  next();
});

/** Friendly root so a browser hit on the API host documents itself. */
app.get('/', (req, res) => {
  res.json({
    name: 'PROG2002 A3 - Charity Events API',
    endpoints: [
      'GET    /api/events',
      'GET    /api/events/:id',
      'POST   /api/events',
      'PUT    /api/events/:id',
      'DELETE /api/events/:id',
      'GET    /api/categories',
      'GET    /api/registrations?event_id=',
      'POST   /api/registrations',
      'GET    /api/weather?latitude=&longitude=',
      'GET    /api/health',
    ],
  });
});

/** Verifies the Express process can reach MySQL - handy after deploying. */
app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({ api: 'ok', database: 'ok' });
  } catch (err) {
    res.status(500).json({ api: 'ok', database: 'unreachable', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Resource routes
// ---------------------------------------------------------------------------
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/weather', weatherRoutes);

// ---------------------------------------------------------------------------
// 404 + central error handling
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ error: 'Unexpected server error.', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`Charity Events API listening on http://localhost:${PORT}`);
});
