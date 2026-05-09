import fs from "fs";
import path from "path";
import { Tweet } from "@/components/TweetCard";
import { analyzeTweets } from "@/lib/analyzeTweets";
import Dashboard from "@/components/Dashboard";

function loadJSON(filename: string): Tweet[] {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  // tweets_output.json uses "tweets", reddit_output.json uses "posts"
  return Array.isArray(data.tweets) ? data.tweets
       : Array.isArray(data.posts)  ? data.posts
       : [];
}

export default async function Home() {
  const tweets          = loadJSON("tweets_output.json");
  const redditPosts     = loadJSON("reddit_output.json");
  const competitorTweets = loadJSON("competitor_tweets.json");

  // Combine Twitter + Reddit into one Paytm feed; analyse together for efficiency
  const paytmAll = [...tweets, ...redditPosts];

  const [paytmResult, competitorResult] = await Promise.all([
    analyzeTweets(paytmAll),
    analyzeTweets(competitorTweets),
  ]);

  return (
    <Dashboard
      tweets={paytmAll}
      aiRecord={Object.fromEntries(paytmResult.map.entries())}
      competitorTweets={competitorTweets}
      competitorAiRecord={Object.fromEntries(competitorResult.map.entries())}
      aiAvailable={paytmResult.aiAvailable}
      aiError={paytmResult.aiError}
    />
  );
}
