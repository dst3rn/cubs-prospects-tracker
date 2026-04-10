-- Fix late March records that were incorrectly tagged as spring training.
-- Regular season typically starts around March 25, so records from March 25+
-- should be regular season ('R'), not spring training ('S').
UPDATE daily_stats
SET game_type = 'R'
WHERE game_type = 'S'
  AND EXTRACT(MONTH FROM stat_date) = 3
  AND EXTRACT(DAY FROM stat_date) >= 25;
