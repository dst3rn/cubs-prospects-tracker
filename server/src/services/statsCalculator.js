const db = require('../db');

const statsCalculator = {
  /**
   * Calculate rolling stats for a player over N days
   */
  async calculateRollingStats(playerId, days) {
    const query = `
      SELECT
        SUM(games) as games,
        SUM(at_bats) as at_bats,
        SUM(hits) as hits,
        SUM(doubles) as doubles,
        SUM(triples) as triples,
        SUM(home_runs) as home_runs,
        SUM(rbis) as rbis,
        SUM(walks) as walks,
        SUM(strikeouts) as strikeouts,
        SUM(stolen_bases) as stolen_bases,
        SUM(innings_pitched) as innings_pitched,
        SUM(earned_runs) as earned_runs,
        SUM(hits_allowed) as hits_allowed,
        SUM(walks_allowed) as walks_allowed,
        SUM(strikeouts_pitching) as strikeouts_pitching,
        SUM(wins) as wins,
        SUM(losses) as losses,
        SUM(saves) as saves
      FROM daily_stats
      WHERE mlb_player_id = $1
        AND stat_date >= CURRENT_DATE - $2::INTEGER
    `;

    const result = await db.query(query, [playerId, days]);
    const stats = result.rows[0];

    if (!stats || !stats.games) {
      return null;
    }

    return this.calculateDerivedStats(stats);
  },

  /**
   * Calculate season totals for a player
   */
  async getSeasonTotals(playerId) {
    const query = `
      SELECT
        SUM(games) as games,
        SUM(at_bats) as at_bats,
        SUM(hits) as hits,
        SUM(doubles) as doubles,
        SUM(triples) as triples,
        SUM(home_runs) as home_runs,
        SUM(rbis) as rbis,
        SUM(walks) as walks,
        SUM(strikeouts) as strikeouts,
        SUM(stolen_bases) as stolen_bases,
        SUM(innings_pitched) as innings_pitched,
        SUM(earned_runs) as earned_runs,
        SUM(hits_allowed) as hits_allowed,
        SUM(walks_allowed) as walks_allowed,
        SUM(strikeouts_pitching) as strikeouts_pitching,
        SUM(wins) as wins,
        SUM(losses) as losses,
        SUM(saves) as saves
      FROM daily_stats
      WHERE mlb_player_id = $1
        AND EXTRACT(YEAR FROM stat_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const result = await db.query(query, [playerId]);
    const stats = result.rows[0];

    if (!stats || !stats.games) {
      return null;
    }

    return this.calculateDerivedStats(stats);
  },

  /**
   * Calculate derived stats (AVG, OBP, SLG, OPS, ERA, WHIP)
   */
  calculateDerivedStats(stats) {
    const atBats = parseInt(stats.at_bats) || 0;
    const hits = parseInt(stats.hits) || 0;
    const walks = parseInt(stats.walks) || 0;
    const doubles = parseInt(stats.doubles) || 0;
    const triples = parseInt(stats.triples) || 0;
    const homeRuns = parseInt(stats.home_runs) || 0;
    const inningsPitched = parseFloat(stats.innings_pitched) || 0;
    const earnedRuns = parseInt(stats.earned_runs) || 0;
    const hitsAllowed = parseInt(stats.hits_allowed) || 0;
    const walksAllowed = parseInt(stats.walks_allowed) || 0;

    // Batting calculations
    const avg = atBats > 0 ? hits / atBats : 0;
    const plateAppearances = atBats + walks; // Simplified, doesn't include HBP, SF
    const obp = plateAppearances > 0 ? (hits + walks) / plateAppearances : 0;
    const totalBases = hits + doubles + (2 * triples) + (3 * homeRuns);
    const slg = atBats > 0 ? totalBases / atBats : 0;
    const ops = obp + slg;

    // Pitching calculations
    const era = inningsPitched > 0 ? (earnedRuns * 9) / inningsPitched : 0;
    const whip = inningsPitched > 0 ? (walksAllowed + hitsAllowed) / inningsPitched : 0;

    return {
      games: parseInt(stats.games) || 0,
      atBats,
      hits,
      doubles,
      triples,
      homeRuns,
      rbis: parseInt(stats.rbis) || 0,
      walks,
      strikeouts: parseInt(stats.strikeouts) || 0,
      stolenBases: parseInt(stats.stolen_bases) || 0,
      avg: Math.round(avg * 1000) / 1000,
      obp: Math.round(obp * 1000) / 1000,
      slg: Math.round(slg * 1000) / 1000,
      ops: Math.round(ops * 1000) / 1000,
      // Pitching
      inningsPitched,
      earnedRuns,
      hitsAllowed,
      walksAllowed,
      strikeoutsPitching: parseInt(stats.strikeouts_pitching) || 0,
      era: Math.round(era * 100) / 100,
      whip: Math.round(whip * 100) / 100,
      wins: parseInt(stats.wins) || 0,
      losses: parseInt(stats.losses) || 0,
      saves: parseInt(stats.saves) || 0
    };
  },

  /**
   * Determine if player is hot, cold, or neutral
   * Compares recent performance (7-day) to season average
   */
  async getTrendIndicator(playerId, isPitcher = false) {
    const [rolling7, season] = await Promise.all([
      this.calculateRollingStats(playerId, 7),
      this.getSeasonTotals(playerId)
    ]);

    if (!rolling7 || !season) {
      return 'neutral';
    }

    if (isPitcher) {
      // For pitchers, lower ERA is better
      if (season.era === 0) return 'neutral';
      const eraRatio = rolling7.era / season.era;
      if (eraRatio < 0.75) return 'hot';
      if (eraRatio > 1.25) return 'cold';
      return 'neutral';
    } else {
      // For hitters, higher OPS is better
      if (season.ops === 0) return 'neutral';
      const opsRatio = rolling7.ops / season.ops;
      if (opsRatio > 1.15) return 'hot';
      if (opsRatio < 0.85) return 'cold';
      return 'neutral';
    }
  },

  /**
   * Store daily stats for a player
   */
  async storeDailyStats(playerId, stats, date = new Date()) {
    const query = `
      INSERT INTO daily_stats (
        mlb_player_id, stat_date, games, at_bats, hits, doubles, triples,
        home_runs, rbis, walks, strikeouts, stolen_bases, avg, obp, slg, ops,
        innings_pitched, earned_runs, hits_allowed, walks_allowed,
        strikeouts_pitching, era, whip, wins, losses, saves
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (mlb_player_id, stat_date)
      DO UPDATE SET
        games = EXCLUDED.games,
        at_bats = EXCLUDED.at_bats,
        hits = EXCLUDED.hits,
        doubles = EXCLUDED.doubles,
        triples = EXCLUDED.triples,
        home_runs = EXCLUDED.home_runs,
        rbis = EXCLUDED.rbis,
        walks = EXCLUDED.walks,
        strikeouts = EXCLUDED.strikeouts,
        stolen_bases = EXCLUDED.stolen_bases,
        avg = EXCLUDED.avg,
        obp = EXCLUDED.obp,
        slg = EXCLUDED.slg,
        ops = EXCLUDED.ops,
        innings_pitched = EXCLUDED.innings_pitched,
        earned_runs = EXCLUDED.earned_runs,
        hits_allowed = EXCLUDED.hits_allowed,
        walks_allowed = EXCLUDED.walks_allowed,
        strikeouts_pitching = EXCLUDED.strikeouts_pitching,
        era = EXCLUDED.era,
        whip = EXCLUDED.whip,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        saves = EXCLUDED.saves
    `;

    const dateStr = date.toISOString().split('T')[0];
    await db.query(query, [
      playerId,
      dateStr,
      stats.games || 0,
      stats.atBats || 0,
      stats.hits || 0,
      stats.doubles || 0,
      stats.triples || 0,
      stats.homeRuns || 0,
      stats.rbis || 0,
      stats.walks || 0,
      stats.strikeouts || 0,
      stats.stolenBases || 0,
      stats.avg || null,
      stats.obp || null,
      stats.slg || null,
      stats.ops || null,
      stats.inningsPitched || null,
      stats.earnedRuns || null,
      stats.hitsAllowed || null,
      stats.walksAllowed || null,
      stats.strikeoutsPitching || null,
      stats.era || null,
      stats.whip || null,
      stats.wins || 0,
      stats.losses || 0,
      stats.saves || 0
    ]);
  }
};

module.exports = statsCalculator;
