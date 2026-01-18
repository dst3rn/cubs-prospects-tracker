const Parser = require('rss-parser');
const db = require('../db');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail']
    ]
  }
});

// RSS feed sources
const RSS_FEEDS = [
  {
    url: 'https://www.mlb.com/cubs/feeds/news/rss.xml',
    source: 'MLB.com Cubs'
  },
  {
    url: 'https://www.milb.com/iowa-cubs/news/rss.xml',
    source: 'Iowa Cubs'
  },
  {
    url: 'https://www.milb.com/tennessee-smokies/news/rss.xml',
    source: 'Tennessee Smokies'
  },
  {
    url: 'https://www.milb.com/south-bend-cubs/news/rss.xml',
    source: 'South Bend Cubs'
  },
  {
    url: 'https://www.milb.com/myrtle-beach-pelicans/news/rss.xml',
    source: 'Myrtle Beach Pelicans'
  }
];

const newsParser = {
  /**
   * Fetch and parse a single RSS feed
   */
  async parseFeed(feedUrl, sourceName) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return feed.items.map(item => ({
        title: item.title,
        url: item.link,
        source: sourceName,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        summary: item.contentSnippet || item.content?.substring(0, 500) || '',
        imageUrl: item.media?.['$']?.url || item.thumbnail?.['$']?.url || null
      }));
    } catch (err) {
      console.error(`Error parsing feed ${sourceName}:`, err.message);
      return [];
    }
  },

  /**
   * Fetch all news feeds
   */
  async fetchAllFeeds() {
    const allArticles = [];

    for (const feed of RSS_FEEDS) {
      const articles = await this.parseFeed(feed.url, feed.source);
      allArticles.push(...articles);
    }

    return allArticles;
  },

  /**
   * Store articles in database (deduplicates by URL)
   */
  async storeArticles(articles) {
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const article of articles) {
      try {
        const result = await db.query(
          `INSERT INTO news_articles (title, url, source, published_at, summary, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (url) DO NOTHING
           RETURNING id`,
          [
            article.title,
            article.url,
            article.source,
            article.publishedAt,
            article.summary,
            article.imageUrl
          ]
        );

        if (result.rows.length > 0) {
          insertedCount++;
        } else {
          duplicateCount++;
        }
      } catch (err) {
        console.error('Error storing article:', err.message);
      }
    }

    return { insertedCount, duplicateCount };
  },

  /**
   * Clean up old articles (older than 30 days)
   */
  async cleanupOldArticles(daysToKeep = 30) {
    try {
      const result = await db.query(
        `DELETE FROM news_articles
         WHERE published_at < CURRENT_DATE - $1::INTEGER
         RETURNING id`,
        [daysToKeep]
      );
      return result.rowCount;
    } catch (err) {
      console.error('Error cleaning up old articles:', err.message);
      return 0;
    }
  }
};

module.exports = newsParser;
