require('dotenv').config();
const db = require('./index');
const mlbApi = require('../services/mlbApi');

// Cubs top prospects - Updated January 2026
// Sources: MLB Pipeline, Baseball America, Prospects Live
// EXCLUDES players on MLB roster or traded
const CUBS_PROSPECTS = [
  { name: 'Moises Ballesteros', position: 'C', pipelineRank: 1, team: 'Iowa Cubs', level: 'Triple-A' },
  { name: 'Jaxon Wiggins', position: 'RHP', pipelineRank: 2, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Jefferson Rojas', position: 'SS', pipelineRank: 3, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Ethan Conrad', position: 'OF', pipelineRank: 4, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Kevin Alcantara', position: 'OF', pipelineRank: 5, team: 'Iowa Cubs', level: 'Triple-A' },
  { name: 'Kane Kepley', position: 'OF', pipelineRank: 6, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Jonathon Long', position: '1B', pipelineRank: 7, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'James Triantos', position: '2B', pipelineRank: 8, team: 'Iowa Cubs', level: 'Triple-A' },
  { name: 'Cole Mathis', position: '1B', pipelineRank: 9, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Brandon Birdsell', position: 'RHP', pipelineRank: 10, team: 'Iowa Cubs', level: 'Triple-A' },
  { name: 'Angel Cepeda', position: 'SS', pipelineRank: 11, team: 'Myrtle Beach Pelicans', level: 'Single-A' },
  { name: 'Yahil Melendez', position: 'SS', pipelineRank: 12, team: 'Myrtle Beach Pelicans', level: 'Single-A' },
  { name: 'Juan Tomas', position: 'SS', pipelineRank: 13, team: 'ACL Cubs', level: 'Rookie' },
  { name: 'Ethan Flanagan', position: 'LHP', pipelineRank: 14, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Connor Noland', position: 'RHP', pipelineRank: 15, team: 'Iowa Cubs', level: 'Triple-A' },
  { name: 'Dominick Reid', position: 'RHP', pipelineRank: 16, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Jostin Florentino', position: 'RHP', pipelineRank: 17, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Pedro Ramirez', position: 'C', pipelineRank: 18, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Riley Martin', position: 'LHP', pipelineRank: 19, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Jack Neely', position: 'RHP', pipelineRank: 20, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Kade Snell', position: 'OF', pipelineRank: 21, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Eli Lovich', position: 'OF', pipelineRank: 22, team: 'South Bend Cubs', level: 'High-A' },
  { name: 'Nick Dean', position: 'RHP', pipelineRank: 23, team: 'Tennessee Smokies', level: 'Double-A' },
  { name: 'Kaleb Wing', position: 'RHP', pipelineRank: 24, team: 'ACL Cubs', level: 'Rookie' },
  { name: 'Juan Cabada', position: 'SS', pipelineRank: 25, team: 'Myrtle Beach Pelicans', level: 'Single-A' }
];

// Players excluded - on MLB roster or traded
const EXCLUSIONS = [
  'Matt Shaw',        // MLB roster
  'Cade Horton',      // MLB roster
  'Owen Caissie',     // Traded to Marlins
  'Cristian Hernandez', // Traded to Marlins
  'Pete Crow-Armstrong' // MLB roster
];

async function lookupPlayerId(name) {
  try {
    const players = await mlbApi.searchPlayer(name);
    // Try to find Cubs affiliate player
    const cubsPlayer = players.find(p =>
      p.currentTeam?.parentOrgName === 'Chicago Cubs' ||
      p.currentTeam?.name?.includes('Cubs') ||
      p.currentTeam?.name?.includes('Smokies') ||
      p.currentTeam?.name?.includes('Pelicans')
    );
    return cubsPlayer?.id || players[0]?.id || null;
  } catch (err) {
    console.error(`Error looking up ${name}:`, err.message);
    return null;
  }
}

async function seed() {
  console.log('Starting seed process...');
  console.log(`Excluding: ${EXCLUSIONS.join(', ')}`);

  // First, mark all existing prospects as inactive
  await db.query(`UPDATE prospects SET active = false, updated_at = NOW()`);
  console.log('Marked all existing prospects as inactive');

  for (const prospect of CUBS_PROSPECTS) {
    console.log(`Processing ${prospect.name}...`);

    // Look up MLB player ID
    const mlbPlayerId = await lookupPlayerId(prospect.name);

    if (!mlbPlayerId) {
      console.log(`Could not find MLB ID for ${prospect.name}, using placeholder`);
    }

    try {
      await db.query(
        `INSERT INTO prospects (mlb_player_id, name, position, pipeline_rank, current_team, current_level, active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (mlb_player_id) DO UPDATE SET
           name = EXCLUDED.name,
           position = EXCLUDED.position,
           pipeline_rank = EXCLUDED.pipeline_rank,
           current_team = EXCLUDED.current_team,
           current_level = EXCLUDED.current_level,
           active = true,
           updated_at = NOW()`,
        [
          mlbPlayerId || (900000 + prospect.pipelineRank),
          prospect.name,
          prospect.position,
          prospect.pipelineRank,
          prospect.team,
          prospect.level
        ]
      );
      console.log(`Added/updated ${prospect.name} (ID: ${mlbPlayerId || 'placeholder'})`);
    } catch (err) {
      console.error(`Error adding ${prospect.name}:`, err.message);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Clean up inactive prospects
  const deleted = await db.query(`DELETE FROM prospects WHERE active = false RETURNING name`);
  if (deleted.rowCount > 0) {
    console.log(`Removed ${deleted.rowCount} inactive prospects: ${deleted.rows.map(r => r.name).join(', ')}`);
  }

  console.log(`\nSeed complete! Added ${CUBS_PROSPECTS.length} prospects.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
