import { TweetAnalysis } from "@/lib/analyzeTweets";

interface MediaUrl { type: string; url: string }
interface Mention  { screen_name: string; name: string }
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
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  hashtags: string[];
  mentions: Mention[];
  media_urls: MediaUrl[];
  user: TweetUser;
}

const SEV = {
  critical: { border: "border-l-red-500",    dot: "bg-red-500",     label: "Critical",  text: "text-red-600",    badge: "bg-red-50 text-red-600" },
  high:     { border: "border-l-orange-400", dot: "bg-orange-400",  label: "High",      text: "text-orange-600", badge: "bg-orange-50 text-orange-600" },
  medium:   { border: "border-l-amber-400",  dot: "bg-amber-400",   label: "Medium",    text: "text-amber-600",  badge: "bg-amber-50 text-amber-600" },
  low:      { border: "border-l-emerald-400",dot: "bg-emerald-400", label: "Low",       text: "text-emerald-600",badge: "bg-emerald-50 text-emerald-600" },
};

const SENT_COLOR = {
  negative: "text-red-500",
  neutral:  "text-gray-400",
  positive: "text-emerald-500",
};

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TweetCard({ tweet, analysis }: { tweet: Tweet; analysis: TweetAnalysis }) {
  const { user, full_text, created_at, likes, retweets, replies, views, hashtags, media_urls, tweet_id } = tweet;
  const s = SEV[analysis.severity];
  const tweetUrl = `https://x.com/${user.screen_name}/status/${tweet_id}`;

  const date = created_at
    ? new Date(created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  const photo = media_urls?.find((m) => m.type === "photo");

  return (
    <article className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.border} flex flex-col overflow-hidden hover:shadow-md transition-shadow`}>
      {photo && <img src={photo.url} alt="" className="w-full h-32 object-cover" />}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Severity row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">{analysis.category.replace(/_/g, " ")}</span>
          </div>
          <span className="text-xs font-mono font-medium text-gray-500">{analysis.total_severity_score}/100</span>
        </div>

        {/* Score bar */}
        <div className="h-0.5 bg-gray-100 rounded-full">
          <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${analysis.total_severity_score}%` }} />
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
              {(user.is_verified || user.is_blue_verified) && (
                <span className="text-sky-500 text-xs flex-shrink-0">✓</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>@{user.screen_name}</span>
              {user.followers != null && (
                <>
                  <span>·</span>
                  <span>{fmt(user.followers)} followers</span>
                </>
              )}
            </div>
          </div>
          <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{date}</span>
        </div>

        {/* Tweet text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{full_text}</p>

        {/* AI reason */}
        {analysis.reason && (
          <p className="text-xs text-gray-400 italic border-l-2 border-gray-100 pl-2 leading-relaxed">
            {analysis.reason}
          </p>
        )}

        {/* Hashtags */}
        {hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag, i) => (
              <span key={`${tag}-${i}`} className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`font-medium ${SENT_COLOR[analysis.sentiment]}`}>{analysis.sentiment}</span>
            <span>{fmt(views ?? 0)} views</span>
            <span>{likes} likes</span>
            <span>{retweets} RT</span>
            <span>{replies} replies</span>
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
