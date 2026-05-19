"use client";

import { useState, useRef, useEffect } from "react";
import { AIAnalysis } from "@/lib/analyzeTweets";

interface MediaUrl { type: string; url: string }
interface TweetUser {
  name: string;
  screen_name: string;
  avatar_url?: string;
  location?: string;
  followers?: number;
  is_verified?: boolean;
  is_blue_verified?: boolean;
}

export interface Tweet {
  tweet_id: string;
  full_text: string;
  created_at: string;
  lang?: string;
  platform?: string;
  subreddit?: string;
  post_url?: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  hashtags: string[];
  mentions: { screen_name: string; name: string }[];
  media_urls: MediaUrl[];
  user: TweetUser;
  brand?: string;
}

export type ResolutionStatus = "open" | "in_progress" | "resolved" | "escalated";

export interface TicketResolution {
  status: ResolutionStatus;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export const RESOLUTION_META: Record<ResolutionStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  open:        { label: "Open",        bg: "bg-gray-100",     text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400"    },
  in_progress: { label: "In Progress", bg: "bg-amber-50",     text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
  resolved:    { label: "Resolved",    bg: "bg-emerald-50",   text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  escalated:   { label: "Escalated",   bg: "bg-red-50",       text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400"     },
};

const SEV = {
  critical: { border: "border-l-red-500",    dot: "bg-red-500",     label: "Critical", text: "text-red-600",    bar: "#EF4444" },
  high:     { border: "border-l-orange-400", dot: "bg-orange-400",  label: "High",     text: "text-orange-600", bar: "#FB923C" },
  medium:   { border: "border-l-amber-400",  dot: "bg-amber-400",   label: "Medium",   text: "text-amber-600",  bar: "#FBBF24" },
  low:      { border: "border-l-emerald-400",dot: "bg-emerald-400", label: "Low",      text: "text-emerald-600",bar: "#34D399" },
};

const SENT_COLOR = {
  negative: "text-red-500",
  neutral:  "text-gray-400",
  positive: "text-emerald-500",
};

const BRAND_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  razorpay: { bg: "#EEF2FF", text: "#3730A3", label: "Razorpay" },
  phonepe:  { bg: "#F5F3FF", text: "#6D28D9", label: "PhonePe" },
};

const SEGMENT_STYLE: Record<string, string> = {
  upi: "bg-blue-50 text-blue-600", wallet: "bg-purple-50 text-purple-600",
  payment_gateway: "bg-indigo-50 text-indigo-600", b2b: "bg-teal-50 text-teal-600",
  b2b_lending: "bg-emerald-50 text-emerald-600", gold: "bg-amber-50 text-amber-700",
  flights: "bg-sky-50 text-sky-600", hotels: "bg-orange-50 text-orange-600",
  insurance: "bg-rose-50 text-rose-600", general: "bg-gray-100 text-gray-500",
};

const SEGMENT_LABEL: Record<string, string> = {
  upi: "UPI", wallet: "Wallet", payment_gateway: "PG",
  b2b: "B2B", b2b_lending: "B2B Lending", gold: "Gold",
  flights: "Flights", hotels: "Hotels", insurance: "Insurance", general: "General",
};

const LANG_LABEL: Record<string, string> = {
  hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali",
  mr: "Marathi", kn: "Kannada", gu: "Gujarati", pa: "Punjabi",
  ur: "Urdu", ml: "Malayalam", or: "Odia",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function GlobeIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" className="inline-block flex-shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5C8 1.5 5.5 4.5 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4.5 10.5 8S8 14.5 8 14.5M1.5 8h13M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Ticket status picker (editor only) ──────────────────────────────────────

function TicketStatusBadge({
  tweetId,
  resolution,
  isEditor,
  editorName,
  onUpdate,
}: {
  tweetId: string;
  resolution: TicketResolution | null;
  isEditor: boolean;
  editorName: string;
  onUpdate: (status: ResolutionStatus, note: string) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [status, setStatus] = useState<ResolutionStatus>(resolution?.status ?? "open");
  const [note,   setNote]   = useState(resolution?.note ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatus(resolution?.status ?? "open");
    setNote(resolution?.note ?? "");
  }, [resolution]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const current = resolution?.status ?? "open";
  const meta    = RESOLUTION_META[current];

  function save() {
    onUpdate(status, note);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        {/* Status badge — always visible */}
        <button
          onClick={() => isEditor && setOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2 py-0.5 border transition-all ${meta.bg} ${meta.text} ${meta.border} ${isEditor ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
          {isEditor && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Who updated + when */}
        {resolution && resolution.status !== "open" && (
          <span className="text-[10px] text-gray-400 truncate">
            by {resolution.updatedBy} · {fmtAgo(resolution.updatedAt)}
          </span>
        )}
      </div>

      {/* Editor popover */}
      {open && isEditor && (
        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl border border-gray-200 shadow-xl z-40 w-64 p-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Update Status</p>

          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(RESOLUTION_META) as [ResolutionStatus, typeof RESOLUTION_META[ResolutionStatus]][]).map(([s, m]) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                  status === s ? `${m.bg} ${m.text} ${m.border}` : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
                {m.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Note (optional)</label>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Called customer, refund initiated…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none resize-none transition-colors"
              onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
              onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={save}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#00BAF2" }}>
              Update
            </button>
            <button onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>

          {note && resolution?.note === note && resolution?.status === status && (
            <p className="text-[10px] text-gray-400 italic">"{note}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TweetCard ────────────────────────────────────────────────────────────────

export default function TweetCard({
  tweet, ai, engagementScore, followerScore, totalScore,
  resolution, isEditor, editorName, onUpdateResolution,
}: {
  tweet: Tweet;
  ai: AIAnalysis | null;
  engagementScore: number;
  followerScore: number;
  totalScore: number;
  resolution?: TicketResolution | null;
  isEditor?: boolean;
  editorName?: string;
  onUpdateResolution?: (tweetId: string, status: ResolutionStatus, note: string) => void;
}) {
  const severity = ai?.severity ?? "low";
  const s        = SEV[severity];
  const isReddit = tweet.platform === "reddit";
  const tweetUrl = isReddit
    ? (tweet.post_url ?? "https://www.reddit.com")
    : `https://x.com/${tweet.user.screen_name}/status/${tweet.tweet_id}`;
  const brandStyle = tweet.brand ? BRAND_STYLE[tweet.brand] : null;
  const photo      = tweet.media_urls?.find((m) => m.type === "photo");

  const date = tweet.created_at
    ? new Date(tweet.created_at).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "";

  const segment   = ai?.segment ?? "general";
  const segStyle  = SEGMENT_STYLE[segment] ?? SEGMENT_STYLE.general;
  const segLabel  = SEGMENT_LABEL[segment] ?? segment;

  const sourceLang   = ai?.language ?? tweet.lang ?? "en";
  const isTranslated = !!(ai?.is_translated && ai.translated_text && sourceLang !== "en");
  const langLabel    = LANG_LABEL[sourceLang] ?? sourceLang.toUpperCase();

  return (
    <article className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.border} flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200`}>
      {photo && <img src={photo.url} alt="" className="w-full h-32 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
              <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
            </div>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${segStyle}`}>{segLabel}</span>
            {brandStyle && (
              <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                style={{ backgroundColor: brandStyle.bg, color: brandStyle.text }}>
                {brandStyle.label}
              </span>
            )}
            {isReddit && (
              <span className="text-[10px] rounded-full px-2 py-0.5 font-semibold bg-orange-50 text-orange-600">
                r/{tweet.subreddit}
              </span>
            )}
            {isTranslated && (
              <span className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold bg-violet-50 text-violet-600">
                <GlobeIcon />{langLabel}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-gray-400">{totalScore}/100</span>
        </div>

        {/* Score bar */}
        <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${totalScore}%`, backgroundColor: s.bar }} />
        </div>

        {/* Score breakdown */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{totalScore}</span>
          <span>=</span><span>AI {ai?.ai_base_score ?? 5}</span>
          <span>+</span><span>Eng {engagementScore}</span>
          <span>+</span><span>Reach {followerScore}</span>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5">
          {tweet.user.avatar_url ? (
            <img src={tweet.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
              {tweet.user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900 truncate">{tweet.user.name}</span>
              {(tweet.user.is_verified || tweet.user.is_blue_verified) && (
                <span style={{ color: "#00BAF2" }} className="text-xs flex-shrink-0">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              @{tweet.user.screen_name}
              {tweet.user.followers != null && tweet.user.followers > 0 && ` · ${fmt(tweet.user.followers)} followers`}
            </p>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
        </div>

        {/* Tweet text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 flex-1">{tweet.full_text}</p>

        {/* Translation */}
        {isTranslated && (
          <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-500 uppercase tracking-wider">
              <GlobeIcon /><span>AI Translation · {langLabel}</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{ai!.translated_text}</p>
          </div>
        )}

        {/* AI reason */}
        {ai?.reason && (
          <p className="text-xs text-gray-400 italic border-l-2 border-gray-100 pl-2 leading-relaxed">{ai.reason}</p>
        )}

        {/* Category + hashtags */}
        <div className="flex flex-wrap gap-1">
          {ai?.category && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
              {ai.category.replace(/_/g, " ")}
            </span>
          )}
          {tweet.hashtags?.slice(0, 3).map((tag, i) => (
            <span key={`${tag}-${i}`} className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">#{tag}</span>
          ))}
        </div>

        {/* Ticket status row */}
        <div className="pt-2 border-t border-gray-100">
          <TicketStatusBadge
            tweetId={tweet.tweet_id}
            resolution={resolution ?? null}
            isEditor={!!isEditor}
            editorName={editorName ?? ""}
            onUpdate={(status, note) => onUpdateResolution?.(tweet.tweet_id, status, note)}
          />
          {resolution?.note && (
            <p className="text-[10px] text-gray-400 italic mt-1 pl-1 line-clamp-1">"{resolution.note}"</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {ai?.sentiment && (
              <span className={`font-medium ${SENT_COLOR[ai.sentiment]}`}>{ai.sentiment}</span>
            )}
            {isReddit ? (
              <>
                <span>{fmt(tweet.likes ?? 0)} upvotes</span>
                <span>{fmt(tweet.replies ?? 0)} comments</span>
              </>
            ) : (
              <>
                <span>{fmt(tweet.views ?? 0)} views</span>
                <span>{tweet.likes} likes</span>
                <span>{tweet.retweets} RT</span>
                <span>{tweet.replies} replies</span>
              </>
            )}
          </div>
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            View →
          </a>
        </div>
      </div>
    </article>
  );
}
