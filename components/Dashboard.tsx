"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import TweetCard, { Tweet } from "./TweetCard";
import { AIAnalysis, AI_BASE_SCORES } from "@/lib/analyzeTweets";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface DropdownOption {
  id: string;
  label: string;
  color?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  icon?: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Weights = {
  retweets: 5,
  quotes: 4,
  replies: 3,
  likes: 2,
  views: 0.01,
  followerMultiplier: 5,
};

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF4500">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const PLATFORM_OPTIONS: DropdownOption[] = [
  { id: "twitter", label: "X / Twitter", icon: <XIcon /> },
  { id: "reddit",  label: "Reddit",      icon: <RedditIcon />,  disabled: true, comingSoon: true },
  { id: "linkedin",label: "LinkedIn",    icon: <LinkedInIcon />,disabled: true, comingSoon: true },
];

const SEGMENT_OPTIONS: DropdownOption[] = [
  { id: "upi",             label: "UPI" },
  { id: "wallet",          label: "Wallet" },
  { id: "payment_gateway", label: "Payment Gateway" },
  { id: "b2b",             label: "B2B" },
  { id: "b2b_lending",     label: "B2B Lending" },
  { id: "gold",            label: "Gold" },
  { id: "flights",         label: "Flights" },
  { id: "hotels",          label: "Hotels" },
  { id: "insurance",       label: "Insurance" },
  { id: "general",         label: "General" },
];

const SEVERITY_OPTIONS: DropdownOption[] = [
  { id: "critical", label: "Critical", color: "#EF4444" },
  { id: "high",     label: "High",     color: "#F97316" },
  { id: "medium",   label: "Medium",   color: "#F59E0B" },
  { id: "low",      label: "Low",      color: "#34D399" },
];

const SENTIMENT_OPTIONS: DropdownOption[] = [
  { id: "negative", label: "Negative" },
  { id: "neutral",  label: "Neutral" },
  { id: "positive", label: "Positive" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Micro-components ─────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      className={`transition-transform duration-150 flex-shrink-0 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── FilterDropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const count = selected.length;
  const active = count > 0;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
          active
            ? "border-[#00BAF2] text-[#00BAF2] bg-[#EAF9FF]"
            : "border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:text-gray-800"
        }`}
      >
        <span>{label}</span>
        {active && (
          <span
            className="text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
            style={{ backgroundColor: "#00BAF2" }}
          >
            {count}
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[180px]">
          <div className="py-1.5">
            {options.map((opt) => {
              const checked = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => { if (!opt.disabled) onToggle(opt.id); }}
                  disabled={opt.disabled}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left ${
                    opt.disabled
                      ? "cursor-not-allowed text-gray-300"
                      : checked
                      ? "bg-[#F0FBFF] text-gray-800"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  {/* checkbox */}
                  <span
                    className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center"
                    style={
                      checked
                        ? { backgroundColor: opt.color ?? "#00BAF2", borderColor: opt.color ?? "#00BAF2" }
                        : { borderColor: opt.disabled ? "#E5E7EB" : "#D1D5DB" }
                    }
                  >
                    {checked && <CheckIcon />}
                  </span>

                  {/* platform icon or severity dot */}
                  {opt.icon ? (
                    <span className={`flex-shrink-0 ${opt.disabled ? "opacity-30" : "opacity-80"}`}>
                      {opt.icon}
                    </span>
                  ) : opt.color ? (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: opt.disabled ? "#D1D5DB" : opt.color }}
                    />
                  ) : null}

                  <span className="flex-1">{opt.label}</span>

                  {opt.comingSoon && (
                    <span className="text-[9px] bg-gray-100 text-gray-400 rounded px-1.5 py-0.5 font-semibold tracking-wide flex-shrink-0">
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WeightSlider ─────────────────────────────────────────────────────────────

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

// ─── StatCard ─────────────────────────────────────────────────────────────────

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

// ─── Dashboard ───────────────────────────────────────────────────────────────

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
  const [platforms,  setPlatforms]  = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [savedFilters,  setSavedFilters]  = useState<SavedFilter[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName,      setSaveName]      = useState("");

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

  const hasActiveFilter =
    segments.length > 0 || severities.length > 0 || sentiments.length > 0;

  function clearAll() {
    setSegments([]);
    setSeverities([]);
    setSentiments([]);
    setPlatforms([]);
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
        const ai         = aiRecord[tweet.tweet_id] ?? null;
        const aiBase     = AI_BASE_SCORES[ai?.severity ?? "low"] ?? 5;
        const engagement = calcEngagement(tweet, weights);
        const follower   = calcFollower(tweet, weights);
        const total      = Math.min(100, aiBase + engagement + follower);
        return { tweet, ai, aiBase, engagement, follower, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [tweets, aiRecord, weights]);

  const filtered = useMemo(() => {
    return scored.filter(({ tweet, ai }) => {
      // Platform: all current tweets are twitter; empty = show all
      if (platforms.length > 0 && !platforms.includes("twitter")) return false;
      if (segments.length   > 0 && !segments.includes(ai?.segment    ?? "general")) return false;
      if (severities.length > 0 && !severities.includes(ai?.severity ?? "low"))     return false;
      if (sentiments.length > 0 && !sentiments.includes(ai?.sentiment ?? "neutral")) return false;
      if (search && !tweet.full_text.toLowerCase().includes(search.toLowerCase()))  return false;
      return true;
    });
  }, [scored, platforms, segments, severities, sentiments, search]);

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

  const totalActiveFilters =
    platforms.length + segments.length + severities.length + sentiments.length;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Paytm_Logo.png" alt="Paytm" className="h-7 w-auto object-contain" />
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
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex flex-col gap-2">

          {/* dropdowns row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-400 mr-1 flex-shrink-0">
              <FilterIcon />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Filters</span>
              {totalActiveFilters > 0 && (
                <span
                  className="text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ backgroundColor: "#00BAF2" }}
                >
                  {totalActiveFilters}
                </span>
              )}
            </div>

            <FilterDropdown
              label="Platform"
              options={PLATFORM_OPTIONS}
              selected={platforms}
              onToggle={(id) => toggle(platforms, setPlatforms, id)}
              onClear={() => setPlatforms([])}
            />
            <FilterDropdown
              label="Segment"
              options={SEGMENT_OPTIONS}
              selected={segments}
              onToggle={(id) => toggle(segments, setSegments, id)}
              onClear={() => setSegments([])}
            />
            <FilterDropdown
              label="Severity"
              options={SEVERITY_OPTIONS}
              selected={severities}
              onToggle={(id) => toggle(severities, setSeverities, id)}
              onClear={() => setSeverities([])}
            />
            <FilterDropdown
              label="Sentiment"
              options={SENTIMENT_OPTIONS}
              selected={sentiments}
              onToggle={(id) => toggle(sentiments, setSentiments, id)}
              onClear={() => setSentiments([])}
            />

            {totalActiveFilters > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  Clear all
                </button>
              </>
            )}

            {hasActiveFilter && (
              <button
                onClick={() => setSaveModalOpen(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#00BAF2] hover:text-[#00BAF2] transition-all flex-shrink-0 flex items-center gap-1 ml-auto"
              >
                + Save filter
              </button>
            )}
          </div>

          {/* saved presets row */}
          {savedFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">
                Saved:
              </span>
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
                    className="w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors leading-none"
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

          <input
            type="text"
            placeholder="Search tweets, keywords, usernames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
            onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
          />

          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Showing"  value={filtered.length} sub={`of ${tweets.length} total`} />
            <StatCard label="Critical" value={critical}        sub="immediate action"   color="#EF4444" />
            <StatCard label="High"     value={high}            sub="review within 1 hr" color="#F97316" />
            <StatCard
              label="Negative"
              value={`${negPct}%`}
              sub={`${negative} of ${filtered.length}`}
              color={negPct > 50 ? "#EF4444" : "#111827"}
            />
          </div>

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
        <aside className="w-52 flex-shrink-0 sticky top-36">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Weights</p>
            <div className="flex flex-col gap-3.5">
              <WeightSlider label="Retweets"         value={weights.retweets}           min={0} max={10}  step={0.5}   onChange={setWeight("retweets")} />
              <WeightSlider label="Quotes"           value={weights.quotes}             min={0} max={10}  step={0.5}   onChange={setWeight("quotes")} />
              <WeightSlider label="Replies"          value={weights.replies}            min={0} max={10}  step={0.5}   onChange={setWeight("replies")} />
              <WeightSlider label="Likes"            value={weights.likes}              min={0} max={10}  step={0.5}   onChange={setWeight("likes")} />
              <WeightSlider label="Views"            value={weights.views}              min={0} max={0.1} step={0.005} onChange={setWeight("views")} />
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
