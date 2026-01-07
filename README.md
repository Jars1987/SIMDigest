# SIMD Tracker

<div align="center">
  <img src="./SIMDigest.png" alt="SIMD Tracker Logo" width="120" />

  <p><strong>Track Solana Improvement Documents in Real-Time</strong></p>

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

</div>

---

## Overview

SIMD Tracker is a modern web application that monitors and tracks Solana
Improvement Documents (SIMDs) in real-time. Stay updated on protocol changes,
governance discussions, and implementation progress with live data from the
official Solana repository.

**Live Demo:** [Add your deployed URL here]

---

## Features

### Phase 1 - Live Tracking (Current)

- **Solana-Branded UI** - Beautiful gradient design matching Solana's brand
- **Real-Time Dashboard** - Live-sorted SIMDs by recent activity
- **Advanced Filtering** - Filter by status (Open, Merged, Most Discussed)
- **Activity Tracking** - Sort by latest activity or discussion count
- **Full Proposals** - Complete proposal content with markdown rendering
- **Discussion Sidebar** - Latest GitHub comments and reviews
- **Newsletter Signup** - Email subscription for weekly updates
- **Direct GitHub Links** - Quick access to source proposals and PRs

### Phase 2 - Newsletter (Planned)

- Weekly automated digest emails
- Most active and discussed SIMDs
- New proposals and merged implementations
- AI-generated summaries

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Supabase](https://supabase.com/) (Postgres)
- **API:** GitHub REST API
- **Markdown:** react-markdown with remark-gfm
- **Deployment:** Vercel (recommended)

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier works)
- GitHub account (for API access)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Jars1987/SIMDigest.git
   cd SIMDigest
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   # Database
   DATABASE_URL=your_supabase_postgres_url

   # Supabase Public Keys
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # GitHub Token (optional but recommended)
   GITHUB_TOKEN=your_github_token
   ```

4. **Create database tables**

   ```bash
   npm run setup:db
   ```

5. **Sync data from GitHub**

   ```bash
   npm run sync
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Detailed Setup

For complete setup instructions, see:

- **[SETUP.md](./SETUP.md)** - Full step-by-step guide
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute quick start
- **[CREDENTIALS_NEEDED.md](./CREDENTIALS_NEEDED.md)** - API keys explained

---

## Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database & Sync

```bash
npm run setup:db     # Create database tables
npm run check:db     # Check database status
npm run sync         # Full sync (proposals + PRs)
npm run sync:proposals  # Sync only proposals
npm run sync:prs     # Sync only PRs and messages
```

---

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── app/               # SIMD tracker page
│   ├── simd/[id]/         # SIMD detail pages
│   └── about/             # About page
├── components/            # React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── SIMDCard.tsx
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # Supabase client
│   ├── queries.ts        # Database queries
│   └── mockData.ts       # Mock data for development
├── scripts/               # Sync and utility scripts
│   ├── sync.ts           # Main sync script
│   ├── sync-proposals.ts # Proposal sync
│   └── sync-prs.ts       # PR sync
├── database/              # Database schema
│   └── schema.sql        # Postgres schema
├── types/                 # TypeScript types
└── public/                # Static assets
```

---

## Database Schema

The app uses Supabase (Postgres) with the following tables:

- **`simds`** - SIMD proposals with metadata
- **`simd_prs`** - Pull requests linked to SIMDs
- **`simd_messages`** - Discussion comments and reviews
- **`subscribers`** - Newsletter subscribers
- **`sync_jobs`** - Sync job history and monitoring

See [database/schema.sql](./database/schema.sql) for complete schema.

---

## Data Syncing

### Automatic Updates

The app syncs data from the
[Solana Improvement Documents repository](https://github.com/solana-foundation/solana-improvement-documents).

**What gets synced:**

- Proposal files from `proposals/` directory
- Pull requests and their status
- GitHub discussions and comments
- Activity timestamps

**Recommended sync schedule:**

- **Proposals:** Daily (they don't change often)
- **PRs & Messages:** Every 10-30 minutes (for real-time updates)

### Manual Sync

```bash
# Full sync
npm run sync

# Just proposals
npm run sync:proposals

# Just PRs and messages
npm run sync:prs
```

---

## Customization

### Branding Colors

The app uses Solana's official colors, defined in `tailwind.config.ts`:

```js
colors: {
  solana: {
    purple: "#9945FF",
    green: "#14F195",
    blue: "#00D4FF",
    dark: "#0D0208",
  },
}
```

### Logo

Replace `public/SIMDigest.png` with your own logo (recommended size: 256x256px
or larger).

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GITHUB_TOKEN`
4. Deploy!

### Set Up Cron Jobs

For production, set up scheduled syncs:

**Option 1: Vercel Cron** (requires Pro plan)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync-proposals",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/sync-prs",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Option 2: GitHub Actions** (free) Create `.github/workflows/sync.yml` to run
syncs automatically.

**Option 3: Supabase Edge Functions** Deploy sync scripts as Edge Functions with
built-in cron.

---

## API Rate Limits

### GitHub API

- **Without token:** 60 requests/hour (limited)
- **With token:** 5,000 requests/hour (recommended)

Get a token at: https://github.com/settings/tokens

- Required scope: `public_repo`

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

---

## Acknowledgments

- [Solana Foundation](https://solana.org) - For the SIMD governance process
- [Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents) -
  Source data
- [Supabase](https://supabase.com) - Database and backend infrastructure
- [Vercel](https://vercel.com) - Hosting and deployment

---

## Contact

- **GitHub:** [@Jars1987](https://github.com/Jars1987)
- **X (Twitter):** [@Joserelvassant1](https://x.com/Joserelvassant1)

---

<div align="center">
  <p>Made with 💜 for the Solana ecosystem</p>
  <p>© 2026 SIMD Tracker - Apollo</p>
</div>
