import { TwitterApi } from 'twitter-api-v2';

export function createTwitterClient(bearerToken) {
  return new TwitterApi(bearerToken).readOnly;
}

export async function getUserId(client, username) {
  const user = await client.v2.userByUsername(username);
  if (!user.data) {
    throw new Error(`Twitter user @${username} not found`);
  }
  return user.data.id;
}

export async function getRecentTweets(client, userId, sinceId) {
  const params = {
    max_results: 10,
    'tweet.fields': 'created_at,text',
    exclude: ['retweets', 'replies'],
  };

  if (sinceId) {
    params.since_id = sinceId;
  }

  const timeline = await client.v2.userTimeline(userId, params);
  return timeline.data?.data || [];
}
