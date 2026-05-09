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

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-semibold tracking-tight ${accent ?? "text-gray-900"}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default async function Home() {
  const tweets = loadTweets();
  const { map: analysisMap, aiAvailable, aiError } = await analyzeTweets(tweets);

  const enriched = tweets
    .map((tweet) => ({ tweet, analysis: analysisMap.get(tweet.tweet_id)! }))
    .sort((a, b) => b.analysis.total_severity_score - a.analysis.total_severity_score);

  const critical = enriched.filter((e) => e.analysis.severity === "critical").length;
  const high     = enriched.filter((e) => e.analysis.severity === "high").length;
  const negative = enriched.filter((e) => e.analysis.sentiment === "negative").length;
  const negPct   = tweets.length ? Math.round((negative / tweets.length) * 100) : 0;

  const now = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Paytm</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">Escalation Monitor</span>
            <span className="text-xs bg-sky-50 text-sky-600 border border-sky-200 rounded-full px-2 py-0.5 ml-1">
              Twitter / X
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${aiAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />
            {aiAvailable ? `Updated ${now}` : "AI unavailable · engagement scores only"}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* AI warning banner */}
        {!aiAvailable && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-1">
            <p className="text-sm font-medium text-amber-800">AI analysis unavailable</p>
            <p className="text-xs text-amber-700 font-mono break-all">{aiError}</p>
            <p className="text-xs text-amber-600 mt-1">Cards are sorted by engagement + reach score only. Severity and sentiment labels will show once the API responds.</p>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Mentions" value={tweets.length} sub="past 24 hours" />
          <StatCard label="Critical" value={critical} sub="immediate action needed" accent="text-red-500" />
          <StatCard label="High" value={high} sub="review within 1 hour" accent="text-orange-500" />
          <StatCard label="Negative Sentiment" value={`${negPct}%`} sub={`${negative} of ${tweets.length} posts`} accent={negPct > 50 ? "text-red-500" : "text-gray-900"} />
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Live Feed</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by severity score — highest first</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Low</span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
          {enriched.map(({ tweet, analysis }) => (
            <TweetCard key={tweet.tweet_id} tweet={tweet} analysis={analysis} />
          ))}
        </div>
      </main>
    </div>
  );
}
