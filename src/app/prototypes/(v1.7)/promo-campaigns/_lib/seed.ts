import type { Campaign, RedeemCode } from './types';

/* 预置活动清空 —— 后台建什么,客户端就显示什么。
   留预置数据会出现「在后台改了 A,前端显示的却是优先级更高的预置 B」,看着像没保存。 */
export const SEED_CAMPAIGNS: Campaign[] = [];

export const SEED_CODES: RedeemCode[] = [
  {
    id: 'code-welcome',
    code: 'WELCOME30',
    note: 'First-order discount for new users. Always on.',
    percent: 30,
    maxRedemptions: 0,
    redeemed: 1284,
    perUserLimit: 1,
    firstTimeOnly: true,
    expiresAt: '',
    active: true,
  },
  {
    id: 'code-halloween',
    code: 'HALLOWEEN25',
    note: 'Halloween sale.',
    percent: 25,
    maxRedemptions: 500,
    redeemed: 137,
    perUserLimit: 1,
    firstTimeOnly: false,
    expiresAt: '2026-11-02T23:59',
    active: true,
  },
  {
    id: 'code-blackfriday',
    code: 'BLACKFRIDAY50',
    note: 'Black Friday sale. Paused until the campaign goes live.',
    percent: 50,
    maxRedemptions: 2000,
    redeemed: 0,
    perUserLimit: 1,
    firstTimeOnly: false,
    expiresAt: '2026-12-01T23:59',
    active: false,
  },
  {
    id: 'code-spring',
    code: 'SPRING50',
    note: 'Spring sale. Ended.',
    percent: 50,
    maxRedemptions: 500,
    redeemed: 500,
    perUserLimit: 1,
    firstTimeOnly: false,
    expiresAt: '2026-03-31T23:59',
    active: false,
  },
];
