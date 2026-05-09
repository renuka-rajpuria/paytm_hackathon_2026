# Paytm Escalation Monitor — Hackathon 2026

A real-time dashboard for **customer support teams and executives** to monitor social media escalations, analyze sentiment, and prioritize issues based on severity — all powered by Paytm AI.

---

## Features

### Escalation Intelligence
- AI-powered severity classification — Critical / High / Medium / Low — via Paytm AI API
- Sentiment analysis per tweet (positive / neutral / negative)
- Segment classification across 10 Paytm product lines: UPI, Wallet, Payment Gateway, B2B, B2B Lending, Gold, Flights, Hotels, Insurance, General
- Severity scoring model: AI base (max 60) + engagement (max 25) + follower reach (max 15) = total out of 100

### Dashboard & Views
- Card view and list/table view toggle
- Summary stat cards: total showing, critical count, high count, negative sentiment %
- Severity legend and result count with sort-by-score ordering
- Sticky header and filter bar

### Filtering & Search
- Full-text search across tweet content and usernames
- Multi-select filter dropdowns: Platform, Segment, Severity, Sentiment
- Date filter with presets: Today, Yesterday, Last 7 days, Last 30 days, Custom range
- Save custom filter presets to localStorage, apply or delete saved presets
- Clear all filters in one click
- Active filter count badge

### Competitor Analysis Tab
- Separate tab for Razorpay and PhonePe tweet monitoring
- Brand summary cards: critical count, high count, negative %, average score per brand
- vs-Paytm negative sentiment delta for competitive benchmarking
- All filters and weights apply identically across Paytm and Competitor tabs

### Score Weights Sidebar
- User-adjustable weights for all engagement signals: Retweets, Quotes, Replies, Likes, Views, Follower multiplier
- Scores recalculate live as weights change
- Reset to defaults button

### Export
- CSV export with UTF-8 BOM (Excel-compatible), includes all score components and AI analysis fields

### Platforms
- X / Twitter — live
- Reddit, LinkedIn — coming soon (UI stubs present)

---

## Severity Scoring Model

Each tweet is scored **0–100** across three components:

### 1. AI Base Score (max 60 pts)

| Severity | Score | Trigger |
|----------|-------|---------|
| Critical | 60 | Security breach, money permanently lost, widespread outage |
| High     | 40 | Payment failed, money stuck, UPI blocked, account inaccessible |
| Medium   | 20 | App crash, slow service, support failure, cashback issue |
| Low      | 5  | Minor inconvenience, general feedback, positive mention |

### 2. Engagement Score (max 25 pts)

| Signal   | Default Weight | Rationale |
|----------|---------------|-----------|
| Retweets | × 5 | Directly amplifies reach |
| Quotes   | × 4 | Reshared with commentary |
| Replies  | × 3 | Active complaints / discussion |
| Likes    | × 2 | Passive endorsement |
| Views    | × 0.01 | Raw impressions (low unit weight) |

### 3. Reach / Follower Score (max 15 pts)

Uses log₁₀ scale to prevent large accounts from dominating:

```
follower_score = min(15, floor(log₁₀(followers + 1) × 5))
```

### Final Score
```
Total = AI Base + Engagement + Follower   (capped at 100)
```

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 15 (App Router, React Server Components) |
| Language    | TypeScript |
| Styling     | Tailwind CSS v4 |
| Font        | Geist Mono (via next/font/google) |
| AI / NLP    | Paytm AI API (`openai/gpt-oss-120b`) |
| Data        | Static JSON (tweets_output.json, competitor_tweets.json) |
| Persistence | localStorage (saved filter presets) |
| Hosting     | Vercel |

---

## File Structure

```
paytm_hackathon/
├── app/
│   ├── api/
│   │   └── tweets/
│   │       └── route.ts          # API route for tweet data
│   ├── globals.css               # Global styles (Tailwind, Paytm brand colors)
│   ├── layout.tsx                # Root layout with Geist Mono font
│   └── page.tsx                  # Server component — loads JSON, runs AI, renders Dashboard
├── components/
│   ├── Dashboard.tsx             # Main client component — all UI, filters, state
│   └── TweetCard.tsx             # Tweet card with severity, sentiment, score breakdown
├── lib/
│   └── analyzeTweets.ts          # Paytm AI API integration — batch sentiment/severity/segment
├── public/
│   └── Paytm_Logo.png            # Paytm logo (served as static asset)
├── tweets_output.json            # Paytm tweets dataset (124 tweets)
├── competitor_tweets.json        # Razorpay + PhonePe tweets dataset (10 tweets)
├── add_segment_tweets.py         # Script to generate segment-tagged dummy tweets
├── .env.local                    # PAYTM_AI_API_KEY (gitignored)
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## Environment Variables

```
PAYTM_AI_API_KEY=your_key_here
```

Add to `.env.local` (never commit this file).

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
