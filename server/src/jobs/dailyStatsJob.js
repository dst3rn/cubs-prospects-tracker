const db = require('../db');
const mlbApi = require('../services/mlbApi');
const statsCalculator = require('../services/statsCalculator');

function getCurrentGameType() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  // Spring training: February and early March (before the 25th)
  if (month === 1 || (month === 2 && day < 25)) {
    return 'S';
  }
  return 'R';
}

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
    const gameType = getCurrentGameType();

    for (const prospect of prospects) {
      try {
        const isPitcher = ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(prospect.position);

        // Fetch season stats from MLB API
        const statsResponse = await mlbApi.getSeasonStats(prospect.mlb_player_id);

        if (statsResponse && statsResponse.length > 0) {
          // Aggregate stats across all levels per group (hitting/pitching).
          // getSeasonStats now queries each sportId individually, so there may be
          // multiple stat groups of the same type (one per level).
          const aggregated = { hitting: null, pitching: null };

          for (const statGroup of statsResponse) {
            const groupName = statGroup.group?.displayName;
            if (groupName !== 'hitting' && groupName !== 'pitching') continue;

            for (const split of (statGroup.splits || [])) {
              const parsed = groupName === 'hitting'
                ? mlbApi.parseBattingStats(split.stat)
                : mlbApi.parsePitchingStats(split.stat);

              if (!parsed) continue;

              if (!aggregated[groupName]) {
                aggregated[groupName] = { ...parsed };
              } else {
                // Sum counting stats across levels
                const agg = aggregated[groupName];
                agg.games = (agg.games || 0) + (parsed.games || 0);
                if (groupName === 'hitting') {
                  agg.atBats = (agg.atBats || 0) + (parsed.atBats || 0);
                  agg.hits = (agg.hits || 0) + (parsed.hits || 0);
                  agg.doubles = (agg.doubles || 0) + (parsed.doubles || 0);
                  agg.triples = (agg.triples || 0) + (parsed.triples || 0);
                  agg.homeRuns = (agg.homeRuns || 0) + (parsed.homeRuns || 0);
                  agg.rbis = (agg.rbis || 0) + (parsed.rbis || 0);
                  agg.walks = (agg.walks || 0) + (parsed.walks || 0);
                  agg.strikeouts = (agg.strikeouts || 0) + (parsed.strikeouts || 0);
                  agg.stolenBases = (agg.stolenBases || 0) + (parsed.stolenBases || 0);
                  // Recalculate rate stats
                  agg.avg = agg.atBats > 0 ? Math.round((agg.hits / agg.atBats) * 1000) / 1000 : 0;
                  const pa = agg.atBats + agg.walks;
                  agg.obp = pa > 0 ? Math.round(((agg.hits + agg.walks) / pa) * 1000) / 1000 : 0;
                  const tb = agg.hits + agg.doubles + (2 * agg.triples) + (3 * agg.homeRuns);
                  agg.slg = agg.atBats > 0 ? Math.round((tb / agg.atBats) * 1000) / 1000 : 0;
                  agg.ops = Math.round((agg.obp + agg.slg) * 1000) / 1000;
                } else {
                  agg.inningsPitched = (agg.inningsPitched || 0) + (parsed.inningsPitched || 0);
                  agg.earnedRuns = (agg.earnedRuns || 0) + (parsed.earnedRuns || 0);
                  agg.hitsAllowed = (agg.hitsAllowed || 0) + (parsed.hitsAllowed || 0);
                  agg.walksAllowed = (agg.walksAllowed || 0) + (parsed.walksAllowed || 0);
                  agg.strikeoutsPitching = (agg.strikeoutsPitching || 0) + (parsed.strikeoutsPitching || 0);
                  agg.wins = (agg.wins || 0) + (parsed.wins || 0);
                  agg.losses = (agg.losses || 0) + (parsed.losses || 0);
                  agg.saves = (agg.saves || 0) + (parsed.saves || 0);
                  // Recalculate rate stats
                  agg.era = agg.inningsPitched > 0 ? Math.round((agg.earnedRuns * 9 / agg.inningsPitched) * 100) / 100 : 0;
                  agg.whip = agg.inningsPitched > 0 ? Math.round(((agg.walksAllowed + agg.hitsAllowed) / agg.inningsPitched) * 100) / 100 : 0;
                }
              }
            }
          }

          // Store the aggregated stats (prefer hitting for position players, pitching for pitchers)
          const statsToStore = isPitcher
            ? (aggregated.pitching || aggregated.hitting)
            : (aggregated.hitting || aggregated.pitching);

          if (statsToStore) {
            await statsCalculator.storeDailyStats(
              prospect.mlb_player_id,
              statsToStore,
              new Date(),
              gameType
            );
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
