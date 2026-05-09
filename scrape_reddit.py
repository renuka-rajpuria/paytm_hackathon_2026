"""
Scrapes ~100 Paytm-related Reddit posts using the public JSON API (no auth needed).
Saves to reddit_output.json in Tweet-compatible format.
"""

import urllib.request
import urllib.parse
import json
import time
from datetime import datetime, timezone

HEADERS = {
    "User-Agent": "paytm-escalation-monitor/1.0 (hackathon research project)"
}

QUERIES = [
    # Global searches
    ("paytm payment failed",         "https://www.reddit.com/search.json?q=paytm+payment+failed&sort=new&limit=25&t=year"),
    ("paytm UPI problem",            "https://www.reddit.com/search.json?q=paytm+upi&sort=new&limit=25&t=year"),
    ("paytm refund",                 "https://www.reddit.com/search.json?q=paytm+refund&sort=new&limit=25&t=year"),
    ("paytm wallet",                 "https://www.reddit.com/search.json?q=paytm+wallet&sort=new&limit=25&t=year"),
    # r/india
    ("r/india paytm",                "https://www.reddit.com/r/india/search.json?q=paytm&restrict_sr=1&sort=new&limit=25&t=year"),
    # r/IndiaInvestments
    ("r/IndiaInvestments paytm",     "https://www.reddit.com/r/IndiaInvestments/search.json?q=paytm&restrict_sr=1&sort=new&limit=25&t=year"),
    # r/bangalore
    ("r/bangalore paytm",            "https://www.reddit.com/r/bangalore/search.json?q=paytm&restrict_sr=1&sort=new&limit=25&t=year"),
    # r/personalfinanceindia
    ("r/personalfinanceindia paytm", "https://www.reddit.com/r/personalfinanceindia/search.json?q=paytm&restrict_sr=1&sort=new&limit=25&t=year"),
]


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return None


def to_post(child, idx):
    d = child.get("data", {})
    if not d:
        return None

    post_id = d.get("id", f"r_{idx}")
    title   = d.get("title", "").strip()
    body    = d.get("selftext", "").strip()

    # Combine title + body, cap at 1000 chars
    if body and body not in ("[deleted]", "[removed]"):
        full_text = f"{title}\n\n{body}"[:1000]
    else:
        full_text = title

    if not full_text:
        return None

    created_utc = d.get("created_utc", 0)
    created_at  = datetime.fromtimestamp(created_utc, tz=timezone.utc).strftime(
        "%a %b %d %H:%M:%S +0000 %Y"
    )

    score     = max(0, d.get("score", 0))
    n_comments = d.get("num_comments", 0)
    subreddit  = d.get("subreddit", "")
    author     = d.get("author", "[deleted]")
    permalink  = "https://www.reddit.com" + d.get("permalink", "")

    return {
        "tweet_id":    f"reddit_{post_id}",
        "platform":    "reddit",
        "subreddit":   subreddit,
        "post_url":    permalink,
        "full_text":   full_text,
        "created_at":  created_at,
        "lang":        "en",
        "likes":       score,
        "retweets":    0,
        "replies":     n_comments,
        "quotes":      0,
        "bookmarks":   0,
        "views":       score * 12,   # rough upvote-to-impression multiplier
        "is_reply":    False,
        "in_reply_to_tweet_id":    None,
        "in_reply_to_screen_name": None,
        "hashtags":  [],
        "mentions":  [],
        "urls":      [],
        "media_urls": [],
        "source":    f"Reddit r/{subreddit}",
        "user": {
            "user_id":        f"reddit_user_{author}",
            "name":           author,
            "screen_name":    author,
            "location":       "",
            "description":    "",
            "followers":      0,
            "following":      0,
            "tweet_count":    0,
            "is_verified":    False,
            "is_blue_verified": False,
            "avatar_url":     None,
            "created_at":     "",
        },
    }


def main():
    seen_ids = set()
    posts    = []

    for label, url in QUERIES:
        print(f"Fetching: {label}")
        data = fetch(url)
        if not data:
            continue

        children = data.get("data", {}).get("children", [])
        batch_count = 0
        for i, child in enumerate(children):
            post = to_post(child, len(posts) + i)
            if post and post["tweet_id"] not in seen_ids:
                seen_ids.add(post["tweet_id"])
                posts.append(post)
                batch_count += 1

        print(f"  -> {batch_count} new posts (total so far: {len(posts)})")
        time.sleep(1.5)   # be polite to Reddit's API

        if len(posts) >= 120:
            break

    posts = posts[:100]
    out   = {"meta": {"total": len(posts), "source": "reddit"}, "posts": posts}

    with open("reddit_output.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Saved {len(posts)} posts to reddit_output.json")


if __name__ == "__main__":
    main()
