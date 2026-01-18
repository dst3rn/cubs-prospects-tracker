const db = require('../db');
const mlbApi = require('../services/mlbApi');
const statsCalculator = require('../services/statsCalculator');

/**
 * Daily stats refresh job
 * Fetches current season stats for all active prospects
 * Should run at 4am Central Time to capture West Coast games
 */
async function runDailyStatsJob() {
  console.log(`[${new Date().toISOString()}] Starting daily stats refresh...`);

  try {
    // Get all active prospects
    const result = await db.query(
      'SELECT mlb_player_id, name, position FROM prospects WHERE active = true'
    );

    const prospects = result.rows;
    console.log(`Found ${prospects.length} active prospects`);

    let successCount = 0;
    let errorCount = 0;

    for (const prospect of prospects) {
      try {
        const isPitcher = ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(prospect.position);

        // Fetch season stats from MLB API
        const statsResponse = await mlbApi.getSeasonStats(prospect.mlb_player_id);

        if (statsResponse && statsResponse.length > 0) {
          // Process each stat group (hitting and/or pitching)
          for (const statGroup of statsResponse) {
            if (statGroup.splits && statGroup.splits.length > 0) {
              const latestStats = statGroup.splits[0].stat;

              let parsedStats;
              if (statGroup.group.displayName === 'hitting') {
                parsedStats = mlbApi.parseBattingStats(latestStats);
              } else if (statGroup.group.displayName === 'pitching') {
                parsedStats = mlbApi.parsePitchingStats(latestStats);
              }

              if (parsedStats) {
                // Store as today's cumulative stats
                await statsCalculator.storeDailyStats(
                  prospect.mlb_player_id,
                  parsedStats
                );
              }
            }
          }

          successCount++;
          console.log(`Updated stats for ${prospect.name}`);
        } else {
          console.log(`No stats found for ${prospect.name}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        errorCount++;
        console.error(`Error updating stats for ${prospect.name}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] Stats refresh complete. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('Fatal error in daily stats job:', err);
    throw err;
  }
}

/**
 * Update team info for all prospects
 * Checks for promotions/demotions
 */
async function updateTeamInfo() {
  console.log(`[${new Date().toISOString()}] Updating team info...`);

  try {
    const result = await db.query(
      'SELECT id, mlb_player_id, name, current_team, current_level FROM prospects WHERE active = true'
    );

    for (const prospect of result.rows) {
      try {
        const teamInfo = await mlbApi.getCurrentTeam(prospect.mlb_player_id);

        if (teamInfo && (teamInfo.teamName !== prospect.current_team || teamInfo.level !== prospect.current_level)) {
          await db.query(
            `UPDATE prospects
             SET current_team = $1, current_level = $2, updated_at = NOW()
             WHERE id = $3`,
            [teamInfo.teamName, teamInfo.level, prospect.id]
          );
          console.log(`Updated team for ${prospect.name}: ${teamInfo.teamName} (${teamInfo.level})`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error updating team for ${prospect.name}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] Team info update complete`);
  } catch (err) {
    console.error('Error in team info update:', err);
    throw err;
  }
}

module.exports = {
  runDailyStatsJob,
  updateTeamInfo
};
