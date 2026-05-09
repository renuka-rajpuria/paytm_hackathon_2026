"use client";

import { useState, useMemo } from "react";
import TweetCard, { Tweet } from "./TweetCard";
import { AIAnalysis, AI_BASE_SCORES } from "@/lib/analyzeTweets";

interface Weights {
  retweets: number;
  quotes: number;
  replies: number;
  likes: number;
  views: number;
  followerMultiplier: number;
}

const DEFAULT_WEIGHTS: Weights = {
  retweets: 5,
  quotes: 4,
  replies: 3,
  likes: 2,
  views: 0.01,
  followerMultiplier: 5,
};

const SEGMENTS = [
  { id: "all", label: "All Segments" },
  { id: "upi", label: "UPI" },
  { id: "wallet", label: "Wallet" },
  { id: "payment_gateway", label: "Payment Gateway" },
  { id: "b2b", label: "B2B" },
  { id: "b2b_lending", label: "B2B Lending" },
  { id: "gold", label: "Gold" },
  { id: "flights", label: "Flights" },
  { id: "hotels", label: "Hotels" },
  { id: "insurance", label: "Insurance" },
  { id: "general", label: "General" },
];

const SEVERITIES = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const SENTIMENTS = [
  { id: "all", label: "All" },
  { id: "negative", label: "Negative" },
  { id: "neutral", label: "Neutral" },
  { id: "positive", label: "Positive" },
];

function calcEngagement(tweet: Tweet, w: Weights): number {
  const raw =
    (tweet.retweets ?? 0) * w.retweets +
    (tweet.quotes ?? 0) * w.quotes +
    (tweet.replies ?? 0) * w.replies +
    (tweet.likes ?? 0) * w.likes +
    (tweet.views ?? 0) * w.views;
  return Math.min(25, Math.round(raw));
}

function calcFollower(tweet: Tweet, w: Weights): number {
  const f = tweet.user?.followers ?? 0;
  return Math.min(15, Math.round(Math.log10(f + 1) * w.followerMultiplier));
}

function FilterSection({ title, options, value, onChange }: {
  title: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">{title}</p>
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`text-left text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
              value === opt.id ? "text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
            style={value === opt.id ? { backgroundColor: "#00BAF2" } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeightSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-700">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
        style={{ accentColor: "#00BAF2" }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-semibold tracking-tight" style={{ color: color ?? "#111827" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function Dashboard({
  tweets,
  aiRecord,
  aiAvailable,
  aiError,
}: {
  tweets: Tweet[];
  aiRecord: Record<string, AIAnalysis>;
  aiAvailable: boolean;
  aiError?: string;
}) {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [segment, setSegment] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [search, setSearch] = useState("");

  const setWeight = (key: keyof Weights) => (v: number) =>
    setWeights((w) => ({ ...w, [key]: v }));

  const scored = useMemo(() => {
    return tweets
      .map((tweet) => {
        const ai = aiRecord[tweet.tweet_id] ?? null;
        const aiBase = AI_BASE_SCORES[ai?.severity ?? "low"] ?? 5;
        const engagement = calcEngagement(tweet, weights);
        const follower = calcFollower(tweet, weights);
        const total = Math.min(100, aiBase + engagement + follower);
        return { tweet, ai, aiBase, engagement, follower, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [tweets, aiRecord, weights]);

  const filtered = useMemo(() => {
    return scored.filter(({ tweet, ai }) => {
      if (segment !== "all" && ai?.segment !== segment) return false;
      if (severity !== "all" && ai?.severity !== severity) return false;
      if (sentiment !== "all" && ai?.sentiment !== sentiment) return false;
      if (search && !tweet.full_text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [scored, segment, severity, sentiment, search]);

  const critical = filtered.filter((e) => e.ai?.severity === "critical").length;
  const high = filtered.filter((e) => e.ai?.severity === "high").length;
  const negative = filtered.filter((e) => e.ai?.sentiment === "negative").length;
  const negPct = filtered.length ? Math.round((negative / filtered.length) * 100) : 0;

  const now = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#00BAF2" }}>
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Paytm</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500 font-medium">Escalation Monitor</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={aiAvailable ? "text-gray-400" : "text-amber-600"}>
              {aiAvailable ? `AI · Updated ${now}` : "AI unavailable · engagement scores only"}
            </span>
          </div>
        </div>
      </header>

      {!aiAvailable && aiError && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2">
          <p className="text-xs text-amber-700 max-w-[1400px] mx-auto">
            <span className="font-semibold">AI offline:</span> {aiError}
          </p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 flex gap-5 items-start">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 flex flex-col gap-3 sticky top-20">
          <FilterSection title="Segment" options={SEGMENTS} value={segment} onChange={setSegment} />
          <FilterSection title="Severity" options={SEVERITIES} value={severity} onChange={setSeverity} />
          <FilterSection title="Sentiment" options={SENTIMENTS} value={sentiment} onChange={setSentiment} />

          {/* Weight editor */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <button
              onClick={() => setShowWeights((v) => !v)}
              className="flex items-center justify-between w-full group"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weights</p>
              <span className="text-gray-300 group-hover:text-gray-500 text-xs transition-colors">
                {showWeights ? "▲" : "▼"}
              </span>
            </button>

            {showWeights && (
              <div className="mt-4 flex flex-col gap-3.5">
                <WeightSlider label="Retweets" value={weights.retweets} min={0} max={10} step={0.5} onChange={setWeight("retweets")} />
                <WeightSlider label="Quotes" value={weights.quotes} min={0} max={10} step={0.5} onChange={setWeight("quotes")} />
                <WeightSlider label="Replies" value={weights.replies} min={0} max={10} step={0.5} onChange={setWeight("replies")} />
                <WeightSlider label="Likes" value={weights.likes} min={0} max={10} step={0.5} onChange={setWeight("likes")} />
                <WeightSlider label="Views" value={weights.views} min={0} max={0.1} step={0.005} onChange={setWeight("views")} />
                <WeightSlider label="Followers (log ×)" value={weights.followerMultiplier} min={0} max={10} step={0.5} onChange={setWeight("followerMultiplier")} />
                <button
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="text-xs mt-1 py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Reset defaults
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tweets, keywords, usernames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            style={{ boxShadow: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
          />

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Showing" value={filtered.length} sub={`of ${tweets.length} total`} />
            <StatCard label="Critical" value={critical} sub="immediate action" color="#EF4444" />
            <StatCard label="High" value={high} sub="review within 1 hr" color="#F97316" />
            <StatCard label="Negative" value={`${negPct}%`} sub={`${negative} of ${filtered.length}`} color={negPct > 50 ? "#EF4444" : "#111827"} />
          </div>

          {/* Legend + count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} · sorted by severity score
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {[
                { color: "bg-red-400", label: "Critical" },
                { color: "bg-orange-400", label: "High" },
                { color: "bg-amber-400", label: "Medium" },
                { color: "bg-emerald-400", label: "Low" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
            {filtered.length === 0 ? (
              <div className="col-span-3 py-24 text-center text-sm text-gray-400">
                No tweets match the current filters.
              </div>
            ) : (
              filtered.map(({ tweet, ai, engagement, follower, total }) => (
                <TweetCard
                  key={tweet.tweet_id}
                  tweet={tweet}
                  ai={ai}
                  engagementScore={engagement}
                  followerScore={follower}
                  totalScore={total}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
