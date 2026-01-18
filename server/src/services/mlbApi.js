const axios = require('axios');

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// Minor league level IDs
const LEVEL_IDS = {
  'Triple-A': 11,
  'Double-A': 12,
  'High-A': 13,
  'Single-A': 14,
  'Rookie': 16,
  'MLB': 1
};

const mlbApi = {
  /**
   * Search for a player by name
   */
  async searchPlayer(name) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/search`, {
        params: {
          names: name,
          sportIds: '1,11,12,13,14,16', // MLB and MiLB levels
          active: true
        }
      });
      return response.data.people || [];
    } catch (err) {
      console.error('Error searching player:', err.message);
      return [];
    }
  },

  /**
   * Get player info by MLB player ID
   */
  async getPlayer(playerId) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}`, {
        params: {
          hydrate: 'currentTeam,stats(group=[hitting,pitching],type=[season,gameLog])'
        }
      });
      return response.data.people?.[0] || null;
    } catch (err) {
      console.error('Error fetching player:', err.message);
      return null;
    }
  },

  /**
   * Get season stats for a player (including minor leagues)
   */
  async getSeasonStats(playerId, season = new Date().getFullYear()) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, {
        params: {
          stats: 'season',
          group: 'hitting,pitching',
          season: season,
          gameType: 'R',
          sportIds: '1,11,12,13,14,15,16,17,21,22,23' // All professional levels
        }
      });
      return response.data.stats || [];
    } catch (err) {
      console.error('Error fetching season stats:', err.message);
      return [];
    }
  },

  /**
   * Get career stats for a player (including minor leagues)
   */
  async getCareerStats(playerId) {
    try {
      // Fetch from all professional levels
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, {
        params: {
          stats: 'career',
          group: 'hitting,pitching',
          gameType: 'R',
          sportIds: '1,11,12,13,14,15,16,17,21,22,23' // All professional levels including minors
        }
      });
      return response.data.stats || [];
    } catch (err) {
      console.error('Error fetching career stats:', err.message);
      return [];
    }
  },

  /**
   * Get year-by-year stats for a player (including minor leagues)
   */
  async getYearByYearStats(playerId) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, {
        params: {
          stats: 'yearByYear',
          group: 'hitting,pitching',
          gameType: 'R',
          sportIds: '1,11,12,13,14,15,16,17,21,22,23' // All professional levels
        }
      });
      return response.data.stats || [];
    } catch (err) {
      console.error('Error fetching year-by-year stats:', err.message);
      return [];
    }
  },

  /**
   * Get stats from all levels (MLB + MiLB) for a specific stat type
   */
  async getStatsAllLevels(playerId, statType, season = null, extraParams = {}) {
    // Sport IDs: 1=MLB, 11=AAA, 12=AA, 13=A+, 14=A, 16=Rookie, 17=Winter
    const sportIds = [1, 11, 12, 13, 14, 16];
    const allStats = [];

    for (const sportId of sportIds) {
      try {
        const params = {
          stats: statType,
          group: 'hitting,pitching',
          gameType: 'R',
          sportId: sportId,
          ...extraParams
        };
        if (season) params.season = season;

        const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, { params });
        if (response.data.stats) {
          allStats.push(...response.data.stats);
        }
      } catch (err) {
        // Continue if a level has no stats
      }
    }

    return allStats;
  },

  /**
   * Get all stats for player detail view (career, season, rolling periods)
   * Queries all minor league levels
   */
  async getPlayerDetailStats(playerId) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const formatDate = (d) => d.toISOString().split('T')[0];

    // Calculate date ranges for rolling stats
    const days7Ago = new Date(today);
    days7Ago.setDate(days7Ago.getDate() - 7);

    const days14Ago = new Date(today);
    days14Ago.setDate(days14Ago.getDate() - 14);

    const days30Ago = new Date(today);
    days30Ago.setDate(days30Ago.getDate() - 30);

    try {
      // Fetch career and year-by-year stats from all levels
      const [careerStats, seasonStats, last7, last14, last30] = await Promise.all([
        this.getStatsAllLevels(playerId, 'career'),
        this.getStatsAllLevels(playerId, 'season', currentYear),
        this.getStatsAllLevels(playerId, 'byDateRange', null, {
          startDate: formatDate(days7Ago),
          endDate: formatDate(today)
        }),
        this.getStatsAllLevels(playerId, 'byDateRange', null, {
          startDate: formatDate(days14Ago),
          endDate: formatDate(today)
        }),
        this.getStatsAllLevels(playerId, 'byDateRange', null, {
          startDate: formatDate(days30Ago),
          endDate: formatDate(today)
        })
      ]);

      // Fetch year-by-year stats for multiple recent seasons
      const yearByYearPromises = [];
      for (let year = currentYear; year >= currentYear - 5; year--) {
        yearByYearPromises.push(this.getStatsAllLevels(playerId, 'season', year));
      }
      const yearByYearResults = await Promise.all(yearByYearPromises);
      const yearByYear = yearByYearResults.flat();

      return {
        career: careerStats,
        yearByYear: yearByYear,
        season: seasonStats,
        last7Days: last7,
        last14Days: last14,
        last30Days: last30
      };
    } catch (err) {
      console.error('Error fetching player detail stats:', err.message);
      return null;
    }
  },

  /**
   * Get game logs for a player (for rolling calculations, including minor leagues)
   */
  async getGameLog(playerId, season = new Date().getFullYear()) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, {
        params: {
          stats: 'gameLog',
          group: 'hitting,pitching',
          season: season,
          gameType: 'R',
          sportIds: '1,11,12,13,14,15,16,17,21,22,23'
        }
      });
      return response.data.stats || [];
    } catch (err) {
      console.error('Error fetching game log:', err.message);
      return [];
    }
  },

  /**
   * Get stats for a specific date range (including minor leagues)
   */
  async getDateRangeStats(playerId, startDate, endDate) {
    try {
      const response = await axios.get(`${MLB_API_BASE}/people/${playerId}/stats`, {
        params: {
          stats: 'byDateRange',
          group: 'hitting,pitching',
          startDate: startDate,
          endDate: endDate,
          gameType: 'R',
          sportIds: '1,11,12,13,14,15,16,17,21,22,23'
        }
      });
      return response.data.stats || [];
    } catch (err) {
      console.error('Error fetching date range stats:', err.message);
      return [];
    }
  },

  /**
   * Parse batting stats from API response
   */
  parseBattingStats(stats) {
    if (!stats) return null;
    return {
      games: stats.gamesPlayed || 0,
      atBats: stats.atBats || 0,
      hits: stats.hits || 0,
      doubles: stats.doubles || 0,
      triples: stats.triples || 0,
      homeRuns: stats.homeRuns || 0,
      rbis: stats.rbi || 0,
      walks: stats.baseOnBalls || 0,
      strikeouts: stats.strikeOuts || 0,
      stolenBases: stats.stolenBases || 0,
      avg: parseFloat(stats.avg) || 0,
      obp: parseFloat(stats.obp) || 0,
      slg: parseFloat(stats.slg) || 0,
      ops: parseFloat(stats.ops) || 0
    };
  },

  /**
   * Parse pitching stats from API response
   */
  parsePitchingStats(stats) {
    if (!stats) return null;
    return {
      games: stats.gamesPlayed || 0,
      inningsPitched: parseFloat(stats.inningsPitched) || 0,
      earnedRuns: stats.earnedRuns || 0,
      hitsAllowed: stats.hits || 0,
      walksAllowed: stats.baseOnBalls || 0,
      strikeoutsPitching: stats.strikeOuts || 0,
      era: parseFloat(stats.era) || 0,
      whip: parseFloat(stats.whip) || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      saves: stats.saves || 0
    };
  },

  /**
   * Get current team info for a player
   */
  async getCurrentTeam(playerId) {
    try {
      const player = await this.getPlayer(playerId);
      if (player?.currentTeam) {
        return {
          teamName: player.currentTeam.name,
          level: this.getLevelName(player.currentTeam.sport?.id)
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching current team:', err.message);
      return null;
    }
  },

  /**
   * Convert sport ID to level name
   */
  getLevelName(sportId) {
    for (const [name, id] of Object.entries(LEVEL_IDS)) {
      if (id === sportId) return name;
    }
    return 'Unknown';
  }
};

module.exports = mlbApi;
