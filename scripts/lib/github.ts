import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.warn('⚠️  GITHUB_TOKEN not set - using unauthenticated requests (60/hour limit)');
  console.warn('   For higher rate limits (5000/hour), set GITHUB_TOKEN in .env');
}

export const octokit = new Octokit({
  auth: token,
});

export const REPO = {
  owner: 'solana-foundation',
  repo: 'solana-improvement-documents',
};

export async function checkRateLimit() {
  const { data } = await octokit.rateLimit.get();
  const { remaining, limit, reset } = data.rate;
  const resetDate = new Date(reset * 1000);

  console.log(`\n📊 GitHub API Rate Limit:`);
  console.log(`   Remaining: ${remaining}/${limit}`);
  console.log(`   Resets at: ${resetDate.toLocaleString()}`);

  if (remaining < 100) {
    console.warn(`⚠️  Low rate limit! Only ${remaining} requests remaining.`);
  }

  return { remaining, limit, reset: resetDate };
}
