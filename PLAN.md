# 🟣 Solana SIMD Tracker — Detailed Build Plan

A Next.js + GitHub API + Supabase app to **live-track activity on Solana
Improvement Documents (SIMDs)**, with Phase 2 adding an automated weekly
newsletter.

---

## 🎯 Goals

### Phase 1 — Live Tracking Web App

- Landing page with Solana-style branding
- Subscribe to newsletter (email capture)
- "Check recent updates" CTA → App
- App page showing **live-sorted SIMDs by recent activity**
- Hero section showing **most recently proposed SIMD**
- SIMD detail pages with:

  - Proposal text
  - Summary (basic extraction for now)
  - Topics
  - Conclusions
  - Sidebar with latest discussion messages
  - GitHub links

### Phase 2 — Weekly Automated Newsletter

- Weekly digest:

  - Most active SIMDs
  - New SIMDs proposed
  - SIMDs merged / implemented
  - Most discussed

- Auto-generated summaries
- Email delivery

---

## 🔗 Source of Truth

- SIMD proposals (markdown):

  - `solana-foundation/solana-improvement-documents/proposals/*`

- Governance + discussion:

  - GitHub Pull Requests on same repo

Activity includes:

- New commits
- New comments
- Reviews
- Proposal file edits on main branch

---

## ⚙️ High-Level Architecture

```
GitHub → Sync Worker → Supabase (Postgres) → Next.js App
                                ↓
                          Newsletter Sender
```

### Components

1. **Next.js (App Router)**

   - Landing page
   - `/app` live tracker
   - `/simd/[id]` detail pages

2. **Supabase Postgres**

   - Cached SIMD + PR data
   - Search + filtering
   - Subscriber storage

3. **Sync Worker (Edge Function / Serverless)**

   - Scheduled GitHub ingestion

4. **Newsletter Sender (Phase 2)**

   - Weekly cron job
   - Builds digest from DB

---

## 🗃️ Supabase Schema

### Table: `simds`

| Field               | Type        | Notes                     |
| ------------------- | ----------- | ------------------------- |
| id                  | text        | e.g. `0370`               |
| slug                | text        | `simd-0370`               |
| title               | text        | From proposal             |
| proposal_path       | text        | Repo path                 |
| proposal_sha        | text        | Last ingested blob        |
| proposal_updated_at | timestamptz | Commit date               |
| last_pr_activity_at | timestamptz | From PRs                  |
| last_activity_at    | timestamptz | max(PR, file)             |
| status              | text        | draft/active/merged/etc   |
| summary             | text        | Phase 1 basic, Phase 2 AI |
| topics              | jsonb       | Optional                  |
| conclusion          | text        | Optional                  |

---

### Table: `simd_prs`

| Field                | Type        |
| -------------------- | ----------- |
| id                   | uuid        |
| simd_id              | text        |
| pr_number            | int         |
| pr_title             | text        |
| state                | text        |
| updated_at           | timestamptz |
| merged_at            | timestamptz |
| issue_comment_count  | int         |
| review_comment_count | int         |
| review_count         | int         |

---

### Table: `simd_messages` (optional Phase 1, useful Phase 2)

| Field      | Type        |
| ---------- | ----------- |
| id         | uuid        |
| simd_id    | text        |
| pr_number  | int         |
| type       | text        |
| author     | text        |
| created_at | timestamptz |
| body       | text        |
| url        | text        |

---

### Table: `subscribers`

| Field      | Type          |
| ---------- | ------------- |
| email      | text (unique) |
| created_at | timestamptz   |
| verified   | boolean       |

---

## 🔁 GitHub Sync Strategy

### What Counts as Activity

A SIMD is "active" when:

- PR receives:

  - new commit
  - new comment
  - new review

- Proposal file is edited on `main`

### Activity Signal

For each SIMD:

```
last_activity_at = max(
  max(pr.updated_at),
  proposal_updated_at
)
```

Sort app page by `last_activity_at DESC`.

---

## 🧠 SIMD ↔ PR Mapping

Use multiple signals:

1. PR touches `proposals/<file>.md`
2. PR title contains `SIMD-XXXX`
3. Commit paths reference proposal file

Primary signal = file path match.

---

## ⏱️ Sync Jobs

### Job A — Recent PR Activity (Every 10 min)

1. Fetch PRs updated since last run
2. For each PR:

   - get touched files
   - map to SIMD
   - fetch counts
   - upsert into `simd_prs`

3. Update SIMD `last_pr_activity_at`
4. Recompute `last_activity_at`

Optional:

- ingest latest 5 comments into `simd_messages`

---

### Job B — Proposal File Sync (Daily)

1. List `/proposals`
2. For each file:

   - fetch latest commit date
   - if changed:

     - fetch raw markdown
     - parse title + sections
     - update `simds`

---

## 🧭 App Pages

### Landing Page (`/`)

- Solana gradient background
- Navbar: Home | App | About | Subscribe
- Email input + subscribe button
- CTA → `/app`
- Footer:

  - "SIMD Tracker — 2026 — Apollo"
  - GitHub + Twitter icon links

---

### App Page (`/app`)

#### Hero Section

- Most recently proposed SIMD
- Based on PR created date

#### Live SIMD List

Each row:

- SIMD ID
- Title
- Last activity
- Message count
- Details link

Sorting:

- Default: last_activity_at desc

Filters:

- Open PRs
- Merged last 30 days
- Most discussed

---

### SIMD Detail Page (`/simd/[id]`)

Main:

- Title
- Status
- Last activity

Sections:

- Proposal (markdown)
- Summary
- Topics
- Conclusions

Sidebar:

- Latest 5 messages
- Links to GitHub PR + file

---

## 📰 Phase 2 — Newsletter

### Weekly Digest Contents

- Top 5 active SIMDs
- New SIMDs proposed
- SIMDs merged / implemented
- Most discussed

### Delivery

- Weekly cron job
- Build email from DB
- Send via Resend or SendGrid

### Optional Enhancements

- Track weekly deltas
- AI-generated summaries

---

## 🧱 Suggested Tech Stack

Required:

- Next.js (App Router)
- Supabase Postgres
- Supabase Edge Functions

Optional:

- GitHub GraphQL API
- Resend (emails)
- Upstash Redis (cache)
- remark / mdast for markdown parsing

---

## 🛠️ Build Milestones

### Milestone 1 — UI Skeleton

- Landing page
- `/app` mock data
- `/simd/[id]` mock

### Milestone 2 — DB + API

- Supabase schema
- Subscribe endpoint
- List SIMDs endpoint

### Milestone 3 — GitHub Sync

- PR activity sync
- Proposal file sync
- Real data in UI

### Milestone 4 — Detail Page

- Markdown rendering
- Sidebar messages

### Milestone 5 — Newsletter

- Digest queries
- Email templates
- Weekly send job

---

## ✅ Phase 1 Definition of Done

- Solana-branded landing page
- Email subscription works
- Live-updating `/app` page
- Hero showing newest proposal
- Sorted by real activity
- Full SIMD detail pages
- GitHub deep links

---

## 🔮 Future Ideas

- Status inference (draft → accepted → implemented)
- Author statistics
- Proposal timelines
- Alert subscriptions per SIMD
- Discord / Telegram bots
- Governance analytics dashboard
