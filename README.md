# SIMD Tracker

A Next.js web application for tracking Solana Improvement Documents (SIMDs) in real-time. Monitor proposals, discussions, and activity from the official Solana governance repository.

## Features

### Phase 1 - Live Tracking (Current)

- **Landing Page** - Solana-branded homepage with email subscription
- **Live SIMD Tracker** - Real-time sorted list of all SIMDs by activity
- **Hero Section** - Highlights the most recently proposed SIMD
- **Detailed Views** - Full proposal content with markdown rendering
- **Activity Tracking** - Sort and filter by latest activity, messages, and status
- **Discussion Sidebar** - Latest GitHub discussions and comments
- **Status Indicators** - Visual status badges (draft, active, merged, implemented, rejected)

### Phase 2 - Newsletter (Planned)

- Weekly automated digest
- Most active and discussed SIMDs
- New proposals and merged implementations
- AI-generated summaries

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Solana theme
- **Markdown**: react-markdown with remark-gfm
- **Database**: Supabase Postgres (to be integrated)
- **API**: GitHub REST/GraphQL API (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- GitHub account (for API access - optional but recommended)

### Quick Start

```bash
# Install dependencies
npm install

# Run development server (with mock data)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Full Setup with Real Data

For complete instructions on setting up the database and syncing real SIMD data from GitHub, see:

**📘 [SETUP.md](./SETUP.md)** - Complete setup guide with step-by-step instructions

### Available Scripts

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Data Sync:**
- `npm run sync` - Full sync (proposals + PRs + messages)
- `npm run sync:proposals` - Sync only SIMD proposals
- `npm run sync:prs` - Sync only PRs and messages

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with navbar & footer
│   ├── page.tsx            # Landing page
│   ├── app/
│   │   └── page.tsx        # SIMD tracker page
│   ├── simd/
│   │   └── [id]/
│   │       └── page.tsx    # SIMD detail page
│   └── about/
│       └── page.tsx        # About page
├── components/
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Footer component
│   └── SIMDCard.tsx        # SIMD list item card
├── lib/
│   └── mockData.ts         # Mock SIMD data (temporary)
├── types/
│   └── index.ts            # TypeScript interfaces
└── tailwind.config.ts      # Tailwind with Solana theme
```

## Current Status

### Completed (Milestone 1 - UI Skeleton)

- Next.js project setup with TypeScript
- Tailwind CSS with Solana branding (purple, green, blue gradients)
- Landing page with email subscription form
- Live SIMD tracker page with filtering and sorting
- Hero section showing newest proposal
- SIMD detail pages with markdown rendering
- Mock data for development
- About page

### Next Steps

**Milestone 2 - Database & API**
- Set up Supabase project
- Create database schema (simds, simd_prs, simd_messages, subscribers)
- Implement subscription API endpoint
- Create database query functions

**Milestone 3 - GitHub Integration**
- Build GitHub sync worker for PR activity
- Build proposal file sync worker
- Implement activity tracking logic
- Schedule sync jobs (10min for PRs, daily for proposals)

**Milestone 4 - Real Data**
- Connect UI to Supabase
- Replace mock data with live queries
- Implement search functionality
- Add pagination

**Milestone 5 - Newsletter (Phase 2)**
- Weekly digest query builder
- Email templates
- Resend/SendGrid integration
- Cron job setup

## Data Source

All SIMD data comes from the official [Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents) repository on GitHub.

## Color Palette

The app uses Solana's official branding colors:

- **Purple**: `#9945FF` - Primary brand color
- **Green**: `#14F195` - Success and activity indicators
- **Blue**: `#00D4FF` - Links and accents
- **Dark**: `#0D0208` - Background

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Contact

- GitHub: [solana-foundation/solana-improvement-documents](https://github.com/solana-foundation/solana-improvement-documents)
- Twitter: [@solana](https://twitter.com/solana)
