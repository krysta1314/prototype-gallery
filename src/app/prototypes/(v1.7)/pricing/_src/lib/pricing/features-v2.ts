import type { PlanId } from './pricing';

/**
 * Feature matrix shown inside each Plan Card (below the CTA button).
 *
 * Each row declares a feature label and the value rendered per plan column.
 * AccessValue variants drive the UI rendering (check / cross / tag / number).
 *
 * Single source of truth — edit here, every card updates.
 */

export type AccessValue =
  | { kind: 'yes' }
  | { kind: 'no' }
  | { kind: 'value'; label: string }
  | { kind: 'full' };

export interface FeatureRow {
  label: string;
  values: Record<PlanId, AccessValue>;
}

export interface FeatureSection {
  title: string;
  rows: FeatureRow[];
}

const yes: AccessValue = { kind: 'yes' };
const no: AccessValue = { kind: 'no' };
const unlimited: AccessValue = { kind: 'value', label: 'Unlimited' };
const full: AccessValue = { kind: 'full' };

/** Premium model row: gated for Free; full access for Starter / Pro / Ultra. */
const premium = (label: string): FeatureRow => ({
  label,
  values: { free: no, starter: full, pro: full, ultra: full },
});

/** Premium model row with Starter exception (Seedance 2.0 only on Pro and Ultra). */
const premiumProUltraOnly = (label: string): FeatureRow => ({
  label,
  values: { free: no, starter: no, pro: full, ultra: full },
});

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: 'Key Features',
    rows: [
      { label: 'Marketing Agent',                          values: { free: yes, starter: yes, pro: yes, ultra: yes } },
      { label: 'Image Generation',                         values: { free: yes, starter: yes, pro: yes, ultra: yes } },
      { label: 'Video Generation',                         values: { free: no,  starter: yes, pro: yes, ultra: yes } },
      { label: 'Long Video Generation (Early Access)',     values: { free: no,  starter: no,  pro: no,  ultra: yes } },
      { label: 'No Watermark',                             values: { free: no,  starter: yes, pro: yes, ultra: yes } },
      { label: 'Technical Support',                        values: { free: no,  starter: no,  pro: yes, ultra: yes } },
      { label: 'Character Customization (Seedance 2.0)',   values: { free: no,  starter: unlimited, pro: unlimited, ultra: unlimited } },
      { label: 'AI Avatars',                               values: { free: { kind: 'value', label: '10' }, starter: unlimited, pro: unlimited, ultra: unlimited } },
      // v1.3 新增 — 并行生成数 + 处理速度
      { label: 'Parallel Generations',                     values: { free: { kind: 'value', label: '1 at a time' }, starter: { kind: 'value', label: 'Up to 4' }, pro: { kind: 'value', label: 'Up to 8' }, ultra: { kind: 'value', label: 'Up to 12' } } },
      { label: 'Processing Speed',                         values: { free: { kind: 'value', label: 'Standard' }, starter: { kind: 'value', label: 'Fast' }, pro: { kind: 'value', label: 'Fast' }, ultra: { kind: 'value', label: 'Fast' } } },
    ],
  },
  {
    title: 'Image Models',
    rows: [
      { label: 'Seedream 4.5',      values: { free: full, starter: full, pro: full, ultra: full } },
      { label: 'Seedream 5.0 Lite', values: { free: full, starter: full, pro: full, ultra: full } },
      premium('Nano Banana'),
      premium('Nano Banana 2'),
      premium('Nano Banana Pro'),
      premium('GPT Image 2'),
    ],
  },
  {
    title: 'Video Models',
    rows: [
      premium('Veo 3.1'),
      premium('Veo 3.1 Fast'),
      premium('Seedance 1.5 Pro'),
      premiumProUltraOnly('Seedance 2.0'),
      premium('Seedance 2.0 Fast'),
      premium('Kling 3.0'),
    ],
  },
];
