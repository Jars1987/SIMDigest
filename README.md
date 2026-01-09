# SIMD Digest

<div align="center">
  <img src="./SIMDigest.png" alt="SIMD Digest Logo" width="120" />

  <p><strong>Track Solana Improvement Documents in Real-Time</strong></p>
  <p>Stay updated on protocol changes with AI-powered summaries and weekly newsletters</p>

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5--mini-412991)](https://openai.com/)

</div>

---

## 🌟 Overview

**SIMD Digest** is a modern web application that monitors and tracks [Solana Improvement Documents (SIMDs)](https://github.com/solana-foundation/solana-improvement-documents) in real-time. The platform provides:

- **Real-time SIMD tracking** from GitHub
- **AI-generated discussion summaries** using GPT-5-mini
- **Newsletter system** for community updates
- **Automated data syncing** via cron jobs
- **Beautiful Solana-branded UI** with gradient design

**Perfect for:** Solana developers, validators, community members, and anyone interested in following protocol governance and improvements.

---

## ✨ Features

### 🔍 Real-Time SIMD Tracking
- **Live Dashboard** - Three-feed view: Current Proposals, Merged SIMDs, and Active Discussions
- **Advanced Filtering** - Sort by latest activity, discussion count, or proposal status
- **Full Proposal View** - Complete SIMD content with markdown rendering
- **GitHub Integration** - Direct links to source proposals and pull requests
- **Activity Tracking** - Monitor comment activity and PR reviews in real-time

### 🤖 AI-Powered Summaries
- **Automated Summaries** - GPT-5-mini generates concise summaries of PR discussions
- **Incremental Updates** - Cost-efficient incremental summary generation (only new messages)
- **Key Insights** - Focus on technical decisions, concerns, and consensus points
- **Prompt Injection Protection** - Sanitized inputs with output validation

### 📧 Newsletter System
- **Admin Dashboard** - Secure, JWT-authenticated newsletter management
- **Email/Password Authentication** - Multi-admin support with bcrypt password hashing
- **Draft & Send** - Create, edit, and send newsletters to subscribers via SendGrid
- **7-Day Digest Download** - Generate markdown reports of weekly SIMD activity
- **Subscriber Management** - Track subscriber count and engagement
- **Rate Limiting** - Protection against brute-force attacks (5 attempts/15 min)
- **Email Deliverability** - SendGrid integration with unsubscribe links

### ⚙️ Automated Background Jobs
- **Proposal Sync** - Every 6 hours (SIMDs change infrequently)
- **PR Sync** - Every 2 hours (active discussions)
- **Discussion Sync** - Every 6 hours (GitHub discussions)
- **Summary Generation** - Daily at 2 AM UTC (AI summary updates)

### 🔐 Security Features
- **JWT Authentication** - 24-hour token expiration
- **Bcrypt Password Hashing** - 12 salt rounds for admin passwords
- **Rate Limiting** - Login attempt throttling
- **Server-side Email Validation** - RFC 5322 compliant
- **GDPR Compliance** - No PII in logs
- **Prompt Injection Protection** - Sanitized AI inputs with output validation
- **CRON_SECRET** - Secured automated jobs

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **npm** or yarn
- **Supabase** account (free tier works)
- **GitHub** token (for API access)
- **OpenAI** API key (for AI summaries)

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

   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```bash
   # Database
   DATABASE_URL=postgresql://username:password@host:5432/database

   # GitHub API (get token at: https://github.com/settings/tokens)
   GITHUB_TOKEN=ghp_your_github_token

   # Supabase (from your Supabase project settings)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI API (from https://platform.openai.com/api-keys)
   OPENAI_API_KEY=sk-proj-your_openai_api_key
   OPENAI_PROJECT_ID=proj_your_project_id

   # Admin Authentication (generate: openssl rand -base64 48)
   ADMIN_SECRET=your_secure_random_password

   # Cron Job Security (generate: openssl rand -base64 48)
   CRON_SECRET=your_cron_secret_token

   # SendGrid Email Service (get API key at: https://app.sendgrid.com/settings/api_keys)
   SENDGRID_API_KEY=SG.your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=SIMD Digest
   ```

4. **Create database tables**
   ```bash
   npm run setup:db
   ```

5. **Setup admin account**
   ```bash
   npm run admin:setup    # Create admin table
   npm run admin:add -- your-email@example.com
   ```

6. **Sync initial data**
   ```bash
   npm run sync:proposals  # Sync SIMD proposals
   npm run sync:prs        # Sync PRs and discussions
   npm run generate:summaries  # Generate AI summaries
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   ```
   http://localhost:3001
   ```

---

## 📖 Documentation

Complete guides available in the `/docs` folder:

| Guide | Purpose |
|-------|---------|
| **[GETTING_STARTED.md](./docs/GETTING_STARTED.md)** | Quick setup checklist and overview |
| **[ADMIN_SETUP_GUIDE.md](./docs/ADMIN_SETUP_GUIDE.md)** | Add admin users and manage accounts |
| **[NEWSLETTER_WORKFLOW_GUIDE.md](./docs/NEWSLETTER_WORKFLOW_GUIDE.md)** | Create and send newsletters |
| **[VERCEL_DEPLOYMENT_GUIDE.md](./docs/VERCEL_DEPLOYMENT_GUIDE.md)** | Deploy to production with Vercel |
| **[SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md)** | Security review and fixes |
| **[CRON_JOBS.md](./docs/CRON_JOBS.md)** | Background job documentation |

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework (App Router)
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[react-markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[remark-gfm](https://github.com/remarkjs/remark-gfm)** - GitHub Flavored Markdown

### Backend
- **[Supabase](https://supabase.com/)** - PostgreSQL database
- **[GitHub REST API](https://docs.github.com/en/rest)** - SIMD data source
- **[GitHub GraphQL API](https://docs.github.com/en/graphql)** - Discussion data
- **[OpenAI API](https://platform.openai.com/)** - GPT-5-mini for summaries
- **[SendGrid](https://sendgrid.com/)** - Transactional email delivery

### Security & Auth
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** - JWT authentication
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing

### Deployment
- **[Vercel](https://vercel.com/)** - Hosting and serverless functions
- **Vercel Cron Jobs** - Automated background tasks

---

## 📜 Available Scripts

### Development
```bash
npm run dev          # Start development server (localhost:3001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database & Sync
```bash
npm run setup:db            # Create database tables
npm run check:db            # Check database status
npm run sync:proposals      # Sync SIMD proposals
npm run sync:prs            # Sync PRs and messages
npm run sync:discussions    # Sync GitHub discussions
npm run generate:summaries  # Generate AI summaries
```

### Admin Management
```bash
npm run admin:setup    # Create admin table
npm run admin:add      # Add new admin user
npm run admin:list     # List all admin users
```

---

## 🏗️ Project Structure

```
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Landing page
│   ├── app/                     # SIMD tracker dashboard
│   ├── simd/[id]/               # Individual SIMD pages
│   ├── verify/                  # Email verification page
│   ├── admin/newsletter/        # Admin dashboard
│   └── api/                     # API routes
│       ├── subscribe/           # Newsletter subscription
│       ├── verify/              # Email verification
│       ├── admin/               # Admin authentication & management
│       └── cron/                # Automated job endpoints
├── components/                   # React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── SIMDCard.tsx
│   ├── PRDiscussionSummary.tsx
│   └── DiscussionPanel.tsx
├── lib/                         # Utilities and helpers
│   ├── supabase.ts             # Supabase client
│   ├── queries.ts              # Database queries
│   ├── github.ts               # GitHub API client
│   ├── openai.ts               # OpenAI integration
│   ├── email.ts                # SendGrid email service
│   ├── auth.ts                 # JWT authentication
│   └── rate-limiter.ts         # Rate limiting
├── scripts/                     # Data sync and utility scripts
│   ├── sync-proposals.ts       # SIMD proposal sync
│   ├── sync-prs.ts             # PR and message sync
│   ├── sync-discussions.ts     # GitHub discussions sync
│   ├── generate-pr-summaries.ts # AI summary generation
│   ├── create-admins-table.ts  # Admin setup
│   └── add-admin.ts            # Add admin users
├── database/                    # Database schema
│   └── schema.sql              # PostgreSQL schema
├── docs/                        # Complete documentation
└── types/                       # TypeScript type definitions
```

---

## 🗄️ Database Schema

PostgreSQL database with the following tables:

- **`simds`** - SIMD proposals with metadata
- **`simd_prs`** - Pull requests linked to SIMDs
- **`simd_messages`** - Discussion comments and reviews
- **`simd_pr_summaries`** - AI-generated summaries
- **`subscribers`** - Newsletter subscribers
- **`newsletters`** - Newsletter drafts and sent emails
- **`admins`** - Admin users with hashed passwords
- **`sync_jobs`** - Sync job history and monitoring

See [database/schema.sql](./database/schema.sql) for the complete schema.

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: ready for deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (see `.env.example`)

3. **Configure Cron Jobs**
   - Cron jobs are automatically configured via `vercel.json`
   - Jobs run automatically after deployment

4. **Setup Email Service**
   - Create [SendGrid](https://sendgrid.com) account (free tier: 100 emails/day)
   - Generate API key at https://app.sendgrid.com/settings/api_keys
   - Verify your sender email/domain in SendGrid
   - Add SendGrid credentials to environment variables:
     ```bash
     SENDGRID_API_KEY=SG.your_api_key
     SENDGRID_FROM_EMAIL=noreply@yourdomain.com
     SENDGRID_FROM_NAME=SIMD Digest
     ```

**See [VERCEL_DEPLOYMENT_GUIDE.md](./docs/VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.**

---

## 🔐 Security

This project implements industry-standard security practices:

- ✅ **JWT Authentication** with 24-hour expiration
- ✅ **Bcrypt Password Hashing** (12 salt rounds)
- ✅ **Rate Limiting** on authentication endpoints
- ✅ **Server-side Input Validation**
- ✅ **GDPR Compliance** (no PII in logs)
- ✅ **Prompt Injection Protection** for AI summaries
- ✅ **Cron Job Authorization** with secret tokens
- ✅ **Environment Variable Protection** (.env in .gitignore)

See [SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) for the complete security review.

---

## 💰 Support This Project

**SIMD Digest is free and open source**, but running it requires ongoing costs:

### Operational Costs
- **OpenAI API** - GPT-5-mini for AI-powered discussion summaries (~$10-30/month depending on activity)
- **Vercel Hosting** - Serverless functions and cron jobs (Free tier available, Pro recommended for cron: $20/month)
- **Supabase Database** - PostgreSQL hosting (Free tier available)
- **Domain & Infrastructure** - Custom domain and maintenance

### Support Development

If you find SIMD Digest useful, consider supporting its development and maintenance:

**Solana Donations:**
```
NbtprKrcGxbHBEK8dCQTnSdYEd2cxQaEEkrLmMbMvpF
```

Your donations help:
- 💸 Cover OpenAI API costs for AI summaries
- 🖥️ Maintain server infrastructure and hosting
- 🚀 Add new features and improvements
- 📧 Keep the newsletter service running
- 🔧 Ongoing maintenance and updates

**Every contribution helps keep SIMD Digest running for the entire Solana community!** 🙏

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute
- 🐛 **Report bugs** - Open an issue with details
- 💡 **Suggest features** - Share your ideas in discussions
- 📝 **Improve documentation** - Help others get started
- 🔧 **Submit pull requests** - Fix bugs or add features
- ⭐ **Star the repo** - Show your support!

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint for code quality
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately

**Attribution appreciated but not required.**

---

## 🙏 Acknowledgments

### Data Sources & Infrastructure
- **[Solana Foundation](https://solana.org)** - For the SIMD governance process
- **[Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents)** - Source data repository
- **[Supabase](https://supabase.com)** - Database and backend infrastructure
- **[Vercel](https://vercel.com)** - Hosting and deployment platform
- **[OpenAI](https://openai.com)** - GPT-5-mini for AI summaries

### Community
- **Solana Developer Community** - For feedback and support
- **All Contributors** - Thank you for your contributions!

---

## 🤖 Built with AI

This project was **built primarily with AI assistance** using advanced language models and AI-powered development tools. The combination of human creativity and AI capabilities enabled rapid development of a production-ready application with:

- Modern full-stack architecture
- Industry-standard security practices
- Comprehensive documentation
- Automated testing and deployment

**AI tools used:**
- Code generation and refactoring
- Security audit and vulnerability analysis
- Documentation creation
- Architecture design and optimization

This demonstrates the power of human-AI collaboration in modern software development! 🚀

---

## 📞 Contact & Links

- **GitHub:** [@Jars1987](https://github.com/Jars1987)
- **X (Twitter):** [@Joserelvassant1](https://x.com/Joserelvassant1)
- **Issues:** [GitHub Issues](https://github.com/Jars1987/SIMDigest/issues)

---

<div align="center">
  <p>Made with 💜 for the Solana ecosystem</p>
  <p><strong>Tracking SIMDs • Empowering the Community • Built with AI</strong></p>

  <br>

  **If SIMD Digest helps you stay informed, consider supporting the project!**

  SOL: `NbtprKrcGxbHBEK8dCQTnSdYEd2cxQaEEkrLmMbMvpF`

  <br>

  <p>© 2026 SIMD Digest</p>
</div>
