const newsParser = require('../services/newsParser');

/**
 * News refresh job
 * Fetches latest news from all RSS feeds and stores in database
 */
async function runNewsRefreshJob() {
  console.log(`[${new Date().toISOString()}] Starting news refresh...`);

  try {
    // Fetch all feeds
    const articles = await newsParser.fetchAllFeeds();
    console.log(`Fetched ${articles.length} articles from all feeds`);

    // Store new articles
    const { insertedCount, duplicateCount } = await newsParser.storeArticles(articles);
    console.log(`Stored ${insertedCount} new articles, skipped ${duplicateCount} duplicates`);

    // Clean up old articles (weekly)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0) { // Sunday
      const deletedCount = await newsParser.cleanupOldArticles(30);
      console.log(`Cleaned up ${deletedCount} old articles`);
    }

    console.log(`[${new Date().toISOString()}] News refresh complete`);
    return { insertedCount, duplicateCount };
  } catch (err) {
    console.error('Error in news refresh job:', err);
    throw err;
  }
}

module.exports = {
  runNewsRefreshJob
};
