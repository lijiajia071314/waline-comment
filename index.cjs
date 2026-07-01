const { Pool } = require('pg');
const Application = require('@waline/vercel');

// Ensure counter table exists with correct schema
async function ensureCounterTable() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wl_counter (
        id SERIAL PRIMARY KEY,
        url VARCHAR(255) NOT NULL UNIQUE,
        views INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.end();
    console.log('wl_counter table ready');
  } catch (e) {
    console.error('Table init error:', e.message);
  }
}

// Ensure all Waline tables exist
async function ensureAllTables() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wl_counter (
        id SERIAL PRIMARY KEY,
        url VARCHAR(255) NOT NULL UNIQUE,
        views INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_comment (
        id SERIAL PRIMARY KEY,
        object_id INTEGER,
        url VARCHAR(255),
        nick VARCHAR(100),
        mail VARCHAR(100),
        link VARCHAR(255),
        comment TEXT,
        ua TEXT,
        ip VARCHAR(45),
        is_collapsed BOOLEAN DEFAULT FALSE,
        sticker VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_user (
        id SERIAL PRIMARY KEY,
        display_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        type VARCHAR(20) DEFAULT 'guest',
        avatar VARCHAR(500),
        label VARCHAR(100),
        url VARCHAR(255),
        token VARCHAR(500),
        token_expired_at TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_meta (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE,
        value TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.end();
    console.log('All Waline tables ensured');
  } catch (e) {
    console.error('Table init error:', e.message);
  }
}
ensureAllTables();

// Custom handler for total stats
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function handleTotal(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(
      "SELECT COALESCE(SUM(views), 0) AS total_views, COUNT(*) AS total_pages FROM wl_counter"
    );
    await pool.end();
    return res.status(200).json({
      total_views: parseInt(result.rows[0].total_views),
      total_pages: parseInt(result.rows[0].total_pages),
    });
  } catch (e) {
    return res.status(200).json({ total_views: 0, total_pages: 0 });
  }
}

const walineApp = Application({
  plugins: [],
  async postSave(comment) {
    // do what ever you want after comment saved
  },
});

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/total') return handleTotal(req, res);
  return walineApp(req, res);
};
