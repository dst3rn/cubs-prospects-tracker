require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const prospectsRouter = require('./routes/prospects');
const statsRouter = require('./routes/stats');
const newsRouter = require('./routes/news');
const { runDailyStatsJob, updateTeamInfo } = require('./jobs/dailyStatsJob');
const { runNewsRefreshJob } = require('./jobs/newsRefreshJob');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/prospects', prospectsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/news', newsRouter);

// Admin endpoints for manual refresh
app.post('/api/admin/refresh/stats', async (req, res) => {
  try {
    const result = await runDailyStatsJob();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Stats refresh failed', message: err.message });
  }
});

app.post('/api/admin/refresh/news', async (req, res) => {
  try {
    const result = await runNewsRefreshJob();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'News refresh failed', message: err.message });
  }
});

app.post('/api/admin/refresh/teams', async (req, res) => {
  try {
    await updateTeamInfo();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Team info refresh failed', message: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Schedule cron jobs
// Daily stats refresh at 4am Central Time (10am UTC in summer, 11am UTC in winter)
// Using 10am UTC as a reasonable default
cron.schedule('0 10 * * *', async () => {
  console.log('Running scheduled daily stats refresh...');
  try {
    await runDailyStatsJob();
    await updateTeamInfo();
  } catch (err) {
    console.error('Scheduled stats refresh failed:', err);
  }
}, {
  timezone: 'America/Chicago'
});

// News refresh every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Running scheduled news refresh...');
  try {
    await runNewsRefreshJob();
  } catch (err) {
    console.error('Scheduled news refresh failed:', err);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run initial news fetch on startup (if database is available)
  if (process.env.DATABASE_URL) {
    setTimeout(async () => {
      try {
        console.log('Running initial news fetch...');
        await runNewsRefreshJob();
      } catch (err) {
        console.log('Initial news fetch skipped (database may need migration)');
      }
    }, 5000);
  }
});

module.exports = app;
