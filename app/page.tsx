import fs from "fs";
import path from "path";
import TweetCard, { Tweet } from "@/components/TweetCard";
import { analyzeTweets } from "@/lib/analyzeTweets";

function loadTweets(): Tweet[] {
  const filePath = path.join(process.cwd(), "tweets_output.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data.tweets) ? data.tweets : [];
}

export default async function Home() {
  const tweets = loadTweets();
  const analysisMap = await analyzeTweets(tweets);

  const enriched = tweets
    .map((tweet) => ({ tweet, analysis: analysisMap.get(tweet.tweet_id)! }))
    .sort((a, b) => b.analysis.total_severity_score - a.analysis.total_severity_score);

  const criticalCount = enriched.filter(
    (e) => e.analysis.severity === "critical"
  ).length;
  const highCount = enriched.filter(
    (e) => e.analysis.severity === "high"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Paytm Social Monitor</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Twitter / X · {tweets.length} tweets · sorted by severity
        </p>
        <div className="flex gap-3 mt-3">
          <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-3 py-1">
            🔴 Critical: {criticalCount}
          </span>
          <span className="text-xs font-medium bg-orange-100 text-orange-700 rounded-full px-3 py-1">
            🟠 High: {highCount}
          </span>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-3 py-1">
            Total: {tweets.length}
          </span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map(({ tweet, analysis }) => (
            <TweetCard key={tweet.tweet_id} tweet={tweet} analysis={analysis} />
          ))}
        </div>
      </div>
    </main>
  );
}
