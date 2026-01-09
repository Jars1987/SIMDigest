import { graphql } from '@octokit/graphql';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.warn('⚠️  GITHUB_TOKEN required for GraphQL queries');
}

export const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});

export const REPO_OWNER = 'solana-foundation';
export const REPO_NAME = 'solana-improvement-documents';
