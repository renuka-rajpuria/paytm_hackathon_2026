import { Tweet } from "@/components/TweetCard";

export interface TweetAnalysis {
  tweet_id: string;
  sentiment: "positive" | "neutral" | "negative";
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  reason: string;
  ai_base_score: number;     // max 60
  engagement_score: number;  // max 25
  follower_score: number;    // max 15
  total_severity_score: number; // max 100
}

// Engagement weights — reflect amplification potential
const ENGAGEMENT_WEIGHTS = {
  retweets: 5,   // highest — amplifies reach directly
  quotes:   4,   // reshared with commentary
  replies:  3,   // active discussion / complaints
  likes:    2,   // passive endorsement
  views:    0.01, // raw impressions, low per-unit weight
};

// AI severity → base score (out of 60)
const AI_BASE_SCORES: Record<string, number> = {
  critical: 60,
  high:     40,
  medium:   20,
  low:       5,
};

// Engagement score: raw interaction weight, capped at 25
function calcEngagementScore(tweet: Tweet): number {
  const raw =
    (tweet.retweets ?? 0) * ENGAGEMENT_WEIGHTS.retweets +
    (tweet.quotes   ?? 0) * ENGAGEMENT_WEIGHTS.quotes +
    (tweet.replies  ?? 0) * ENGAGEMENT_WEIGHTS.replies +
    (tweet.likes    ?? 0) * ENGAGEMENT_WEIGHTS.likes +
    (tweet.views    ?? 0) * ENGAGEMENT_WEIGHTS.views;
  return Math.min(25, Math.round(raw));
}

// Follower score: log scale so large accounts don't dominate, capped at 15
// ~10 followers → 5pts, ~100 → 10pts, ~1000+ → 15pts
function calcFollowerScore(tweet: Tweet): number {
  const followers = tweet.user?.followers ?? 0;
  const raw = Math.log10(followers + 1) * 5;
  return Math.min(15, Math.round(raw));
}

async function callPaytmAI(tweets: Tweet[]): Promise<TweetAnalysis[]> {
  const apiKey = process.env.PAYTM_AI_API_KEY;

  const prompt = `You are a social media monitoring system for Paytm. Analyze each tweet below.

For each tweet return:
- sentiment: "positive", "neutral", or "negative"
- severity: "low" | "medium" | "high" | "critical"
- category: short issue label (e.g. "payment_failure", "app_bug", "refund_issue", "account_block", "upi_error", "praise", "general")
- reason: one sentence explanation of the severity

Severity rules:
- critical: security breach, money lost permanently, service down for many users
- high: payment failed, money stuck, UPI blocked, account inaccessible
- medium: app crash, slow response, customer support failure, cashback issue
- low: minor inconvenience, general feedback, positive mention

Return ONLY a JSON array — no markdown, no explanation:
[{"tweet_id":"...","sentiment":"...","severity":"...","category":"...","reason":"..."}]

Tweets:
${tweets.map((t) => `[${t.tweet_id}] ${t.full_text}`).join("\n")}`;

  const res = await fetch("https://api.paytm-ai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.2,
    }),
    cache: "no-store",
  });

  const result = await res.json();
  console.log("[analyzeTweets] HTTP status:", res.status);
  console.log("[analyzeTweets] raw response:", JSON.stringify(result).slice(0, 300));

  if (!res.ok) throw new Error(`API error ${res.status}: ${JSON.stringify(result)}`);

  const content: string = result.choices?.[0]?.message?.content ?? "[]";
  const match = content.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

export interface AnalyzeResult {
  map: Map<string, TweetAnalysis>;
  aiAvailable: boolean;
  aiError?: string;
}

export async function analyzeTweets(
  tweets: Tweet[]
): Promise<AnalyzeResult> {
  const BATCH_SIZE = 25;
  const batches: Tweet[][] = [];
  for (let i = 0; i < tweets.length; i += BATCH_SIZE) {
    batches.push(tweets.slice(i, i + BATCH_SIZE));
  }

  let allResults: TweetAnalysis[] = [];
  let aiAvailable = false;
  let aiError: string | undefined;

  try {
    const batchResults = await Promise.all(batches.map((batch) => callPaytmAI(batch)));
    allResults = batchResults.flat();
    aiAvailable = allResults.length > 0;
    if (!aiAvailable) aiError = "AI returned no results — check API key or endpoint.";
  } catch (err) {
    aiError = String(err);
    console.error("[analyzeTweets] batch error:", err);
  }

  const map = new Map<string, TweetAnalysis>();

  for (const tweet of tweets) {
    const ai = allResults.find((r) => r.tweet_id === tweet.tweet_id);
    const severity = (ai?.severity ?? "low") as TweetAnalysis["severity"];
    const ai_base_score    = AI_BASE_SCORES[severity] ?? 5;
    const engagement_score = calcEngagementScore(tweet);
    const follower_score   = calcFollowerScore(tweet);
    const total_severity_score = Math.min(100, ai_base_score + engagement_score + follower_score);

    map.set(tweet.tweet_id, {
      tweet_id: tweet.tweet_id,
      sentiment: (ai?.sentiment ?? "neutral") as TweetAnalysis["sentiment"],
      severity,
      category: ai?.category ?? "general",
      reason:   ai?.reason   ?? "",
      ai_base_score,
      engagement_score,
      follower_score,
      total_severity_score,
    });
  }

  return { map, aiAvailable, aiError };
}
