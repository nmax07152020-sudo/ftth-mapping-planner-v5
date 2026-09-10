const { routeApi } = require('../backend');
module.exports = async function handler(req, res) {
  try {
    return await routeApi(req, res);
  } catch (err) {
    console.error('Vercel API handler error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
  }
};
