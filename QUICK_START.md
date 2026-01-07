# Quick Start Guide

Get the SIMD Tracker up and running with real data in under 5 minutes.

## Prerequisites Check

- ✅ Node.js 18+ installed
- ✅ Supabase project created
- ✅ DATABASE_URL in `.env` file

## Steps

### 1. Install Dependencies (1 min)

```bash
npm install
```

### 2. Create Database Tables (1 min)

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/rycfknhxeqgmxxtkulhu/sql
2. Copy entire contents of `database/schema.sql`
3. Paste and run

Verify:
```sql
SELECT COUNT(*) FROM simds;
```
Should return 0 (empty table ready to be filled).

### 3. Get GitHub Token (Optional - 2 min)

**Skip this if you want to test quickly** - you'll get 60 requests/hour without a token.

For production use:
1. Go to https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Name: `SIMD Tracker`
4. Check: `public_repo`
5. Generate and copy token
6. Add to `.env`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

### 4. Sync Data (1-2 min)

```bash
npm run sync
```

Wait for completion. You should see:
- ✅ Proposals synced
- ✅ PRs synced
- ✅ Messages synced

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## What You Should See

- **Landing page** with Solana branding
- **/app** page with list of real SIMDs sorted by activity
- **Individual SIMD pages** with full proposals, discussions, and GitHub links

---

## Next Steps

- Set up automatic syncing (see SETUP.md)
- Connect Supabase to Next.js UI (see SETUP.md Step 6)
- Deploy to Vercel
- Enable email subscriptions

---

## Troubleshooting

**"Database connection failed"**
- Check DATABASE_URL in .env
- Verify Supabase project is active (not paused)

**"Rate limit exceeded"**
- Add GITHUB_TOKEN to .env
- Or wait 1 hour for rate limit reset

**No data showing**
- Make sure sync completed successfully
- Check `SELECT COUNT(*) FROM simds;` returns > 0
- Restart dev server after adding .env variables

---

For detailed setup instructions, see [SETUP.md](./SETUP.md)
