-- Add game_type to distinguish spring training ('S') from regular season ('R')
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS game_type CHAR(1) DEFAULT 'R';

-- Backfill existing records: Feb and March are spring training
UPDATE daily_stats SET game_type = 'S' WHERE EXTRACT(MONTH FROM stat_date) IN (2, 3);
UPDATE daily_stats SET game_type = 'R' WHERE EXTRACT(MONTH FROM stat_date) NOT IN (2, 3);

CREATE INDEX IF NOT EXISTS idx_daily_stats_player_gametype ON daily_stats(mlb_player_id, game_type, stat_date DESC);
