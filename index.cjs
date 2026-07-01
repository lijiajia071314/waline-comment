const Application = require('@waline/vercel');

// Custom handler for total stats
async function handleTotal(req, res) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Query total page views
    const result = await pool.query(
      "SELECT COALESCE(SUM(views), 0) AS total_views, COUNT(*) AS total_pages FROM wl_counter"
    );
    
    await pool.end();
    
    res.status(200).json({
      total_views: parseInt(result.rows[0].total_views),
      total_pages: parseInt(result.rows[0].total_pages),
    });
  } catch (e) {
    // If wl_counter table doesn't exist yet, return 0
    res.status(200).json({
      total_views: 0,
      total_pages: 0,
    });
  }
}

// Wrap Waline to add custom routes
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
