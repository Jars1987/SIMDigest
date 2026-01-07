import { SIMD, SIMDMessage } from '@/types';

export const mockSIMDs: SIMD[] = [
  {
    id: '0370',
    slug: 'simd-0370',
    title: 'Partitioned Epoch Rewards Distribution',
    proposal_path: 'proposals/0370-partitioned-epoch-rewards.md',
    proposal_sha: 'abc123def456',
    proposal_updated_at: '2024-12-15T10:30:00Z',
    last_pr_activity_at: '2025-01-05T14:22:00Z',
    last_activity_at: '2025-01-05T14:22:00Z',
    status: 'active',
    summary: 'This proposal introduces a mechanism to distribute epoch rewards in partitions to improve network performance and reduce validator strain.',
    topics: ['rewards', 'performance', 'validators'],
    conclusion: 'Implementation expected in Q1 2025',
    message_count: 23,
  },
  {
    id: '0369',
    slug: 'simd-0369',
    title: 'Enable SIMD-0050 (Epoch Stake Caps)',
    proposal_path: 'proposals/0369-enable-stake-caps.md',
    proposal_sha: 'def789abc012',
    proposal_updated_at: '2024-11-20T08:15:00Z',
    last_pr_activity_at: '2024-12-28T16:45:00Z',
    last_activity_at: '2024-12-28T16:45:00Z',
    status: 'active',
    summary: 'Proposal to enable stake caps to prevent excessive concentration of stake.',
    topics: ['stake', 'decentralization', 'governance'],
    conclusion: null,
    message_count: 45,
  },
  {
    id: '0368',
    slug: 'simd-0368',
    title: 'Cross-Program Invocation Gas Metering',
    proposal_path: 'proposals/0368-cpi-gas-metering.md',
    proposal_sha: 'ghi345jkl678',
    proposal_updated_at: '2024-10-10T12:00:00Z',
    last_pr_activity_at: '2024-12-20T09:30:00Z',
    last_activity_at: '2024-12-20T09:30:00Z',
    status: 'draft',
    summary: 'Introduces accurate gas metering for cross-program invocations to improve cost predictability.',
    topics: ['cpi', 'gas', 'smart-contracts'],
    conclusion: 'Under review by core developers',
    message_count: 12,
  },
  {
    id: '0367',
    slug: 'simd-0367',
    title: 'Transaction Size Limits v2',
    proposal_path: 'proposals/0367-tx-size-limits-v2.md',
    proposal_sha: 'mno901pqr234',
    proposal_updated_at: '2024-09-05T14:20:00Z',
    last_pr_activity_at: '2024-11-15T11:00:00Z',
    last_activity_at: '2024-11-15T11:00:00Z',
    status: 'merged',
    summary: 'Updates transaction size limits to accommodate larger programs and complex transactions.',
    topics: ['transactions', 'limits', 'scalability'],
    conclusion: 'Merged and scheduled for v1.18',
    message_count: 8,
  },
  {
    id: '0366',
    slug: 'simd-0366',
    title: 'Optimistic Confirmation for Priority Fees',
    proposal_path: 'proposals/0366-priority-fees-optimistic.md',
    proposal_sha: 'stu567vwx890',
    proposal_updated_at: '2024-08-12T16:45:00Z',
    last_pr_activity_at: '2024-10-30T13:15:00Z',
    last_activity_at: '2024-10-30T13:15:00Z',
    status: 'active',
    summary: 'Allows optimistic confirmation for transactions with priority fees to reduce latency.',
    topics: ['priority-fees', 'confirmation', 'latency'],
    conclusion: null,
    message_count: 19,
  },
];

export const mockMessages: Record<string, SIMDMessage[]> = {
  '0370': [
    {
      id: '1',
      simd_id: '0370',
      pr_number: 1234,
      type: 'comment',
      author: 'validator_dev',
      created_at: '2025-01-05T14:22:00Z',
      body: 'This looks promising! Have we considered the impact on smaller validators?',
      url: 'https://github.com/solana-foundation/solana-improvement-documents/pull/1234#comment-1',
    },
    {
      id: '2',
      simd_id: '0370',
      pr_number: 1234,
      type: 'review',
      author: 'core_contributor',
      created_at: '2025-01-04T10:15:00Z',
      body: 'Overall looks good. Few minor suggestions on the partition size calculation.',
      url: 'https://github.com/solana-foundation/solana-improvement-documents/pull/1234#review-2',
    },
    {
      id: '3',
      simd_id: '0370',
      pr_number: 1234,
      type: 'comment',
      author: 'performance_team',
      created_at: '2025-01-03T08:30:00Z',
      body: 'We ran benchmarks and saw 15% improvement in epoch transitions.',
      url: 'https://github.com/solana-foundation/solana-improvement-documents/pull/1234#comment-3',
    },
  ],
};

export const mockProposalContent = `# SIMD-0370: Partitioned Epoch Rewards Distribution

## Summary

This proposal introduces a mechanism to distribute epoch rewards in partitions rather than all at once, improving network performance and reducing the computational burden on validators during epoch transitions.

## Motivation

Currently, epoch rewards are distributed to all stake accounts simultaneously at the beginning of each epoch. This causes significant computational strain and can lead to delayed block production. By partitioning the distribution, we can spread the load over multiple blocks.

## Proposed Solution

### Technical Design

Rewards will be calculated upfront but distributed over N blocks where N is determined by:
- Total number of stake accounts
- Target processing time per block
- Network capacity

### Implementation Details

1. Calculate total rewards at epoch boundary
2. Create reward distribution schedule
3. Process K accounts per block over N blocks
4. Track distribution progress in ledger

## Impact

- **Validators**: Reduced CPU spike during epoch transitions
- **Users**: More predictable epoch transition times
- **Network**: Improved stability during epoch boundaries

## Security Considerations

- Rewards must be deterministic across all validators
- Distribution schedule must be verifiable
- No opportunity for MEV or manipulation

## Timeline

- Implementation: Q4 2024
- Testnet: January 2025
- Mainnet: Q1 2025

## References

- Related: SIMD-0123 (Stake Account Optimization)
- Discussion: https://github.com/solana-foundation/solana-improvement-documents/discussions/456
`;
