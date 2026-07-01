const { Pool } = require('pg');
const Application = require('@waline/vercel');

// Drop incorrectly created tables and let Waline ORM create them properly
async function resetTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Drop tables I incorrectly created
    await pool.query('DROP TABLE IF EXISTS wl_comment CASCADE');
    await pool.query('DROP TABLE IF EXISTS wl_counter CASCADE');
    await pool.query('DROP TABLE IF EXISTS wl_user CASCADE');
    await pool.query('DROP TABLE IF EXISTS wl_meta CASCADE');
    console.log('Dropped incorrectly created tables');
  } catch (e) {
    console.error('Drop error:', e.message);
  }
  await pool.end();
}
resetTables();

// Custom handler for total stats  
async function handleTotal(req, res) {
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
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/total') return handleTotal(req, res);
  return walineApp(req, res);
};
