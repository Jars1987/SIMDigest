# SIMD Tracker - Setup Instructions

This guide will walk you through setting up the SIMD Tracker application, creating the database, and populating it with real data from GitHub.

## Prerequisites

- Node.js 18 or higher
- A Supabase account and project (you already have this!)
- A GitHub account (for API access)

---

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- GitHub API client (`@octokit/rest`)
- PostgreSQL client (`postgres`)
- Markdown parser (`gray-matter`)
- TypeScript execution tool (`tsx`)

---

## Step 2: Set Up Database Schema

You need to create the database tables in your Supabase project.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/rycfknhxeqgmxxtkulhu
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of `database/schema.sql`
5. Paste it into the SQL editor
6. Click "Run" (or press Cmd/Ctrl + Enter)

You should see a success message indicating all tables, indexes, and views were created.

### Option B: Using Command Line (Alternative)

If you have `psql` installed:

```bash
psql "$DATABASE_URL" < database/schema.sql
```

### Verify Schema Creation

Run this query in the SQL Editor to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- `simds`
- `simd_prs`
- `simd_messages`
- `subscribers`
- `sync_jobs`

---

## Step 3: Get a GitHub API Token (Optional but Recommended)

A GitHub API token significantly increases your rate limit from 60 to 5,000 requests per hour, which is essential for syncing all SIMDs efficiently.

### Create a Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name: `SIMD Tracker Sync`
4. Select scopes:
   - ✅ `public_repo` (access public repositories)
5. Scroll down and click "Generate token"
6. **IMPORTANT:** Copy the token immediately (you won't be able to see it again!)

### Add Token to .env

Open your `.env` file and add the token:

```bash
DATABASE_URL=postgresql://postgres:SIM-Digest2026@db.rycfknhxeqgmxxtkulhu.supabase.co:5432/postgres

GITHUB_TOKEN=ghp_your_token_here
```

**Note:** If you skip this step, the sync will still work but will be slower and may hit rate limits if you run it frequently.

---

## Step 4: Run the Initial Sync

Now you're ready to populate your database with real SIMD data from GitHub!

### Full Sync (Recommended for First Run)

This syncs both proposals and pull requests:

```bash
npm run sync
```

The script will:
1. ✅ Test database connection
2. 📊 Check GitHub API rate limit
3. 📁 Fetch all proposal files from the `proposals/` directory
4. 📥 Download and parse each proposal's content
5. 💾 Insert/update SIMD records in the database
6. 🔄 Fetch recent pull requests
7. 🔗 Map PRs to SIMDs
8. 💬 Fetch latest discussion messages
9. 📝 Record sync job history

**Expected output:**

```
═══════════════════════════════════════════════════
   SIMD Tracker - Full Database Sync
═══════════════════════════════════════════════════

✅ Database connected successfully

📊 GitHub API Rate Limit:
   Remaining: 4997/5000
   Resets at: ...

━━━ Step 1: Syncing Proposals ━━━

🚀 Starting proposal sync...

📁 Fetching proposal files from GitHub...
   Found 45 proposal files

   📥 Fetching SIMD-0001...
   ✨ Created SIMD-0001: Example Proposal Title
   ...

✅ Proposal sync completed!
   Processed: 45
   Created: 45
   Updated: 0
   Skipped: 0

━━━ Step 2: Syncing Pull Requests ━━━

🚀 Starting PR sync...

📅 Fetching PRs updated since: 2024-10-08T...

   Fetching page 1...
   ✅ Synced PR #123 -> SIMD-0001: ...
   ...

✅ PR sync completed!
   Processed: 120 PRs
   Synced: 45 PRs
   Messages: 225

═══════════════════════════════════════════════════
   ✅ Full Sync Completed Successfully!
   ⏱️  Duration: 45.23s
═══════════════════════════════════════════════════
```

### Individual Sync Commands

You can also run these separately:

```bash
# Sync only proposals
npm run sync:proposals

# Sync only PRs and messages
npm run sync:prs
```

**Note:** Always run `sync:proposals` first if this is your initial sync, as PRs reference SIMD records that need to exist.

---

## Step 5: Verify the Data

Check that data was successfully imported:

### Using Supabase Dashboard

1. Go to "Table Editor" in your Supabase dashboard
2. Select the `simds` table
3. You should see all the SIMD proposals listed

### Using SQL Query

Run this in the SQL Editor:

```sql
-- Count of SIMDs
SELECT COUNT(*) as total_simds FROM simds;

-- Count of PRs
SELECT COUNT(*) as total_prs FROM simd_prs;

-- Count of messages
SELECT COUNT(*) as total_messages FROM simd_messages;

-- Most active SIMDs
SELECT id, title, last_activity_at
FROM simds
ORDER BY last_activity_at DESC
LIMIT 10;
```

---

## Step 6: Connect the UI to Real Data

Now that your database is populated, you need to connect the Next.js app to use real data instead of mock data.

### 6.1 Update .env with Supabase Keys

Add your Supabase public keys to `.env`:

```bash
DATABASE_URL=postgresql://postgres:SIM-Digest2026@db.rycfknhxeqgmxxtkulhu.supabase.co:5432/postgres

GITHUB_TOKEN=ghp_your_token_here

# Supabase (for Next.js client)
NEXT_PUBLIC_SUPABASE_URL=https://rycfknhxeqgmxxtkulhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Get your Supabase keys:**
1. Go to your project settings: https://supabase.com/dashboard/project/rycfknhxeqgmxxtkulhu/settings/api
2. Copy the "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the "anon public" key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6.2 Create Supabase Client

This file should already exist: `lib/supabase.ts`

If not, create it with:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 6.3 Update Pages to Use Real Data

The next step is to replace mock data with real Supabase queries. This is covered in the main README under "Milestone 4 - Real Data".

---

## Step 7: Run the Application

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000 to see your app with real data!

---

## Maintenance & Regular Syncing

### Schedule Regular Syncs

To keep your data up-to-date, you should run syncs regularly:

**Recommended schedule:**
- **Proposals**: Daily (since they don't change often)
- **PRs & Messages**: Every 10-30 minutes (for real-time updates)

### Using Cron Jobs

Add to your crontab (`crontab -e`):

```bash
# Sync proposals daily at 2 AM
0 2 * * * cd /path/to/SIM-Digest && npm run sync:proposals

# Sync PRs every 15 minutes
*/15 * * * * cd /path/to/SIM-Digest && npm run sync:prs
```

### Using Supabase Edge Functions (Production)

For production, you should deploy these sync scripts as Supabase Edge Functions triggered by cron:

1. Convert scripts to Edge Functions
2. Set up cron triggers in Supabase dashboard
3. No server needed - fully serverless!

Documentation: https://supabase.com/docs/guides/functions/schedule-functions

---

## Troubleshooting

### "Database connection failed"

**Issue:** Cannot connect to Supabase database

**Solutions:**
1. Verify `DATABASE_URL` is correct in `.env`
2. Check your Supabase project is not paused (free tier projects pause after inactivity)
3. Verify SSL is enabled: URL should include `?sslmode=require` or use `ssl: 'require'` in config

### "GitHub API rate limit exceeded"

**Issue:** Hit the 60 requests/hour limit without a token

**Solution:**
1. Add a `GITHUB_TOKEN` to `.env` (see Step 3)
2. Wait for rate limit to reset (check with `await checkRateLimit()`)

### "SIMD doesn't exist" errors during PR sync

**Issue:** Trying to sync PRs before proposals are synced

**Solution:**
Run `npm run sync:proposals` first, then `npm run sync:prs`

### No data showing in UI

**Issue:** Database has data but UI shows nothing

**Solutions:**
1. Verify Supabase client is configured correctly
2. Check browser console for errors
3. Verify `.env` variables are prefixed with `NEXT_PUBLIC_` for client-side access
4. Restart the dev server after changing `.env`

---

## Next Steps

After completing this setup:

1. ✅ Database is created and populated
2. ✅ Sync scripts are working
3. 📝 Next: Update UI components to use real data
4. 📧 Next: Implement email subscription API
5. 📰 Next: Build weekly newsletter feature

See the main `README.md` for the full roadmap and next milestones.

---

## API Credentials Summary

You will need:

| Credential | Required? | Where to Get | Rate Limit |
|------------|-----------|--------------|------------|
| `DATABASE_URL` | ✅ Yes | Supabase project settings | N/A |
| `GITHUB_TOKEN` | ⚠️ Recommended | github.com/settings/tokens | 5000/hr with token, 60/hr without |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes (for UI) | Supabase API settings | N/A |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (for UI) | Supabase API settings | N/A |

---

## Questions?

If you run into issues:
1. Check the error messages carefully
2. Verify all environment variables are set
3. Check GitHub API rate limits: https://api.github.com/rate_limit
4. Review sync job history: `SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 10;`

Happy tracking! 🟣
