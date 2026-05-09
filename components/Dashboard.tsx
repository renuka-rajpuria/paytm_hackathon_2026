"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import TweetCard, { Tweet, TicketResolution, ResolutionStatus, RESOLUTION_META } from "./TweetCard";
import { AIAnalysis, AI_BASE_SCORES } from "@/lib/analyzeTweets";
import ProfileModal, { UserProfile, ProfileBadge } from "./ProfileModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Weights {
  retweets: number; quotes: number; replies: number;
  likes: number; views: number; followerMultiplier: number;
}

interface SavedFilter {
  name: string;
  segments: string[]; severities: string[]; sentiments: string[];
  datePreset?: string | null; dateFrom?: string; dateTo?: string;
  translatedOnly?: boolean;
}

interface WatchKeyword {
  id: string; keyword: string; createdAt: string;
}

interface DropdownOption {
  id: string; label: string; color?: string;
  disabled?: boolean; comingSoon?: boolean; icon?: React.ReactNode;
}

type ScoredEntry = {
  tweet: Tweet; ai: AIAnalysis | null;
  aiBase: number; engagement: number; follower: number; total: number;
};

type MainTab = "paytm" | "competitors" | "trending";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Weights = { retweets: 5, quotes: 4, replies: 3, likes: 2, views: 0.01, followerMultiplier: 5 };

const BRAND_META: Record<string, { label: string; color: string; bg: string }> = {
  razorpay: { label: "Razorpay", color: "#3730A3", bg: "#EEF2FF" },
  phonepe:  { label: "PhonePe",  color: "#6D28D9", bg: "#F5F3FF" },
};

const SEV_MAP: Record<string, { text: string; label: string; bar: string }> = {
  critical: { text: "text-red-600",     label: "Critical", bar: "#EF4444" },
  high:     { text: "text-orange-600",  label: "High",     bar: "#FB923C" },
  medium:   { text: "text-amber-600",   label: "Medium",   bar: "#FBBF24" },
  low:      { text: "text-emerald-600", label: "Low",      bar: "#34D399" },
};

const SENT_COLOR: Record<string, string> = {
  negative: "text-red-500", neutral: "text-gray-400", positive: "text-emerald-500",
};

const SEG_LABEL: Record<string, string> = {
  upi: "UPI", wallet: "Wallet", payment_gateway: "PG",
  b2b: "B2B", b2b_lending: "B2B Lending", gold: "Gold",
  flights: "Flights", hotels: "Hotels", insurance: "Insurance", general: "General",
};

const SEG_STYLE: Record<string, string> = {
  upi: "bg-blue-50 text-blue-600", wallet: "bg-purple-50 text-purple-600",
  payment_gateway: "bg-indigo-50 text-indigo-600", b2b: "bg-teal-50 text-teal-600",
  b2b_lending: "bg-emerald-50 text-emerald-600", gold: "bg-amber-50 text-amber-700",
  flights: "bg-sky-50 text-sky-600", hotels: "bg-orange-50 text-orange-600",
  insurance: "bg-rose-50 text-rose-600", general: "bg-gray-100 text-gray-500",
};

const DATE_PRESETS = [
  { id: "today",     label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d",        label: "Last 7 days" },
  { id: "30d",       label: "Last 30 days" },
  { id: "custom",    label: "Custom range" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getDateRange(preset: string | null, from: string, to: string): [Date, Date] | null {
  if (!preset) return null;
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eod   = new Date(today.getTime() + 86_400_000 - 1);
  switch (preset) {
    case "today":     return [today, eod];
    case "yesterday": return [new Date(today.getTime() - 86_400_000), new Date(today.getTime() - 1)];
    case "7d":        return [new Date(today.getTime() - 6  * 86_400_000), eod];
    case "30d":       return [new Date(today.getTime() - 29 * 86_400_000), eod];
    case "custom":
      if (!from || !to) return null;
      return [new Date(from + "T00:00:00"), new Date(to + "T23:59:59")];
    default: return null;
  }
}

function fmtDateRange(preset: string, from: string, to: string): string {
  if (preset !== "custom") return DATE_PRESETS.find((p) => p.id === preset)?.label ?? "Date";
  if (from && to) {
    const f = new Date(from).toLocaleString("en-IN", { day: "numeric", month: "short" });
    const t = new Date(to).toLocaleString("en-IN",   { day: "numeric", month: "short" });
    return `${f} – ${t}`;
  }
  return "Custom range";
}

// ─── Platform / filter options ────────────────────────────────────────────────

function XIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function RedditIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>;
}
function LinkedInIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}

const PLATFORM_OPTIONS: DropdownOption[] = [
  { id: "twitter",  label: "X / Twitter", icon: <XIcon /> },
  { id: "reddit",   label: "Reddit",      icon: <RedditIcon /> },
  { id: "linkedin", label: "LinkedIn",    icon: <LinkedInIcon />, disabled: true, comingSoon: true },
];
const SEGMENT_OPTIONS: DropdownOption[] = [
  { id: "upi", label: "UPI" }, { id: "wallet", label: "Wallet" },
  { id: "payment_gateway", label: "Payment Gateway" }, { id: "b2b", label: "B2B" },
  { id: "b2b_lending", label: "B2B Lending" }, { id: "gold", label: "Gold" },
  { id: "flights", label: "Flights" }, { id: "hotels", label: "Hotels" },
  { id: "insurance", label: "Insurance" }, { id: "general", label: "General" },
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
const STATUS_OPTIONS: DropdownOption[] = [
  { id: "open",        label: "Open",        color: "#9CA3AF" },
  { id: "in_progress", label: "In Progress", color: "#F59E0B" },
  { id: "resolved",    label: "Resolved",    color: "#10B981" },
  { id: "escalated",   label: "Escalated",   color: "#EF4444" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcEngagement(tweet: Tweet, w: Weights): number {
  return Math.min(25, Math.round(
    (tweet.retweets ?? 0) * w.retweets + (tweet.quotes  ?? 0) * w.quotes +
    (tweet.replies  ?? 0) * w.replies  + (tweet.likes   ?? 0) * w.likes  +
    (tweet.views    ?? 0) * w.views
  ));
}
function calcFollower(tweet: Tweet, w: Weights): number {
  return Math.min(15, Math.round(Math.log10((tweet.user?.followers ?? 0) + 1) * w.followerMultiplier));
}
function scoreAndSort(tweets: Tweet[], aiRecord: Record<string, AIAnalysis>, weights: Weights): ScoredEntry[] {
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
}

function applyFilters(
  scored: ScoredEntry[],
  platforms: string[], segments: string[], severities: string[], sentiments: string[],
  search: string, dateRange: [Date, Date] | null, translatedOnly: boolean,
  statuses: string[], resolutions: Record<string, TicketResolution>
): ScoredEntry[] {
  return scored.filter(({ tweet, ai }) => {
    if (platforms.length  > 0 && !platforms.includes(tweet.platform ?? "twitter"))  return false;
    if (segments.length   > 0 && !segments.includes(ai?.segment    ?? "general"))  return false;
    if (severities.length > 0 && !severities.includes(ai?.severity ?? "low"))      return false;
    if (sentiments.length > 0 && !sentiments.includes(ai?.sentiment ?? "neutral")) return false;
    if (translatedOnly && !ai?.is_translated)                                       return false;
    if (statuses.length  > 0 && !statuses.includes(resolutions[tweet.tweet_id]?.status ?? "open")) return false;
    if (search && !tweet.full_text.toLowerCase().includes(search.toLowerCase()) &&
        !(ai?.translated_text ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (dateRange) {
      const d = new Date(tweet.created_at);
      if (d < dateRange[0] || d > dateRange[1]) return false;
    }
    return true;
  });
}

// ─── Micro icons ─────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-150 flex-shrink-0 ${open ? "rotate-180" : ""}`}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon() {
  return <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function FilterIcon() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M3 13L13 3M13 3H7M13 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TranslateIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13M2.5 5.5h11M2.5 10.5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function TrendingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M1 12L5.5 7L8.5 10L13 4M13 4H10M13 4V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WatchlistIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── FilterDropdown (multi-select) ───────────────────────────────────────────

function FilterDropdown({ label, options, selected, onToggle, onClear }: {
  label: string; options: DropdownOption[];
  selected: string[]; onToggle: (id: string) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const active = selected.length > 0;
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
          active ? "border-[#00BAF2] text-[#00BAF2] bg-[#EAF9FF]"
                 : "border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:text-gray-800"
        }`}
      >
        <span>{label}</span>
        {active && (
          <span className="text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold" style={{ backgroundColor: "#00BAF2" }}>
            {selected.length}
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
                <button key={opt.id} onClick={() => { if (!opt.disabled) onToggle(opt.id); }} disabled={opt.disabled}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left ${
                    opt.disabled ? "cursor-not-allowed text-gray-300"
                      : checked  ? "bg-[#F0FBFF] text-gray-800"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center"
                    style={checked ? { backgroundColor: opt.color ?? "#00BAF2", borderColor: opt.color ?? "#00BAF2" }
                                   : { borderColor: opt.disabled ? "#E5E7EB" : "#D1D5DB" }}>
                    {checked && <CheckIcon />}
                  </span>
                  {opt.icon ? (
                    <span className={`flex-shrink-0 ${opt.disabled ? "opacity-30" : "opacity-80"}`}>{opt.icon}</span>
                  ) : opt.color ? (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.disabled ? "#D1D5DB" : opt.color }} />
                  ) : null}
                  <span className="flex-1">{opt.label}</span>
                  {opt.comingSoon && (
                    <span className="text-[9px] bg-gray-100 text-gray-400 rounded px-1.5 py-0.5 font-semibold tracking-wide flex-shrink-0">SOON</span>
                  )}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button onClick={() => { onClear(); setOpen(false); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DateDropdown ─────────────────────────────────────────────────────────────

function DateDropdown({ preset, from, to, onPreset, onFrom, onTo, onClear }: {
  preset: string | null; from: string; to: string;
  onPreset: (p: string | null) => void; onFrom: (d: string) => void;
  onTo: (d: string) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const active      = !!preset;
  const buttonLabel = active ? fmtDateRange(preset!, from, to) : "Date";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
          active ? "border-[#00BAF2] text-[#00BAF2] bg-[#EAF9FF]"
                 : "border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:text-gray-800"
        }`}
      >
        <CalendarIcon />
        <span className="max-w-[110px] truncate">{buttonLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[200px]">
          <div className="py-1.5">
            {DATE_PRESETS.map((p) => {
              const checked = preset === p.id;
              return (
                <button key={p.id} onClick={() => onPreset(checked ? null : p.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left ${
                    checked ? "bg-[#F0FBFF] text-gray-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
                    style={checked ? { backgroundColor: "#00BAF2", borderColor: "#00BAF2" } : { borderColor: "#D1D5DB" }}>
                    {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
          {preset === "custom" && (
            <div className="border-t border-gray-100 p-3 flex flex-col gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">From</label>
                <input type="date" value={from} onChange={(e) => onFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
                  onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">To</label>
                <input type="date" value={to} onChange={(e) => onTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
                  onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
            </div>
          )}
          {active && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button onClick={() => { onClear(); setOpen(false); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
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

function WeightSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-700">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
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

// ─── BrandSummaryCard ────────────────────────────────────────────────────────

function BrandSummaryCard({ brand, scored, paytmScored }: {
  brand: string; scored: ScoredEntry[]; paytmScored?: ScoredEntry[];
}) {
  const meta     = BRAND_META[brand] ?? { label: brand, color: "#6B7280", bg: "#F3F4F6" };
  const tweets   = scored.filter((e) => e.tweet.brand === brand);
  const critical = tweets.filter((e) => e.ai?.severity === "critical").length;
  const high     = tweets.filter((e) => e.ai?.severity === "high").length;
  const negative = tweets.filter((e) => e.ai?.sentiment === "negative").length;
  const negPct   = tweets.length ? Math.round((negative / tweets.length) * 100) : 0;
  const avgScore = tweets.length ? Math.round(tweets.reduce((s, e) => s + e.total, 0) / tweets.length) : 0;

  let delta: React.ReactNode = null;
  if (paytmScored && paytmScored.length > 0) {
    const pNeg  = paytmScored.filter((e) => e.ai?.sentiment === "negative").length;
    const pPct  = Math.round((pNeg / paytmScored.length) * 100);
    const diff  = negPct - pPct;
    const color = diff < 0 ? "text-emerald-500" : "text-red-500";
    delta = (
      <p className="text-[10px] mt-2 pt-2 border-t border-gray-100 text-gray-400">
        vs Paytm: <span className={`font-semibold ${color}`}>{diff > 0 ? `+${diff}` : diff}% negative sentiment</span>
      </p>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
        </div>
        <span className="text-xs text-gray-400">{tweets.length} tweet{tweets.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: critical,     label: "Critical",  color: "#EF4444" },
          { val: high,         label: "High",      color: "#F97316" },
          { val: `${negPct}%`, label: "Negative",  color: negPct > 60 ? "#EF4444" : "#111827" },
          { val: avgScore,     label: "Avg score", color: "#111827" },
        ].map(({ val, label, color }) => (
          <div key={label}>
            <div className="text-2xl font-semibold" style={{ color }}>{val}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {delta}
    </div>
  );
}

// ─── ListView ────────────────────────────────────────────────────────────────

function ListView({ entries, showBrand, resolutions }: { entries: ScoredEntry[]; showBrand: boolean; resolutions: Record<string, TicketResolution> }) {
  if (entries.length === 0) {
    return <div className="py-24 text-center text-sm text-gray-400">No tweets match the current filters.</div>;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {["Score", ...(showBrand ? ["Brand"] : []), "Severity", "Segment", "Sentiment", "Status", "User", "Tweet", "Engagement", "Date", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-4 last:pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map(({ tweet, ai, total }) => {
              const sev      = SEV_MAP[ai?.severity ?? "low"];
              const seg      = ai?.segment ?? "general";
              const sent     = ai?.sentiment ?? "neutral";
              const isReddit = tweet.platform === "reddit";
              const tweetUrl = isReddit
                ? (tweet.post_url ?? "#")
                : `https://x.com/${tweet.user.screen_name}/status/${tweet.tweet_id}`;
              const date     = tweet.created_at
                ? new Date(tweet.created_at).toLocaleString("en-IN", { day: "numeric", month: "short" }) : "";
              return (
                <tr key={tweet.tweet_id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="pl-4 pr-3 py-3 w-20">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono font-semibold text-gray-700">{total}</span>
                      <div className="h-1 w-14 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${total}%`, backgroundColor: sev.bar }} />
                      </div>
                    </div>
                  </td>
                  {showBrand && (
                    <td className="px-3 py-3 w-24">
                      {tweet.brand && BRAND_META[tweet.brand] && (
                        <span className="text-[10px] rounded-full px-2 py-0.5 font-semibold whitespace-nowrap"
                          style={{ backgroundColor: BRAND_META[tweet.brand].bg, color: BRAND_META[tweet.brand].color }}>
                          {BRAND_META[tweet.brand].label}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 w-20"><span className={`text-xs font-semibold ${sev.text}`}>{sev.label}</span></td>
                  <td className="px-3 py-3 w-28">
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium whitespace-nowrap ${SEG_STYLE[seg] ?? SEG_STYLE.general}`}>
                      {SEG_LABEL[seg] ?? seg}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-20"><span className={`text-xs font-medium capitalize ${SENT_COLOR[sent]}`}>{sent}</span></td>
                  <td className="px-3 py-3 w-28">
                    {(() => {
                      const res  = resolutions[tweet.tweet_id];
                      const st   = res?.status ?? "open";
                      const meta = RESOLUTION_META[st];
                      return (
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3 w-36">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-gray-800 truncate max-w-[128px]">{tweet.user.name}</span>
                      <span className="text-[10px] text-gray-400">@{tweet.user.screen_name}</span>
                      {tweet.user.followers != null && <span className="text-[10px] text-gray-300">{fmt(tweet.user.followers)} followers</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-xs"><p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{tweet.full_text}</p></td>
                  <td className="px-3 py-3 w-36">
                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
                      {isReddit ? (
                        <>
                          <span>⬆ {fmt(tweet.likes ?? 0)} upvotes</span>
                          <span>💬 {fmt(tweet.replies ?? 0)} comments</span>
                          {tweet.subreddit && <span className="text-orange-400">r/{tweet.subreddit}</span>}
                        </>
                      ) : (
                        <>
                          <span>👍 {fmt(tweet.likes ?? 0)}  🔁 {fmt(tweet.retweets ?? 0)}</span>
                          <span>💬 {fmt(tweet.replies ?? 0)}  👁 {fmt(tweet.views ?? 0)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-20 text-right"><span className="text-[10px] text-gray-400 whitespace-nowrap">{date}</span></td>
                  <td className="px-3 py-3 w-8 text-right">
                    <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-600 transition-colors inline-flex">
                      <ExternalIcon />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TrendingTab ─────────────────────────────────────────────────────────────

function TrendingTab({ allScored, watchKeywords }: { allScored: ScoredEntry[]; watchKeywords: WatchKeyword[] }) {
  // Top hashtags by total engagement
  const hashtagMap = new Map<string, { count: number; engagement: number }>();
  for (const { tweet } of allScored) {
    const eng = (tweet.likes ?? 0) + (tweet.retweets ?? 0) * 3 + (tweet.replies ?? 0) * 2 + (tweet.quotes ?? 0) * 2;
    for (const tag of tweet.hashtags ?? []) {
      const key = tag.toLowerCase();
      const cur = hashtagMap.get(key) ?? { count: 0, engagement: 0 };
      hashtagMap.set(key, { count: cur.count + 1, engagement: cur.engagement + eng });
    }
  }
  const topHashtags = [...hashtagMap.entries()]
    .sort((a, b) => b[1].engagement - a[1].engagement)
    .slice(0, 12);

  // Top mentioned users
  const mentionMap = new Map<string, { name: string; count: number }>();
  for (const { tweet } of allScored) {
    for (const m of tweet.mentions ?? []) {
      const cur = mentionMap.get(m.screen_name) ?? { name: m.name, count: 0 };
      mentionMap.set(m.screen_name, { name: cur.name, count: cur.count + 1 });
    }
  }
  const topMentions = [...mentionMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  // Spiking tweets (top total score)
  const spiking = allScored.slice(0, 5);

  // Severity breakdown
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const { ai } of allScored) {
    const s = (ai?.severity ?? "low") as keyof typeof sevCounts;
    if (s in sevCounts) sevCounts[s]++;
  }
  const total = allScored.length || 1;

  // Watchlist keyword hits
  const kwHits = watchKeywords.map((kw) => {
    const matches = allScored.filter((e) =>
      e.tweet.full_text.toLowerCase().includes(kw.keyword.toLowerCase())
    );
    const maxSev = matches.reduce((best, e) => {
      const order = ["critical", "high", "medium", "low"];
      const idx = order.indexOf(e.ai?.severity ?? "low");
      return idx < order.indexOf(best) ? (e.ai?.severity ?? "low") : best;
    }, "low");
    return { ...kw, count: matches.length, topSev: maxSev };
  }).filter((k) => k.count > 0).sort((a, b) => b.count - a.count);

  // Segment distribution
  const segMap = new Map<string, number>();
  for (const { ai } of allScored) {
    const seg = ai?.segment ?? "general";
    segMap.set(seg, (segMap.get(seg) ?? 0) + 1);
  }
  const topSegs = [...segMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      {/* Severity breakdown bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Severity Breakdown</p>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {[
            { key: "critical", color: "#EF4444" },
            { key: "high",     color: "#FB923C" },
            { key: "medium",   color: "#FBBF24" },
            { key: "low",      color: "#34D399" },
          ].map(({ key, color }) => {
            const count = sevCounts[key as keyof typeof sevCounts];
            const pct   = Math.round((count / total) * 100);
            return pct > 0 ? (
              <div key={key} className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, backgroundColor: color }} title={`${key}: ${count}`} />
            ) : null;
          })}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "critical", label: "Critical", color: "#EF4444" },
            { key: "high",     label: "High",     color: "#FB923C" },
            { key: "medium",   label: "Medium",   color: "#FBBF24" },
            { key: "low",      label: "Low",      color: "#34D399" },
          ].map(({ key, label, color }) => {
            const count = sevCounts[key as keyof typeof sevCounts];
            return (
              <div key={key} className="text-center">
                <div className="text-2xl font-semibold" style={{ color }}>{count}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
                <div className="text-[10px] text-gray-300">{Math.round((count / total) * 100)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Top hashtags */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Hashtags</p>
          {topHashtags.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No hashtags found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topHashtags.map(([tag, { count, engagement }], i) => {
                const maxEng = topHashtags[0][1].engagement || 1;
                return (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700 truncate">#{tag}</span>
                        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{count}×</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(engagement / maxEng) * 100}%`, backgroundColor: "#00BAF2" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top mentions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Mentions</p>
          {topMentions.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No mentions found</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topMentions.map(([handle, { name, count }], i) => (
                <div key={handle} className="flex items-center gap-2.5">
                  <span className="text-[10px] text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-gray-500">{name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400">@{handle}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-500 flex-shrink-0">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spiking tweets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingIcon />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Highest Priority Escalations</p>
        </div>
        <div className="flex flex-col divide-y divide-gray-50">
          {spiking.map(({ tweet, ai, total }) => {
            const sev      = SEV_MAP[ai?.severity ?? "low"];
            const tweetUrl = `https://x.com/${tweet.user.screen_name}/status/${tweet.tweet_id}`;
            return (
              <div key={tweet.tweet_id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0 w-10">
                  <span className="text-sm font-semibold font-mono text-gray-700">{total}</span>
                  <div className="w-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${total}%`, backgroundColor: sev.bar }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-semibold ${sev.text}`}>{sev.label}</span>
                    {tweet.brand && BRAND_META[tweet.brand] && (
                      <span className="text-[9px] rounded-full px-1.5 py-0.5 font-semibold"
                        style={{ backgroundColor: BRAND_META[tweet.brand].bg, color: BRAND_META[tweet.brand].color }}>
                        {BRAND_META[tweet.brand].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{tweet.full_text}</p>
                  <p className="text-[10px] text-gray-400 mt-1">@{tweet.user.screen_name} · {fmt(tweet.views ?? 0)} views</p>
                </div>
                <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                  <ExternalIcon />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Segment Distribution</p>
        <div className="grid grid-cols-3 gap-2">
          {topSegs.map(([seg, count]) => (
            <div key={seg} className={`rounded-lg px-3 py-2.5 flex flex-col gap-0.5 ${SEG_STYLE[seg] ?? SEG_STYLE.general}`}>
              <span className="text-lg font-semibold">{count}</span>
              <span className="text-[10px] font-medium opacity-80">{SEG_LABEL[seg] ?? seg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword watchlist hits */}
      {kwHits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <WatchlistIcon />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist Keyword Hits</p>
          </div>
          <div className="flex flex-col gap-2">
            {kwHits.map((kw) => {
              const sev = SEV_MAP[kw.topSev ?? "low"];
              return (
                <div key={kw.id} className="flex items-center gap-3">
                  <TagIcon />
                  <span className="text-xs font-medium text-gray-700 flex-1">{kw.keyword}</span>
                  <span className={`text-[10px] font-semibold ${sev.text}`}>{sev.label}</span>
                  <span className="text-xs font-mono text-gray-500">{kw.count} match{kw.count !== 1 ? "es" : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KeywordWatchlist sidebar ─────────────────────────────────────────────────

function KeywordWatchlist({
  keywords, allScored, onAdd, onDelete,
}: {
  keywords: WatchKeyword[];
  allScored: ScoredEntry[];
  onAdd: (kw: string) => void;
  onDelete: (id: string) => void;
}) {
  const [input, setInput] = useState("");

  function submit() {
    const v = input.trim();
    if (!v) return;
    onAdd(v);
    setInput("");
  }

  const withCounts = keywords.map((kw) => {
    const matches = allScored.filter((e) =>
      e.tweet.full_text.toLowerCase().includes(kw.keyword.toLowerCase())
    );
    const topSev = matches.reduce((best, e) => {
      const order = ["critical", "high", "medium", "low"];
      return order.indexOf(e.ai?.severity ?? "low") < order.indexOf(best)
        ? (e.ai?.severity ?? "low") : best;
    }, "low");
    return { ...kw, count: matches.length, topSev };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <WatchlistIcon />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keyword Watchlist</p>
      </div>

      {/* Add input */}
      <div className="flex gap-1.5 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add keyword…"
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-colors"
          onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
          onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
        />
        <button onClick={submit}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#00BAF2" }}
          title="Add keyword"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Keyword list */}
      {withCounts.length === 0 ? (
        <p className="text-[10px] text-gray-300 italic text-center py-2">No keywords yet</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {withCounts.map((kw) => {
            const sev = SEV_MAP[kw.topSev ?? "low"];
            return (
              <div key={kw.id} className="flex items-center gap-1.5 group">
                <TagIcon />
                <span className="text-xs text-gray-700 flex-1 truncate" title={kw.keyword}>{kw.keyword}</span>
                {kw.count > 0 ? (
                  <span className={`text-[10px] font-semibold flex-shrink-0 ${sev.text}`}>{kw.count}</span>
                ) : (
                  <span className="text-[10px] text-gray-300 flex-shrink-0">0</span>
                )}
                <button onClick={() => onDelete(kw.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  title="Remove"
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {keywords.length > 0 && (
        <p className="text-[10px] text-gray-300 mt-3 leading-relaxed">
          Counts show matches across all tweets. Highest severity shown per keyword.
        </p>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard({
  tweets, aiRecord, competitorTweets, competitorAiRecord, aiAvailable, aiError,
}: {
  tweets: Tweet[]; aiRecord: Record<string, AIAnalysis>;
  competitorTweets: Tweet[]; competitorAiRecord: Record<string, AIAnalysis>;
  aiAvailable: boolean; aiError?: string;
}) {
  const [tab,        setTab]        = useState<MainTab>("paytm");
  const [viewMode,   setViewMode]   = useState<"cards" | "list">("cards");
  const [weights,    setWeights]    = useState<Weights>(DEFAULT_WEIGHTS);
  const [segments,   setSegments]   = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [sentiments, setSentiments] = useState<string[]>([]);
  const [platforms,  setPlatforms]  = useState<string[]>([]);
  const [datePreset,     setDatePreset]     = useState<string | null>(null);
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [search,         setSearch]         = useState("");
  const [translatedOnly, setTranslatedOnly] = useState(false);

  const [savedFilters,  setSavedFilters]  = useState<SavedFilter[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName,      setSaveName]      = useState("");

  const [watchKeywords, setWatchKeywords] = useState<WatchKeyword[]>([]);

  // ── Profile & resolution state ──
  const [profiles,        setProfiles]        = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfileModal,setShowProfileModal] = useState(false);
  const [resolutions,     setResolutions]     = useState<Record<string, TicketResolution>>({});
  const [ticketStatuses,  setTicketStatuses]  = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("paytm_saved_filters");
      if (raw) setSavedFilters(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem("paytm_watch_keywords");
      if (raw) setWatchKeywords(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem("paytm_profiles");
      if (raw) setProfiles(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem("paytm_active_profile");
      if (raw) setActiveProfileId(raw);
    } catch {}
    try {
      const raw = localStorage.getItem("paytm_resolutions");
      if (raw) setResolutions(JSON.parse(raw));
    } catch {}
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;
  const isEditor      = activeProfile?.role === "editor";

  function addProfile(profile: UserProfile) {
    const updated = [...profiles, profile];
    setProfiles(updated);
    localStorage.setItem("paytm_profiles", JSON.stringify(updated));
    setActiveProfileId(profile.id);
    localStorage.setItem("paytm_active_profile", profile.id);
  }

  function switchProfile(id: string) {
    setActiveProfileId(id);
    localStorage.setItem("paytm_active_profile", id);
  }

  function updateResolution(tweetId: string, status: ResolutionStatus, note: string) {
    const entry: TicketResolution = {
      status, note,
      updatedBy:  activeProfile?.name ?? "Unknown",
      updatedAt:  new Date().toISOString(),
    };
    const updated = { ...resolutions, [tweetId]: entry };
    setResolutions(updated);
    localStorage.setItem("paytm_resolutions", JSON.stringify(updated));
  }

  const setWeight = (key: keyof Weights) => (v: number) => setWeights((w) => ({ ...w, [key]: v }));

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const dateRange = useMemo(() => getDateRange(datePreset, dateFrom, dateTo), [datePreset, dateFrom, dateTo]);

  const hasActiveFilter    = segments.length > 0 || severities.length > 0 || sentiments.length > 0 || !!datePreset || translatedOnly || ticketStatuses.length > 0;
  const totalActiveFilters = platforms.length + segments.length + severities.length + sentiments.length + (datePreset ? 1 : 0) + (translatedOnly ? 1 : 0) + ticketStatuses.length;

  function clearAll() {
    setSegments([]); setSeverities([]); setSentiments([]); setPlatforms([]);
    setDatePreset(null); setDateFrom(""); setDateTo(""); setTranslatedOnly(false);
    setTicketStatuses([]);
  }

  function saveFilter() {
    const name = saveName.trim();
    if (!name) return;
    const f: SavedFilter = { name, segments, severities, sentiments, datePreset, dateFrom, dateTo, translatedOnly };
    const updated = [...savedFilters.filter((x) => x.name !== name), f];
    setSavedFilters(updated);
    localStorage.setItem("paytm_saved_filters", JSON.stringify(updated));
    setSaveName(""); setSaveModalOpen(false);
  }

  function applyFilter(f: SavedFilter) {
    setSegments(f.segments); setSeverities(f.severities); setSentiments(f.sentiments);
    setDatePreset(f.datePreset ?? null);
    setDateFrom(f.dateFrom ?? ""); setDateTo(f.dateTo ?? "");
    setTranslatedOnly(f.translatedOnly ?? false);
  }

  function deleteFilter(name: string) {
    const updated = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(updated);
    localStorage.setItem("paytm_saved_filters", JSON.stringify(updated));
  }

  function addKeyword(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    if (watchKeywords.some((k) => k.keyword.toLowerCase() === trimmed.toLowerCase())) return;
    const entry: WatchKeyword = { id: crypto.randomUUID(), keyword: trimmed, createdAt: new Date().toISOString() };
    const updated = [...watchKeywords, entry];
    setWatchKeywords(updated);
    localStorage.setItem("paytm_watch_keywords", JSON.stringify(updated));
  }

  function deleteKeyword(id: string) {
    const updated = watchKeywords.filter((k) => k.id !== id);
    setWatchKeywords(updated);
    localStorage.setItem("paytm_watch_keywords", JSON.stringify(updated));
  }

  // ── CSV export ──
  function downloadCSV() {
    const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Rank", "Tweet ID", "Brand", "Username", "Name", "Followers", "Created At",
      "Tweet Text", "Likes", "Retweets", "Replies", "Quotes", "Views",
      "Severity", "Sentiment", "Segment", "Category", "AI Reason",
      "AI Score", "Engagement Score", "Follower Score", "Total Score",
    ];
    const rows = activeFiltered.map(({ tweet, ai, aiBase, engagement, follower, total }, i) => [
      i + 1, tweet.tweet_id, tweet.brand ?? (tab === "paytm" ? "paytm" : ""),
      tweet.user.screen_name, esc(tweet.user.name), tweet.user.followers ?? 0, tweet.created_at,
      esc(tweet.full_text), tweet.likes, tweet.retweets, tweet.replies, tweet.quotes, tweet.views ?? 0,
      ai?.severity ?? "low", ai?.sentiment ?? "neutral", ai?.segment ?? "general",
      ai?.category ?? "", esc(ai?.reason ?? ""),
      aiBase, engagement, follower, total,
    ].join(","));
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `escalations-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Scoring + filtering ──
  const paytmScored      = useMemo(() => scoreAndSort(tweets, aiRecord, weights), [tweets, aiRecord, weights]);
  const competitorScored = useMemo(() => scoreAndSort(competitorTweets, competitorAiRecord, weights), [competitorTweets, competitorAiRecord, weights]);
  const allScored        = useMemo(() => [...paytmScored, ...competitorScored], [paytmScored, competitorScored]);

  const paytmFiltered      = useMemo(() => applyFilters(paytmScored, platforms, segments, severities, sentiments, search, dateRange, translatedOnly, ticketStatuses, resolutions), [paytmScored, platforms, segments, severities, sentiments, search, dateRange, translatedOnly, ticketStatuses, resolutions]);
  const competitorFiltered = useMemo(() => applyFilters(competitorScored, platforms, segments, severities, sentiments, search, dateRange, translatedOnly, ticketStatuses, resolutions), [competitorScored, platforms, segments, severities, sentiments, search, dateRange, translatedOnly, ticketStatuses, resolutions]);

  const activeFiltered = tab === "paytm" ? paytmFiltered : competitorFiltered;
  const activeTweets   = tab === "paytm" ? tweets : competitorTweets;

  const critical = activeFiltered.filter((e) => e.ai?.severity === "critical").length;
  const high     = activeFiltered.filter((e) => e.ai?.severity === "high").length;
  const negative = activeFiltered.filter((e) => e.ai?.sentiment === "negative").length;
  const negPct   = activeFiltered.length ? Math.round((negative / activeFiltered.length) * 100) : 0;

  const now = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const filterSummary = [
    segments.length   > 0 && `${segments.length} segment${segments.length > 1 ? "s" : ""}`,
    severities.length > 0 && `${severities.length} severit${severities.length > 1 ? "ies" : "y"}`,
    sentiments.length > 0 && `${sentiments.length} sentiment${sentiments.length > 1 ? "s" : ""}`,
    datePreset        && fmtDateRange(datePreset, dateFrom, dateTo),
    translatedOnly    && "translated only",
  ].filter(Boolean).join(" · ");

  // Watchlist alert: any keyword with a critical/high match
  const watchAlerts = watchKeywords.filter((kw) =>
    allScored.some((e) =>
      e.tweet.full_text.toLowerCase().includes(kw.keyword.toLowerCase()) &&
      (e.ai?.severity === "critical" || e.ai?.severity === "high")
    )
  );

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1500px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Paytm_Logo.png" alt="Paytm" className="h-7 w-auto object-contain" />
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500 font-medium">Escalation Monitor</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {([
              { id: "paytm",       label: "Paytm" },
              { id: "competitors", label: "Competitors" },
              { id: "trending",    label: "Trending" },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t.label}
                {t.id === "trending" && watchAlerts.length > 0 && (
                  <span className="ml-1.5 text-[9px] text-white rounded-full px-1.5 py-0.5 font-bold" style={{ backgroundColor: "#EF4444" }}>
                    {watchAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={aiAvailable ? "text-gray-400" : "text-amber-600"}>
                {aiAvailable ? `AI · Updated ${now}` : "AI unavailable"}
              </span>
            </div>
            {activeProfile ? (
              <ProfileBadge profile={activeProfile} onClick={() => setShowProfileModal(true)} />
            ) : (
              <button onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#00BAF2] hover:text-[#00BAF2] transition-all">
                + Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {!aiAvailable && aiError && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2">
          <p className="text-xs text-amber-700 max-w-[1500px] mx-auto">
            <span className="font-semibold">AI offline:</span> {aiError}
          </p>
        </div>
      )}

      {/* ── Watchlist alert banner ── */}
      {watchAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-2">
          <p className="text-xs text-red-700 max-w-[1500px] mx-auto">
            <span className="font-semibold">Watchlist alert:</span>{" "}
            {watchAlerts.map((k) => k.keyword).join(", ")} — critical/high severity matches found
          </p>
        </div>
      )}

      {/* ── Filter bar (hidden on trending tab) ── */}
      {tab !== "trending" && (
        <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
          <div className="max-w-[1500px] mx-auto px-6 py-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-400 mr-1 flex-shrink-0">
                <FilterIcon />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Filters</span>
                {totalActiveFilters > 0 && (
                  <span className="text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold" style={{ backgroundColor: "#00BAF2" }}>
                    {totalActiveFilters}
                  </span>
                )}
              </div>
              <FilterDropdown label="Platform"  options={PLATFORM_OPTIONS}  selected={platforms}  onToggle={(id) => toggle(platforms,  setPlatforms,  id)} onClear={() => setPlatforms([])} />
              <FilterDropdown label="Segment"   options={SEGMENT_OPTIONS}   selected={segments}   onToggle={(id) => toggle(segments,   setSegments,   id)} onClear={() => setSegments([])} />
              <FilterDropdown label="Severity"  options={SEVERITY_OPTIONS}  selected={severities} onToggle={(id) => toggle(severities, setSeverities, id)} onClear={() => setSeverities([])} />
              <FilterDropdown label="Sentiment" options={SENTIMENT_OPTIONS} selected={sentiments} onToggle={(id) => toggle(sentiments, setSentiments, id)} onClear={() => setSentiments([])} />
              <DateDropdown
                preset={datePreset} from={dateFrom} to={dateTo}
                onPreset={setDatePreset} onFrom={setDateFrom} onTo={setDateTo}
                onClear={() => { setDatePreset(null); setDateFrom(""); setDateTo(""); }}
              />
              <button
                onClick={() => setTranslatedOnly((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex-shrink-0 ${
                  translatedOnly
                    ? "border-violet-400 text-violet-600 bg-violet-50"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                <TranslateIcon />
                <span>Translated</span>
              </button>
              <FilterDropdown label="Status" options={STATUS_OPTIONS} selected={ticketStatuses}
                onToggle={(id) => toggle(ticketStatuses, setTicketStatuses, id)}
                onClear={() => setTicketStatuses([])} />
              {totalActiveFilters > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                  <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">Clear all</button>
                </>
              )}
              {hasActiveFilter && (
                <button onClick={() => setSaveModalOpen(true)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#00BAF2] hover:text-[#00BAF2] transition-all flex-shrink-0 flex items-center gap-1 ml-auto">
                  + Save filter
                </button>
              )}
            </div>
            {savedFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Saved:</span>
                {savedFilters.map((f) => (
                  <span key={f.name} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full pl-2.5 pr-1.5 py-0.5">
                    <button onClick={() => applyFilter(f)} className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors">{f.name}</button>
                    <button onClick={() => deleteFilter(f.name)} className="w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Profile modal ── */}
      {showProfileModal && (
        <ProfileModal
          profiles={profiles}
          activeId={activeProfileId}
          onSwitch={switchProfile}
          onAdd={addProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* ── Save modal ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={(e) => e.target === e.currentTarget && setSaveModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl w-72">
            <p className="text-sm font-semibold text-gray-900 mb-1">Save filter preset</p>
            <p className="text-xs text-gray-400 mb-4">{filterSummary}</p>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveFilter()}
              placeholder="e.g. Critical UPI Issues"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
              onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
              onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button onClick={saveFilter} className="flex-1 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: "#00BAF2" }}>Save</button>
              <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-[1500px] mx-auto w-full px-6 py-6 flex gap-5 items-start">

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Trending tab */}
          {tab === "trending" && (
            <TrendingTab allScored={allScored} watchKeywords={watchKeywords} />
          )}

          {/* Paytm / Competitors tabs */}
          {tab !== "trending" && (
            <>
              <input type="text"
                placeholder={`Search ${tab === "paytm" ? "Paytm" : "competitor"} tweets, keywords, usernames…`}
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
                onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
              />

              {tab === "competitors" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Brand Comparison</p>
                    <p className="text-xs text-gray-400">Paytm negative% shown for context</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <BrandSummaryCard brand="razorpay" scored={competitorFiltered} paytmScored={paytmFiltered} />
                    <BrandSummaryCard brand="phonepe"  scored={competitorFiltered} paytmScored={paytmFiltered} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <StatCard label="Showing"  value={activeFiltered.length} sub={`of ${activeTweets.length} total`} />
                <StatCard label="Critical" value={critical}              sub="immediate action"   color="#EF4444" />
                <StatCard label="High"     value={high}                  sub="review within 1 hr" color="#F97316" />
                <StatCard label="Negative" value={`${negPct}%`} sub={`${negative} of ${activeFiltered.length}`} color={negPct > 50 ? "#EF4444" : "#111827"} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  {activeFiltered.length} result{activeFiltered.length !== 1 ? "s" : ""} · sorted by severity score
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {[{ color: "bg-red-400", label: "Critical" }, { color: "bg-orange-400", label: "High" },
                      { color: "bg-amber-400", label: "Medium" }, { color: "bg-emerald-400", label: "Low" }].map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${color}`} />{label}
                      </span>
                    ))}
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <button onClick={downloadCSV} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all">
                    <DownloadIcon /> CSV
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("cards")} title="Card view"
                      className={`p-1.5 transition-colors ${viewMode === "cards" ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600 bg-white"}`}>
                      <GridIcon />
                    </button>
                    <button onClick={() => setViewMode("list")} title="List view"
                      className={`p-1.5 border-l border-gray-200 transition-colors ${viewMode === "list" ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600 bg-white"}`}>
                      <ListIcon />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
                  {activeFiltered.length === 0 ? (
                    <div className="col-span-3 py-24 text-center text-sm text-gray-400">No tweets match the current filters.</div>
                  ) : (
                    activeFiltered.map(({ tweet, ai, engagement, follower, total }) => (
                      <TweetCard key={tweet.tweet_id} tweet={tweet} ai={ai}
                        engagementScore={engagement} followerScore={follower} totalScore={total}
                        resolution={resolutions[tweet.tweet_id] ?? null}
                        isEditor={isEditor}
                        editorName={activeProfile?.name ?? ""}
                        onUpdateResolution={updateResolution}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="pb-10">
                  <ListView entries={activeFiltered} showBrand={tab === "competitors"} resolutions={resolutions} />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-52 flex-shrink-0 sticky top-36 flex flex-col gap-4">
          {/* Keyword Watchlist */}
          <KeywordWatchlist
            keywords={watchKeywords}
            allScored={allScored}
            onAdd={addKeyword}
            onDelete={deleteKeyword}
          />

          {/* Score Weights */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Weights</p>
            <div className="flex flex-col gap-3.5">
              <WeightSlider label="Retweets"          value={weights.retweets}           min={0} max={10}  step={0.5}   onChange={setWeight("retweets")} />
              <WeightSlider label="Quotes"            value={weights.quotes}             min={0} max={10}  step={0.5}   onChange={setWeight("quotes")} />
              <WeightSlider label="Replies"           value={weights.replies}            min={0} max={10}  step={0.5}   onChange={setWeight("replies")} />
              <WeightSlider label="Likes"             value={weights.likes}              min={0} max={10}  step={0.5}   onChange={setWeight("likes")} />
              <WeightSlider label="Views"             value={weights.views}              min={0} max={0.1} step={0.005} onChange={setWeight("views")} />
              <WeightSlider label="Followers (log×)"  value={weights.followerMultiplier} min={0} max={10}  step={0.5}   onChange={setWeight("followerMultiplier")} />
              <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="text-xs mt-1 py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Reset defaults
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
