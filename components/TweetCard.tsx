import { TweetAnalysis } from "@/lib/analyzeTweets";

interface MediaUrl {
  type: string;
  url: string;
  display_url: string;
}

interface Mention {
  screen_name: string;
  name: string;
}

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

const SEVERITY_COLORS = {
  critical: { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500", label: "🔴 Critical" },
  high:     { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-400", label: "🟠 High" },
  medium:   { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-400", label: "🟡 Medium" },
  low:      { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-400", label: "🟢 Low" },
};

const SENTIMENT_COLORS = {
  negative: "bg-red-50 text-red-600 border-red-200",
  neutral:  "bg-gray-100 text-gray-600 border-gray-200",
  positive: "bg-green-50 text-green-600 border-green-200",
};

export default function TweetCard({
  tweet,
  analysis,
}: {
  tweet: Tweet;
  analysis: TweetAnalysis;
}) {
  const { user, full_text, created_at, likes, retweets, replies, views, hashtags, media_urls, tweet_id } = tweet;
  const tweetUrl = `https://x.com/${user.screen_name}/status/${tweet_id}`;

  const date = created_at
    ? new Date(created_at).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  const photo = media_urls?.find((m) => m.type === "photo");
  const sev = SEVERITY_COLORS[analysis.severity];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Severity score bar */}
      <div className="h-1.5 bg-gray-100 w-full">
        <div
          className={`h-full ${sev.bar} transition-all`}
          style={{ width: `${analysis.total_severity_score}%` }}
        />
      </div>

      {/* Media image */}
      {photo && (
        <img src={photo.url} alt="tweet media" className="w-full h-36 object-cover" />
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Severity + Sentiment badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${sev.bg} ${sev.text}`}>
            {sev.label}
          </span>
          <span className={`text-xs border rounded-full px-2.5 py-0.5 ${SENTIMENT_COLORS[analysis.sentiment]}`}>
            {analysis.sentiment}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">
            {analysis.category.replace(/_/g, " ")}
          </span>
        </div>

        {/* Severity score breakdown */}
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <span className="font-semibold text-gray-700 text-sm">Score: {analysis.total_severity_score}/100</span>
          <span>·</span>
          <span>AI {analysis.ai_base_score}</span>
          <span>+</span>
          <span>Engagement {analysis.engagement_score}</span>
          <span>+</span>
          <span>Reach {analysis.follower_score}</span>
        </div>

        {/* User row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{user.name}</p>
                {(user.is_verified || user.is_blue_verified) && (
                  <span className="text-sky-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-400">@{user.screen_name}</p>
            </div>
          </div>
          <span className="text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 rounded-full px-2 py-0.5">
            X / Twitter
          </span>
        </div>

        {/* Tweet text */}
        <p className="text-gray-800 text-sm leading-relaxed flex-1">{full_text}</p>

        {/* AI reason */}
        {analysis.reason && (
          <p className="text-xs text-gray-400 italic border-l-2 border-gray-200 pl-2">
            {analysis.reason}
          </p>
        )}

        {/* Hashtags */}
        {hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag, i) => (
              <span key={`${tag}-${i}`} className="text-xs text-sky-500 bg-sky-50 rounded px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats + date */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{date}</span>
            {user.location && <span>📍 {user.location}</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-xs text-gray-500">
              <span>👁 {(views ?? 0).toLocaleString()}</span>
              <span>❤️ {likes}</span>
              <span>🔁 {retweets}</span>
              <span>💬 {replies}</span>
            </div>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-500 hover:underline"
            >
              View →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
