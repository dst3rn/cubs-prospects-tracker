import { scrapeWinners, getSourceUrl } from './scraper.js';
import { sendNotification } from './notifier.js';

const POLL_INTERVAL = 60 * 1000; // Check every 60 seconds

const knownWinners = new Map();

async function poll() {
  try {
    const winners = await scrapeWinners();

    for (const [category, winner] of winners) {
      if (!knownWinners.has(category)) {
        knownWinners.set(category, winner);
        sendNotification(category, winner);
      }
    }
  } catch (err) {
    console.error('Poll error:', err.message);
  }
}

async function main() {
  console.log('Oscar Winner Notifier');
  console.log(`Scraping: ${getSourceUrl()}`);
  console.log(`Polling every ${POLL_INTERVAL / 1000} seconds`);
  console.log('Waiting for winner announcements...\n');

  // Initial scrape
  await poll();

  if (knownWinners.size > 0) {
    console.log(`Found ${knownWinners.size} winners already announced.\n`);
  }

  // Continue polling
  setInterval(poll, POLL_INTERVAL);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
