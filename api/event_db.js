/**
 * event_db.js
 * ---------------------------------------------------------------------------
 * PROG2002 - Assessment 3 (Part 1: database)
 *
 * Single place where the Node.js backend talks to MySQL.
 * Everything is exported through a small helper (`query`) so the route files
 * never deal with connection handling themselves.
 *
 * A connection *pool* is used (instead of a single connection) because the API
 * serves two separate websites at the same time and a pool re-uses connections
 * safely across concurrent requests.
 */

require('dotenv').config();

const mysql = require('mysql2/promise');

/**
 * MySQL connection pool.
 * All values come from the .env file so no credential is hard-coded.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prog2002_a3',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

/**
 * Run a parameterised SQL statement.
 * Prepared statements are used everywhere (`?` placeholders) to prevent
 * SQL injection coming from user supplied input.
 *
 * @param {string} sql    SQL statement with `?` placeholders
 * @param {any[]}  params values bound to the placeholders
 * @returns {Promise<any[]>} the result rows
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Convenience helper for statements that do not return rows
 * (INSERT / UPDATE / DELETE). Returns the driver result object which carries
 * `insertId` and `affectedRows`.
 */
async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/** Lightweight connectivity check used by the /api/health endpoint. */
async function ping() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, execute, ping };
