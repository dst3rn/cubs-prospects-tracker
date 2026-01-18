-- Prospect roster (manually maintained to match Pipeline rankings)
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  mlb_player_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(10),
  pipeline_rank INTEGER,
  current_team VARCHAR(50),
  current_level VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily stats snapshot for rolling calculations
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  mlb_player_id INTEGER NOT NULL,
  stat_date DATE NOT NULL,
  -- Batting stats
  games INTEGER DEFAULT 0,
  at_bats INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  rbis INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0,
  avg DECIMAL(4,3),
  obp DECIMAL(4,3),
  slg DECIMAL(4,3),
  ops DECIMAL(4,3),
  -- Pitching stats (for pitchers)
  innings_pitched DECIMAL(5,1),
  earned_runs INTEGER,
  hits_allowed INTEGER,
  walks_allowed INTEGER,
  strikeouts_pitching INTEGER,
  era DECIMAL(5,2),
  whip DECIMAL(4,2),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  UNIQUE(mlb_player_id, stat_date)
);

-- Cached news articles
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(500) UNIQUE NOT NULL,
  source VARCHAR(100),
  published_at TIMESTAMP,
  summary TEXT,
  image_url VARCHAR(500),
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_player_date ON daily_stats(mlb_player_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_prospects_rank ON prospects(pipeline_rank) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
