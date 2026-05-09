# Paytm Hackathon 2026

A real-time dashboard for **customer support teams and executives** to monitor social media escalations, analyze sentiment, and prioritize issues based on severity — all in one place.

---

## Build Roadmap (0 → 1)

### Phase 1 — Frontend on Vercel
- [ ] Init Next.js app in `frontend/`, push to GitHub, deploy on Vercel → confirm "Hello World" live
- [ ] Add a basic dashboard page layout (header, sidebar, empty main panel)

### Phase 2 — Supabase Connection
- [ ] Create Supabase project, copy URL + anon key into `.env`
- [ ] Connect Next.js to Supabase, read from a test table → confirm data appears in UI
- [ ] Set up FastAPI in `backend/`, add `/health` endpoint → test locally with `uvicorn`
- [ ] Connect FastAPI to Supabase, write a test row → confirm it appears in Supabase dashboard

### Phase 3 — Scraper Spikes (test each independently)
- [ ] Twitter — fetch 10 tweets for a keyword using Twitter API v2, print to console
- [ ] Reddit — fetch top posts from a subreddit using PRAW, print to console
- [ ] LinkedIn — fetch posts via LinkedIn API or scraper, print to console

### Phase 4 — Data Pipeline
- [ ] Define Supabase schema (`posts` table with platform, content, author, timestamp, url)
- [ ] Run each scraper and insert results into Supabase
- [ ] Add sentiment scoring (VADER) to each post and store the score
- [ ] Add severity ranking logic, expose ranked results via `/escalations` API endpoint
- [ ] Wire up the dashboard to display live ranked escalations from the API

---

## Features

- [ ] Ingest and aggregate social media mentions in real time
- [ ] Sentiment analysis on each post/thread (positive, neutral, negative)
- [ ] Escalation detection — identify posts that signal customer frustration or viral risk
- [ ] Severity scoring and ranking of escalations
- [ ] Unified dashboard view across all connected platforms
- [ ] Filtering and search by platform, keyword, date range, or severity
- [ ] Trend and volume charts over time
- [ ] Alert system for high-severity escalations
- [ ] Executive summary view with key metrics and highlights
- [ ] Export reports (CSV / PDF)

---

## Platforms Supported

- [ ] Twitter / X
- [ ] Reddit
- [ ] LinkedIn

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python (FastAPI)                    |
| Frontend   | Next.js (React)                     |
| Database   | Supabase (PostgreSQL)               |
| Hosting    | Vercel                              |
| NLP / AI   | Python (transformers / VADER)       |
| Auth       | Supabase Auth                       |

---

## File Structure

```
paytm_hackathon_2026/
│
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main dashboard page
├── components/
│   ├── EscalationCard.tsx           # Single escalation item
│   ├── SeverityBadge.tsx            # Color-coded severity label
│   ├── SentimentChart.tsx           # Trend chart
│   └── PlatformFilter.tsx           # Platform toggle buttons
├── lib/
│   ├── supabaseClient.ts            # Supabase browser client
│   └── api.ts                       # Fetch helpers for FastAPI
├── public/                          # Static assets
│
├── backend/                         # Python FastAPI backend
│   ├── main.py                      # App entry point, mounts routers
│   ├── routers/
│   │   ├── escalations.py           # GET /escalations — ranked feed
│   │   └── health.py                # GET /health — status check
│   ├── scrapers/
│   │   ├── twitter.py               # Twitter API v2 scraper
│   │   ├── reddit.py                # Reddit PRAW scraper
│   │   └── linkedin.py              # LinkedIn scraper
│   ├── services/
│   │   ├── sentiment.py             # VADER sentiment scoring
│   │   ├── severity.py              # Severity ranking logic
│   │   └── db.py                    # Supabase client + query helpers
│   ├── models/
│   │   └── schemas.py               # Pydantic request/response models
│   ├── .env                         # SUPABASE_URL, API keys (gitignored)
│   └── requirements.txt
│
├── supabase/
│   └── schema.sql                   # Table definitions and indexes
│
├── .env.local                       # Frontend env vars (gitignored)
├── .env.example                     # Template for required env vars
├── .gitignore
├── vercel.json
└── README.md
```
