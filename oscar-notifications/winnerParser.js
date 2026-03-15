// Keywords and patterns that indicate a winner announcement tweet
const WINNER_KEYWORDS = [
  'wins',
  'winner',
  'won',
  'goes to',
  'awarded',
  'takes home',
  'best picture',
  'best director',
  'best actress',
  'best actor',
  'best supporting',
  'best animated',
  'best international',
  'best documentary',
  'best original screenplay',
  'best adapted screenplay',
  'best cinematography',
  'best film editing',
  'best production design',
  'best costume design',
  'best makeup',
  'best original score',
  'best original song',
  'best sound',
  'best visual effects',
  'best short',
  'best live action',
  'oscar',
  '#oscars',
];

// Patterns that suggest a tweet is NOT a winner announcement
const EXCLUDE_PATTERNS = [
  /nominee/i,
  /nominated/i,
  /will present/i,
  /performing/i,
  /red carpet/i,
  /tune in/i,
  /watch live/i,
  /coming up/i,
  /don't miss/i,
];

/**
 * Checks if a tweet is likely an Oscar winner announcement.
 * Looks for winner-related keywords while filtering out
 * promotional/non-announcement tweets.
 */
export function isWinnerAnnouncement(tweetText) {
  const lower = tweetText.toLowerCase();

  // Must contain at least one winner-indicating keyword
  const hasWinnerKeyword = WINNER_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hasWinnerKeyword) return false;

  // Must have a specific "wins"/"winner"/"won"/"goes to"/"awarded" action word
  // (not just a category name alone)
  const hasActionWord = /\b(wins?|winner|won|goes to|awarded|takes home)\b/i.test(tweetText);
  if (!hasActionWord) return false;

  // Filter out non-announcement tweets
  const isExcluded = EXCLUDE_PATTERNS.some((pat) => pat.test(tweetText));
  if (isExcluded) return false;

  return true;
}

/**
 * Extracts a short summary from a winner announcement tweet.
 * Returns the first ~280 chars, cleaned up.
 */
export function extractSummary(tweetText) {
  // Remove URLs
  const cleaned = tweetText.replace(/https?:\/\/\S+/g, '').trim();
  return cleaned.slice(0, 280);
}
