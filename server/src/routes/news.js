const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/news
 * Get aggregated news feed with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, source } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT * FROM news_articles
    `;
    const params = [];

    if (source) {
      params.push(source);
      query += ` WHERE source = $${params.length}`;
    }

    query += ` ORDER BY published_at DESC`;

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM news_articles';
    if (source) {
      countQuery += ' WHERE source = $1';
    }
    const countResult = await db.query(countQuery, source ? [source] : []);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      articles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * GET /api/news/sources
 * Get list of available news sources
 */
router.get('/sources', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT source, COUNT(*) as article_count
      FROM news_articles
      GROUP BY source
      ORDER BY article_count DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching news sources:', err);
    res.status(500).json({ error: 'Failed to fetch news sources' });
  }
});

module.exports = router;
