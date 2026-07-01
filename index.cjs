const Application = require('@waline/vercel');

// Custom handler for total stats
async function handleTotal(req, res) {
  try {
    const { Pool } = require('pg');
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

// Ensure Waline DB tables exist
async function ensureTables() {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wl_comment (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        object_id INTEGER,
        url VARCHAR,
        nick VARCHAR,
        mail VARCHAR,
        link VARCHAR,
        comment TEXT,
        ua TEXT,
        ip TEXT,
        is_collapsed BOOLEAN DEFAULT FALSE,
        sticker TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_counter (
        id SERIAL PRIMARY KEY,
        path VARCHAR UNIQUE,
        views INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_user (
        id SERIAL PRIMARY KEY,
        display_name VARCHAR,
        email VARCHAR,
        password VARCHAR,
        type VARCHAR DEFAULT 'guest',
        avatar VARCHAR,
        label VARCHAR,
        url VARCHAR,
        token VARCHAR,
        token_expired_at TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS wl_meta (
        id SERIAL PRIMARY KEY,
        key VARCHAR UNIQUE,
        value VARCHAR,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.end();
    console.log('Waline tables ensured/created successfully');
  } catch (e) {
    console.error('Table creation error:', e.message);
  }
}

// Create tables eagerly
ensureTables();

const walineApp = Application({
  plugins: [],
  async postSave(comment) {
    // do what ever you want after comment saved
  },
});

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/api/total') {
    return handleTotal(req, res);
  }
  
  return walineApp(req, res);
};
