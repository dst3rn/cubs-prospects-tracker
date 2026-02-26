const express = require('express');
const router = express.Router();
const db = require('../db');
const statsCalculator = require('../services/statsCalculator');
const mlbApi = require('../services/mlbApi');

/**
 * GET /api/prospects
 * Get all active prospects with current stats and rolling metrics
 */
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'pipeline_rank', order = 'ASC', position, level } = req.query;

    let query = `
      SELECT * FROM prospects
      WHERE active = true
    `;
    const params = [];

    if (position) {
      params.push(position);
      query += ` AND position = $${params.length}`;
    }

    if (level) {
      params.push(level);
      query += ` AND current_level = $${params.length}`;
    }

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['pipeline_rank', 'name', 'position', 'current_level'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'pipeline_rank';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const result = await db.query(query, params);
    const prospects = result.rows;

    // Enrich with stats data
    const enrichedProspects = await Promise.all(
      prospects.map(async (prospect) => {
        const isPitcher = ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(prospect.position);

        const [seasonStats, rolling7, rolling14, rolling28, trend] = await Promise.all([
          statsCalculator.getSeasonTotals(prospect.mlb_player_id),
          statsCalculator.calculateRollingStats(prospect.mlb_player_id, 7),
          statsCalculator.calculateRollingStats(prospect.mlb_player_id, 14),
          statsCalculator.calculateRollingStats(prospect.mlb_player_id, 28),
          statsCalculator.getTrendIndicator(prospect.mlb_player_id, isPitcher)
        ]);

        return {
          ...prospect,
          isPitcher,
          seasonStats,
          rolling7,
          rolling14,
          rolling28,
          trend
        };
      })
    );

    res.json(enrichedProspects);
  } catch (err) {
    console.error('Error fetching prospects:', err);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

/**
 * GET /api/prospects/:id
 * Get single prospect detail with full stats from MLB API
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM prospects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const prospect = result.rows[0];
    const isPitcher = ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(prospect.position);

    // Fetch all stats from MLB API
    const [mlbPlayerInfo, detailStats] = await Promise.all([
      mlbApi.getPlayer(prospect.mlb_player_id),
      mlbApi.getPlayerDetailStats(prospect.mlb_player_id)
    ]);

    // Aggregate stats from multiple levels (career totals)
    const aggregateStats = (statsArray, isPitching) => {
      if (!statsArray || statsArray.length === 0) return null;

      const totals = {
        games: 0, atBats: 0, hits: 0, doubles: 0, triples: 0,
        homeRuns: 0, rbis: 0, walks: 0, strikeouts: 0, stolenBases: 0,
        // Pitching
        inningsPitched: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0,
        strikeoutsPitching: 0, wins: 0, losses: 0, saves: 0
      };

      for (const statGroup of statsArray) {
        const groupName = statGroup.group?.displayName;
        const isCorrectGroup = (isPitching && groupName === 'pitching') ||
                               (!isPitching && groupName === 'hitting');

        if (isCorrectGroup && statGroup.splits) {
          for (const split of statGroup.splits) {
            const s = split.stat;
            if (isPitching) {
              totals.games += s.gamesPlayed || 0;
              totals.inningsPitched += parseFloat(s.inningsPitched) || 0;
              totals.earnedRuns += s.earnedRuns || 0;
              totals.hitsAllowed += s.hits || 0;
              totals.walksAllowed += s.baseOnBalls || 0;
              totals.strikeoutsPitching += s.strikeOuts || 0;
              totals.wins += s.wins || 0;
              totals.losses += s.losses || 0;
              totals.saves += s.saves || 0;
            } else {
              totals.games += s.gamesPlayed || 0;
              totals.atBats += s.atBats || 0;
              totals.hits += s.hits || 0;
              totals.doubles += s.doubles || 0;
              totals.triples += s.triples || 0;
              totals.homeRuns += s.homeRuns || 0;
              totals.rbis += s.rbi || 0;
              totals.walks += s.baseOnBalls || 0;
              totals.strikeouts += s.strikeOuts || 0;
              totals.stolenBases += s.stolenBases || 0;
            }
          }
        }
      }

      if (totals.games === 0) return null;

      // Calculate rate stats
      if (isPitching) {
        totals.era = totals.inningsPitched > 0
          ? Math.round((totals.earnedRuns * 9 / totals.inningsPitched) * 100) / 100
          : 0;
        totals.whip = totals.inningsPitched > 0
          ? Math.round(((totals.walksAllowed + totals.hitsAllowed) / totals.inningsPitched) * 100) / 100
          : 0;
      } else {
        totals.avg = totals.atBats > 0
          ? Math.round((totals.hits / totals.atBats) * 1000) / 1000
          : 0;
        totals.obp = (totals.atBats + totals.walks) > 0
          ? Math.round(((totals.hits + totals.walks) / (totals.atBats + totals.walks)) * 1000) / 1000
          : 0;
        const totalBases = totals.hits + totals.doubles + (2 * totals.triples) + (3 * totals.homeRuns);
        totals.slg = totals.atBats > 0
          ? Math.round((totalBases / totals.atBats) * 1000) / 1000
          : 0;
        totals.ops = Math.round((totals.obp + totals.slg) * 1000) / 1000;
      }

      return totals;
    };

    // Parse first available stats (for rolling windows)
    const parseFirstStats = (statsArray, isPitching) => {
      if (!statsArray || statsArray.length === 0) return null;

      for (const statGroup of statsArray) {
        const groupName = statGroup.group?.displayName;
        const isCorrectGroup = (isPitching && groupName === 'pitching') ||
                               (!isPitching && groupName === 'hitting');

        if (isCorrectGroup && statGroup.splits && statGroup.splits.length > 0) {
          const stats = statGroup.splits[0].stat;
          return isPitching
            ? mlbApi.parsePitchingStats(stats)
            : mlbApi.parseBattingStats(stats);
        }
      }
      return null;
    };

    // Parse year-by-year stats for career history
    const parseYearByYear = (statsArray, isPitching) => {
      if (!statsArray || statsArray.length === 0) return [];

      const years = [];
      for (const statGroup of statsArray) {
        const groupName = statGroup.group?.displayName;
        const isCorrectGroup = (isPitching && groupName === 'pitching') ||
                               (!isPitching && groupName === 'hitting');

        if (isCorrectGroup && statGroup.splits) {
          for (const split of statGroup.splits) {
            years.push({
              season: split.season,
              team: split.team?.name || 'Unknown',
              level: split.sport?.abbreviation || split.sport?.name || 'Unknown',
              stats: isPitching
                ? mlbApi.parsePitchingStats(split.stat)
                : mlbApi.parseBattingStats(split.stat)
            });
          }
        }
      }
      // Sort by season desc, then by level
      return years.sort((a, b) => {
        if (b.season !== a.season) return b.season - a.season;
        return a.level.localeCompare(b.level);
      });
    };

    const careerStats = detailStats ? aggregateStats(detailStats.career, isPitcher) : null;
    const seasonStats = detailStats ? aggregateStats(detailStats.season, isPitcher) : null;
    const last7Days = detailStats ? aggregateStats(detailStats.last7Days, isPitcher) : null;
    const last14Days = detailStats ? aggregateStats(detailStats.last14Days, isPitcher) : null;
    const last28Days = detailStats ? aggregateStats(detailStats.last28Days, isPitcher) : null;
    const yearByYear = detailStats ? parseYearByYear(detailStats.yearByYear, isPitcher) : [];

    // Determine trend based on last 7 days vs season
    let trend = 'neutral';
    if (seasonStats && last7Days) {
      if (isPitcher) {
        if (seasonStats.era > 0 && last7Days.era < seasonStats.era * 0.75) trend = 'hot';
        else if (seasonStats.era > 0 && last7Days.era > seasonStats.era * 1.25) trend = 'cold';
      } else {
        if (seasonStats.ops > 0 && last7Days.ops > seasonStats.ops * 1.15) trend = 'hot';
        else if (seasonStats.ops > 0 && last7Days.ops < seasonStats.ops * 0.85) trend = 'cold';
      }
    }

    res.json({
      ...prospect,
      isPitcher,
      careerStats,
      seasonStats,
      rolling7: last7Days,
      rolling14: last14Days,
      rolling28: last28Days,
      yearByYear,
      trend,
      playerInfo: mlbPlayerInfo ? {
        birthDate: mlbPlayerInfo.birthDate,
        height: mlbPlayerInfo.height,
        weight: mlbPlayerInfo.weight,
        batSide: mlbPlayerInfo.batSide?.code,
        pitchHand: mlbPlayerInfo.pitchHand?.code,
        draftYear: mlbPlayerInfo.draftYear,
        mlbDebutDate: mlbPlayerInfo.mlbDebutDate,
        birthCity: mlbPlayerInfo.birthCity,
        birthCountry: mlbPlayerInfo.birthCountry
      } : null
    });
  } catch (err) {
    console.error('Error fetching prospect:', err);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

/**
 * POST /api/prospects
 * Add a new prospect (admin)
 */
router.post('/', async (req, res) => {
  try {
    const { mlb_player_id, name, position, pipeline_rank, current_team, current_level } = req.body;

    const result = await db.query(
      `INSERT INTO prospects (mlb_player_id, name, position, pipeline_rank, current_team, current_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [mlb_player_id, name, position, pipeline_rank, current_team, current_level]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating prospect:', err);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

/**
 * PUT /api/prospects/:id
 * Update a prospect (admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, pipeline_rank, current_team, current_level, active } = req.body;

    const result = await db.query(
      `UPDATE prospects
       SET name = COALESCE($1, name),
           position = COALESCE($2, position),
           pipeline_rank = COALESCE($3, pipeline_rank),
           current_team = COALESCE($4, current_team),
           current_level = COALESCE($5, current_level),
           active = COALESCE($6, active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, position, pipeline_rank, current_team, current_level, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating prospect:', err);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

module.exports = router;
