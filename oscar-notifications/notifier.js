/**
 * Notification handler. Currently logs to console.
 * Swap this out for Twilio, AWS SNS, etc. to send real texts.
 */

const alreadyNotified = new Set();

export function sendNotification(summary, tweetId) {
  // Deduplicate — don't notify twice for the same tweet
  if (alreadyNotified.has(tweetId)) return;
  alreadyNotified.add(tweetId);

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  console.log('');
  console.log('='.repeat(60));
  console.log(`OSCAR WINNER ANNOUNCED  [${timestamp}]`);
  console.log('-'.repeat(60));
  console.log(summary);
  console.log('='.repeat(60));
  console.log('');
}
