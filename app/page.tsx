import fs from "fs";
import path from "path";
import { Tweet } from "@/components/TweetCard";
import { analyzeTweets } from "@/lib/analyzeTweets";
import Dashboard from "@/components/Dashboard";

function loadTweets(): Tweet[] {
  const filePath = path.join(process.cwd(), "tweets_output.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data.tweets) ? data.tweets : [];
}

export default async function Home() {
  const tweets = loadTweets();
  const { map, aiAvailable, aiError } = await analyzeTweets(tweets);

  // Convert Map to plain object for client component serialization
  const aiRecord = Object.fromEntries(map.entries());

  return (
    <Dashboard
      tweets={tweets}
      aiRecord={aiRecord}
      aiAvailable={aiAvailable}
      aiError={aiError}
    />
  );
}
