import fs from "fs";
import path from "path";
import { Tweet } from "@/components/TweetCard";
import { analyzeTweets } from "@/lib/analyzeTweets";
import Dashboard from "@/components/Dashboard";

function loadJSON(filename: string): Tweet[] {
  const filePath = path.join(process.cwd(), filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data.tweets) ? data.tweets : [];
}

export default async function Home() {
  const tweets           = loadJSON("tweets_output.json");
  const competitorTweets = loadJSON("competitor_tweets.json");

  const [paytmResult, competitorResult] = await Promise.all([
    analyzeTweets(tweets),
    analyzeTweets(competitorTweets),
  ]);

  return (
    <Dashboard
      tweets={tweets}
      aiRecord={Object.fromEntries(paytmResult.map.entries())}
      competitorTweets={competitorTweets}
      competitorAiRecord={Object.fromEntries(competitorResult.map.entries())}
      aiAvailable={paytmResult.aiAvailable}
      aiError={paytmResult.aiError}
    />
  );
}
