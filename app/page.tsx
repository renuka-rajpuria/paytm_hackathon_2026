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

  const primaryAll = [...tweets, ...redditPosts];

  const [primaryResult, competitorResult] = await Promise.all([
    analyzeTweets(primaryAll),
    analyzeTweets(competitorTweets),
  ]);

  return (
    <Dashboard
      tweets={primaryAll}
      aiRecord={Object.fromEntries(primaryResult.map.entries())}
      competitorTweets={competitorTweets}
      competitorAiRecord={Object.fromEntries(competitorResult.map.entries())}
      aiAvailable={primaryResult.aiAvailable}
      aiError={primaryResult.aiError}
    />
  );
}
