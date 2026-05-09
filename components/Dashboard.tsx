"use client";

import { useState, useMemo, useEffect } from "react";
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

interface SavedFilter {
  name: string;
  segments: string[];
  severities: string[];
  sentiments: string[];
}

const DEFAULT_WEIGHTS: Weights = {
  retweets: 5,
  quotes: 4,
  replies: 3,
  likes: 2,
  views: 0.01,
  followerMultiplier: 5,
};

const SEGMENT_OPTIONS = [
  { id: "upi",             label: "UPI" },
  { id: "wallet",          label: "Wallet" },
  { id: "payment_gateway", label: "PG" },
  { id: "b2b",             label: "B2B" },
  { id: "b2b_lending",     label: "B2B Lending" },
  { id: "gold",            label: "Gold" },
  { id: "flights",         label: "Flights" },
  { id: "hotels",          label: "Hotels" },
  { id: "insurance",       label: "Insurance" },
  { id: "general",         label: "General" },
];

const SEVERITY_OPTIONS = [
  { id: "critical", label: "Critical", color: "#EF4444" },
  { id: "high",     label: "High",     color: "#F97316" },
  { id: "medium",   label: "Medium",   color: "#F59E0B" },
  { id: "low",      label: "Low",      color: "#34D399" },
];

const SENTIMENT_OPTIONS = [
  { id: "negative", label: "Negative" },
  { id: "neutral",  label: "Neutral" },
  { id: "positive", label: "Positive" },
];

function calcEngagement(tweet: Tweet, w: Weights): number {
  const raw =
    (tweet.retweets ?? 0) * w.retweets +
    (tweet.quotes   ?? 0) * w.quotes +
    (tweet.replies  ?? 0) * w.replies +
    (tweet.likes    ?? 0) * w.likes +
    (tweet.views    ?? 0) * w.views;
  return Math.min(25, Math.round(raw));
}

function calcFollower(tweet: Tweet, w: Weights): number {
  const f = tweet.user?.followers ?? 0;
  return Math.min(15, Math.round(Math.log10(f + 1) * w.followerMultiplier));
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Chip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const bg = color ?? "#00BAF2";
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all font-medium whitespace-nowrap ${
        active
          ? "border-transparent text-white"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
      style={active ? { backgroundColor: bg, borderColor: bg } : {}}
    >
      {label}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 self-center">
      {children}
    </span>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-gray-200 flex-shrink-0 self-center" />;
}

function WeightSlider({
  label, value, min, max, step, onChange,
}: {
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
      <span className="text-3xl font-semibold tracking-tight" style={{ color: color ?? "#111827" }}>
        {value}
      </span>
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
  const [segments,   setSegments]   = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [sentiments, setSentiments] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [savedFilters,   setSavedFilters]   = useState<SavedFilter[]>([]);
  const [saveModalOpen,  setSaveModalOpen]  = useState(false);
  const [saveName,       setSaveName]       = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("paytm_saved_filters");
      if (raw) setSavedFilters(JSON.parse(raw));
    } catch {}
  }, []);

  const setWeight = (key: keyof Weights) => (v: number) =>
    setWeights((w) => ({ ...w, [key]: v }));

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const hasActiveFilter = segments.length > 0 || severities.length > 0 || sentiments.length > 0;

  function clearAll() {
    setSegments([]);
    setSeverities([]);
    setSentiments([]);
  }

  function saveFilter() {
    const name = saveName.trim();
    if (!name) return;
    const f: SavedFilter = { name, segments, severities, sentiments };
    const updated = [...savedFilters.filter((x) => x.name !== name), f];
    setSavedFilters(updated);
    localStorage.setItem("paytm_saved_filters", JSON.stringify(updated));
    setSaveName("");
    setSaveModalOpen(false);
  }

  function applyFilter(f: SavedFilter) {
    setSegments(f.segments);
    setSeverities(f.severities);
    setSentiments(f.sentiments);
  }

  function deleteFilter(name: string) {
    const updated = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(updated);
    localStorage.setItem("paytm_saved_filters", JSON.stringify(updated));
  }

  const scored = useMemo(() => {
    return tweets
      .map((tweet) => {
        const ai     = aiRecord[tweet.tweet_id] ?? null;
        const aiBase = AI_BASE_SCORES[ai?.severity ?? "low"] ?? 5;
        const engagement = calcEngagement(tweet, weights);
        const follower   = calcFollower(tweet, weights);
        const total  = Math.min(100, aiBase + engagement + follower);
        return { tweet, ai, aiBase, engagement, follower, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [tweets, aiRecord, weights]);

  const filtered = useMemo(() => {
    return scored.filter(({ tweet, ai }) => {
      if (segments.length   > 0 && !segments.includes(ai?.segment   ?? "general")) return false;
      if (severities.length > 0 && !severities.includes(ai?.severity ?? "low"))     return false;
      if (sentiments.length > 0 && !sentiments.includes(ai?.sentiment ?? "neutral")) return false;
      if (search && !tweet.full_text.toLowerCase().includes(search.toLowerCase()))  return false;
      return true;
    });
  }, [scored, segments, severities, sentiments, search]);

  const critical = filtered.filter((e) => e.ai?.severity === "critical").length;
  const high     = filtered.filter((e) => e.ai?.severity === "high").length;
  const negative = filtered.filter((e) => e.ai?.sentiment === "negative").length;
  const negPct   = filtered.length ? Math.round((negative / filtered.length) * 100) : 0;

  const now = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  const filterSummary = [
    segments.length   > 0 && `${segments.length} segment${segments.length   > 1 ? "s" : ""}`,
    severities.length > 0 && `${severities.length} severit${severities.length > 1 ? "ies" : "y"}`,
    sentiments.length > 0 && `${sentiments.length} sentiment${sentiments.length > 1 ? "s" : ""}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
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

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-col gap-2">

          {/* chips row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
              <FilterIcon />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Filters</span>
            </div>

            <Divider />

            <GroupLabel>Segment</GroupLabel>
            {SEGMENT_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                active={segments.includes(opt.id)}
                onClick={() => toggle(segments, setSegments, opt.id)}
              />
            ))}

            <Divider />

            <GroupLabel>Severity</GroupLabel>
            {SEVERITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                active={severities.includes(opt.id)}
                color={opt.color}
                onClick={() => toggle(severities, setSeverities, opt.id)}
              />
            ))}

            <Divider />

            <GroupLabel>Sentiment</GroupLabel>
            {SENTIMENT_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                active={sentiments.includes(opt.id)}
                onClick={() => toggle(sentiments, setSentiments, opt.id)}
              />
            ))}

            {hasActiveFilter && (
              <>
                <Divider />
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  Clear
                </button>
                <button
                  onClick={() => setSaveModalOpen(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all flex-shrink-0 flex items-center gap-1"
                >
                  <span className="text-base leading-none">+</span> Save filter
                </button>
              </>
            )}
          </div>

          {/* saved filters row */}
          {savedFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Saved:</span>
              {savedFilters.map((f) => (
                <span
                  key={f.name}
                  className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full pl-2.5 pr-1.5 py-0.5"
                >
                  <button
                    onClick={() => applyFilter(f)}
                    className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={() => deleteFilter(f.name)}
                    className="w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Save modal ── */}
      {saveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={(e) => e.target === e.currentTarget && setSaveModalOpen(false)}
        >
          <div className="bg-white rounded-2xl p-6 shadow-xl w-72">
            <p className="text-sm font-semibold text-gray-900 mb-1">Save filter preset</p>
            <p className="text-xs text-gray-400 mb-4">{filterSummary}</p>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveFilter()}
              placeholder="e.g. Critical UPI Issues"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
              style={{ borderColor: undefined }}
              onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
              onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={saveFilter}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#00BAF2" }}
              >
                Save
              </button>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 flex gap-5 items-start">

        {/* Main */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search */}
          <input
            type="text"
            placeholder="Search tweets, keywords, usernames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
            onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
          />

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Showing"  value={filtered.length} sub={`of ${tweets.length} total`} />
            <StatCard label="Critical" value={critical}        sub="immediate action"             color="#EF4444" />
            <StatCard label="High"     value={high}            sub="review within 1 hr"           color="#F97316" />
            <StatCard
              label="Negative"
              value={`${negPct}%`}
              sub={`${negative} of ${filtered.length}`}
              color={negPct > 50 ? "#EF4444" : "#111827"}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} · sorted by severity score
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {[
                { color: "bg-red-400",     label: "Critical" },
                { color: "bg-orange-400",  label: "High" },
                { color: "bg-amber-400",   label: "Medium" },
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

        {/* ── Weights sidebar ── */}
        <aside className="w-52 flex-shrink-0 sticky top-[9rem]">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Weights</p>
            <div className="flex flex-col gap-3.5">
              <WeightSlider label="Retweets"       value={weights.retweets}           min={0} max={10}  step={0.5}   onChange={setWeight("retweets")} />
              <WeightSlider label="Quotes"         value={weights.quotes}             min={0} max={10}  step={0.5}   onChange={setWeight("quotes")} />
              <WeightSlider label="Replies"        value={weights.replies}            min={0} max={10}  step={0.5}   onChange={setWeight("replies")} />
              <WeightSlider label="Likes"          value={weights.likes}              min={0} max={10}  step={0.5}   onChange={setWeight("likes")} />
              <WeightSlider label="Views"          value={weights.views}              min={0} max={0.1} step={0.005} onChange={setWeight("views")} />
              <WeightSlider label="Followers (log×)" value={weights.followerMultiplier} min={0} max={10}  step={0.5}   onChange={setWeight("followerMultiplier")} />
              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-xs mt-1 py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
