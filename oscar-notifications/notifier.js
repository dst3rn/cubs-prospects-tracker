/**
 * Notification handler. Currently logs to console.
 * Swap this out for Twilio, AWS SNS, etc. to send real texts.
 */

export function sendNotification(category, winner) {
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  console.log('='.repeat(50));
  console.log(`  OSCAR WINNER  [${timestamp}]`);
  console.log(`  ${category}`);
  console.log(`  >> ${winner}`);
  console.log('='.repeat(50));
  console.log('');
}
