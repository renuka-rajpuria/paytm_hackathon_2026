import { Tweet } from "@/components/TweetCard";

export interface AIAnalysis {
  tweet_id: string;
  sentiment: "positive" | "neutral" | "negative";
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  reason: string;
  segment: string;
  ai_base_score: number;
}

export const AI_BASE_SCORES: Record<string, number> = {
  critical: 60,
  high: 40,
  medium: 20,
  low: 5,
};

export interface AnalyzeResult {
  map: Map<string, AIAnalysis>;
  aiAvailable: boolean;
  aiError?: string;
}

async function callPaytmAI(tweets: Tweet[]): Promise<AIAnalysis[]> {
  const apiKey = process.env.PAYTM_AI_API_KEY;

  const prompt = `You are a social media monitoring system for Paytm. Analyze each tweet below.

For each tweet return:
- sentiment: "positive", "neutral", or "negative"
- severity: "low" | "medium" | "high" | "critical"
- category: short issue label (e.g. "payment_failure", "app_bug", "refund_issue", "account_block", "upi_error", "praise", "general")
- reason: one sentence explanation
- segment: classify into one of: "upi", "wallet", "payment_gateway", "b2b", "b2b_lending", "gold", "flights", "hotels", "insurance", "general"

Segment guide:
- upi: UPI transactions, UPI PIN, NPCI, bank transfer via UPI
- wallet: Paytm wallet balance, add money, wallet transfer
- payment_gateway: merchant payments, PG, checkout, merchant settlement
- b2b: business payments, vendor payments, bulk transfers
- b2b_lending: business loans, working capital, credit line
- gold: gold purchase, gold savings, gold price, digital gold
- flights: flight booking, airline tickets, air travel
- hotels: hotel booking, accommodation, stay
- insurance: insurance premium, policy, claim
- general: unclear or mixed

Severity rules:
- critical: security breach, money lost permanently, service down for many users
- high: payment failed, money stuck, UPI blocked, account inaccessible
- medium: app crash, slow response, customer support failure, cashback issue
- low: minor inconvenience, general feedback, positive mention

Return ONLY a JSON array — no markdown, no explanation:
[{"tweet_id":"...","sentiment":"...","severity":"...","category":"...","reason":"...","segment":"..."}]

Tweets:
${tweets.map((t) => `[${t.tweet_id}] ${t.full_text}`).join("\n")}`;

  const res = await fetch("https://api.inference.paytm.com/v1/chat/completions", {
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

  if (!res.ok) throw new Error(`API error ${res.status}: ${JSON.stringify(result)}`);

  const content: string = result.choices?.[0]?.message?.content ?? "[]";
  const match = content.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

export async function analyzeTweets(tweets: Tweet[]): Promise<AnalyzeResult> {
  const BATCH_SIZE = 25;
  const batches: Tweet[][] = [];
  for (let i = 0; i < tweets.length; i += BATCH_SIZE) {
    batches.push(tweets.slice(i, i + BATCH_SIZE));
  }

  let allResults: AIAnalysis[] = [];
  let aiAvailable = false;
  let aiError: string | undefined;

  try {
    const batchResults = await Promise.all(batches.map((batch) => callPaytmAI(batch)));
    allResults = batchResults.flat();
    aiAvailable = allResults.length > 0;
    if (!aiAvailable) aiError = "AI returned no results — check API key or endpoint.";
  } catch (err) {
    aiError = String(err);
    console.error("[analyzeTweets] error:", err);
  }

  const map = new Map<string, AIAnalysis>();

  for (const tweet of tweets) {
    const ai = allResults.find((r) => r.tweet_id === tweet.tweet_id);
    const severity = (ai?.severity ?? "low") as AIAnalysis["severity"];

    map.set(tweet.tweet_id, {
      tweet_id: tweet.tweet_id,
      sentiment: (ai?.sentiment ?? "neutral") as AIAnalysis["sentiment"],
      severity,
      category: ai?.category ?? "general",
      reason: ai?.reason ?? "",
      segment: ai?.segment ?? "general",
      ai_base_score: AI_BASE_SCORES[severity] ?? 5,
    });
  }

  return { map, aiAvailable, aiError };
}
