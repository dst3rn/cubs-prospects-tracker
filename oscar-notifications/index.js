import 'dotenv/config';
import { createTwitterClient, getUserId, getRecentTweets } from './twitterClient.js';
import { isWinnerAnnouncement, extractSummary } from './winnerParser.js';
import { sendNotification } from './notifier.js';

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const POLL_INTERVAL = (parseInt(process.env.POLL_INTERVAL_SECONDS, 10) || 30) * 1000;
const USERNAME = process.env.TWITTER_USERNAME || 'TheAcademy';

if (!BEARER_TOKEN) {
  console.error('Error: TWITTER_BEARER_TOKEN is required in .env');
  console.error('Get one at https://developer.twitter.com/en/portal/dashboard');
  process.exit(1);
}

async function main() {
  const client = createTwitterClient(BEARER_TOKEN);

  console.log(`Fetching user ID for @${USERNAME}...`);
  const userId = await getUserId(client, USERNAME);
  console.log(`Monitoring @${USERNAME} (ID: ${userId}) for Oscar winner announcements`);
  console.log(`Polling every ${POLL_INTERVAL / 1000} seconds`);
  console.log('Waiting for winner announcements...\n');

  let sinceId = null;

  // On first poll, grab latest tweet ID so we only see NEW tweets going forward
  const initialTweets = await getRecentTweets(client, userId, null);
  if (initialTweets.length > 0) {
    sinceId = initialTweets[0].id;
    console.log(`Starting from tweet ID ${sinceId} — only new tweets will trigger notifications.\n`);
  }

  async function poll() {
    try {
      const tweets = await getRecentTweets(client, userId, sinceId);

      if (tweets.length > 0) {
        // Update sinceId to the newest tweet
        sinceId = tweets[0].id;

        // Process tweets oldest-first so notifications come in order
        for (const tweet of tweets.reverse()) {
          if (isWinnerAnnouncement(tweet.text)) {
            const summary = extractSummary(tweet.text);
            sendNotification(summary, tweet.id);
          }
        }
      }
    } catch (err) {
      // Rate limit handling — Twitter API v2 has a 300 req/15min limit
      if (err.code === 429 || err.rateLimit) {
        const resetAt = err.rateLimit?.reset
          ? new Date(err.rateLimit.reset * 1000).toLocaleTimeString()
          : 'unknown';
        console.warn(`Rate limited. Resets at ${resetAt}. Will retry next interval.`);
      } else {
        console.error('Poll error:', err.message);
      }
    }
  }

  // Poll on interval
  setInterval(poll, POLL_INTERVAL);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
