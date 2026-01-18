const express = require('express');
const router = express.Router();
const db = require('../db');
const statsCalculator = require('../services/statsCalculator');

/**
 * GET /api/stats/:playerId
 * Get detailed stats for a player
 */
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { days } = req.query;

    if (days) {
      const rollingStats = await statsCalculator.calculateRollingStats(playerId, parseInt(days));
      return res.json(rollingStats);
    }

    const seasonStats = await statsCalculator.getSeasonTotals(playerId);
    res.json(seasonStats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/stats/leaders
 * Get top performers by various metrics
 */
router.get('/leaders/batting', async (req, res) => {
  try {
    const { stat = 'avg', limit = 10, days } = req.query;

    const validStats = ['avg', 'obp', 'slg', 'ops', 'home_runs', 'rbis', 'stolen_bases', 'hits'];
    const statColumn = validStats.includes(stat) ? stat : 'avg';

    let query;
    const params = [parseInt(limit)];

    if (days) {
      params.push(parseInt(days));
      query = `
        WITH rolling_stats AS (
          SELECT
            mlb_player_id,
            SUM(at_bats) as at_bats,
            SUM(hits) as hits,
            SUM(walks) as walks,
            SUM(doubles) as doubles,
            SUM(triples) as triples,
            SUM(home_runs) as home_runs,
            SUM(rbis) as rbis,
            SUM(stolen_bases) as stolen_bases
          FROM daily_stats
          WHERE stat_date >= CURRENT_DATE - $2::INTEGER
          GROUP BY mlb_player_id
          HAVING SUM(at_bats) >= 10
        )
        SELECT
          p.id, p.name, p.position, p.current_team, p.current_level, p.pipeline_rank,
          rs.at_bats, rs.hits, rs.home_runs, rs.rbis, rs.stolen_bases,
          CASE WHEN rs.at_bats > 0 THEN ROUND(rs.hits::DECIMAL / rs.at_bats, 3) ELSE 0 END as avg,
          CASE WHEN (rs.at_bats + rs.walks) > 0 THEN ROUND((rs.hits + rs.walks)::DECIMAL / (rs.at_bats + rs.walks), 3) ELSE 0 END as obp,
          CASE WHEN rs.at_bats > 0 THEN ROUND((rs.hits + rs.doubles + 2 * rs.triples + 3 * rs.home_runs)::DECIMAL / rs.at_bats, 3) ELSE 0 END as slg
        FROM rolling_stats rs
        JOIN prospects p ON p.mlb_player_id = rs.mlb_player_id
        WHERE p.active = true
          AND p.position NOT IN ('P', 'SP', 'RP', 'LHP', 'RHP')
        ORDER BY ${statColumn} DESC
        LIMIT $1
      `;
    } else {
      query = `
        WITH season_stats AS (
          SELECT
            mlb_player_id,
            SUM(at_bats) as at_bats,
            SUM(hits) as hits,
            SUM(walks) as walks,
            SUM(doubles) as doubles,
            SUM(triples) as triples,
            SUM(home_runs) as home_runs,
            SUM(rbis) as rbis,
            SUM(stolen_bases) as stolen_bases
          FROM daily_stats
          WHERE EXTRACT(YEAR FROM stat_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          GROUP BY mlb_player_id
          HAVING SUM(at_bats) >= 50
        )
        SELECT
          p.id, p.name, p.position, p.current_team, p.current_level, p.pipeline_rank,
          ss.at_bats, ss.hits, ss.home_runs, ss.rbis, ss.stolen_bases,
          CASE WHEN ss.at_bats > 0 THEN ROUND(ss.hits::DECIMAL / ss.at_bats, 3) ELSE 0 END as avg,
          CASE WHEN (ss.at_bats + ss.walks) > 0 THEN ROUND((ss.hits + ss.walks)::DECIMAL / (ss.at_bats + ss.walks), 3) ELSE 0 END as obp,
          CASE WHEN ss.at_bats > 0 THEN ROUND((ss.hits + ss.doubles + 2 * ss.triples + 3 * ss.home_runs)::DECIMAL / ss.at_bats, 3) ELSE 0 END as slg
        FROM season_stats ss
        JOIN prospects p ON p.mlb_player_id = ss.mlb_player_id
        WHERE p.active = true
          AND p.position NOT IN ('P', 'SP', 'RP', 'LHP', 'RHP')
        ORDER BY ${statColumn} DESC
        LIMIT $1
      `;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching batting leaders:', err);
    res.status(500).json({ error: 'Failed to fetch batting leaders' });
  }
});

/**
 * GET /api/stats/leaders/pitching
 * Get top pitching performers
 */
router.get('/leaders/pitching', async (req, res) => {
  try {
    const { stat = 'era', limit = 10, days } = req.query;

    const validStats = ['era', 'whip', 'strikeouts_pitching', 'wins', 'saves'];
    const statColumn = validStats.includes(stat) ? stat : 'era';
    const sortOrder = ['era', 'whip'].includes(statColumn) ? 'ASC' : 'DESC';

    let query;
    const params = [parseInt(limit)];

    if (days) {
      params.push(parseInt(days));
      query = `
        WITH rolling_stats AS (
          SELECT
            mlb_player_id,
            SUM(innings_pitched) as innings_pitched,
            SUM(earned_runs) as earned_runs,
            SUM(hits_allowed) as hits_allowed,
            SUM(walks_allowed) as walks_allowed,
            SUM(strikeouts_pitching) as strikeouts_pitching,
            SUM(wins) as wins,
            SUM(saves) as saves
          FROM daily_stats
          WHERE stat_date >= CURRENT_DATE - $2::INTEGER
          GROUP BY mlb_player_id
          HAVING SUM(innings_pitched) >= 5
        )
        SELECT
          p.id, p.name, p.position, p.current_team, p.current_level, p.pipeline_rank,
          rs.innings_pitched, rs.strikeouts_pitching, rs.wins, rs.saves,
          CASE WHEN rs.innings_pitched > 0 THEN ROUND((rs.earned_runs * 9.0) / rs.innings_pitched, 2) ELSE 0 END as era,
          CASE WHEN rs.innings_pitched > 0 THEN ROUND((rs.walks_allowed + rs.hits_allowed)::DECIMAL / rs.innings_pitched, 2) ELSE 0 END as whip
        FROM rolling_stats rs
        JOIN prospects p ON p.mlb_player_id = rs.mlb_player_id
        WHERE p.active = true
          AND p.position IN ('P', 'SP', 'RP', 'LHP', 'RHP')
        ORDER BY ${statColumn} ${sortOrder}
        LIMIT $1
      `;
    } else {
      query = `
        WITH season_stats AS (
          SELECT
            mlb_player_id,
            SUM(innings_pitched) as innings_pitched,
            SUM(earned_runs) as earned_runs,
            SUM(hits_allowed) as hits_allowed,
            SUM(walks_allowed) as walks_allowed,
            SUM(strikeouts_pitching) as strikeouts_pitching,
            SUM(wins) as wins,
            SUM(saves) as saves
          FROM daily_stats
          WHERE EXTRACT(YEAR FROM stat_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          GROUP BY mlb_player_id
          HAVING SUM(innings_pitched) >= 20
        )
        SELECT
          p.id, p.name, p.position, p.current_team, p.current_level, p.pipeline_rank,
          ss.innings_pitched, ss.strikeouts_pitching, ss.wins, ss.saves,
          CASE WHEN ss.innings_pitched > 0 THEN ROUND((ss.earned_runs * 9.0) / ss.innings_pitched, 2) ELSE 0 END as era,
          CASE WHEN ss.innings_pitched > 0 THEN ROUND((ss.walks_allowed + ss.hits_allowed)::DECIMAL / ss.innings_pitched, 2) ELSE 0 END as whip
        FROM season_stats ss
        JOIN prospects p ON p.mlb_player_id = ss.mlb_player_id
        WHERE p.active = true
          AND p.position IN ('P', 'SP', 'RP', 'LHP', 'RHP')
        ORDER BY ${statColumn} ${sortOrder}
        LIMIT $1
      `;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pitching leaders:', err);
    res.status(500).json({ error: 'Failed to fetch pitching leaders' });
  }
});

module.exports = router;
