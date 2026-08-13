import type { AccessValue, FeatureSection } from './features-v2';
import type { BusinessPlanId } from './business';

/**
 * Business 卡片的权益矩阵，结构与 Individual 完全一致（分组 + label / value 行）。
 *
 * Image Models / Video Models 两组直接继承 Individual 的 Ultra 列
 * （Business 全部套餐都是 "Everything in Ultra" 之上叠加团队能力）；
 * Key Features 同样继承，但并行数与处理速度在 Business 有自己的口径，
 * 因此从继承部分剔除、放进 Workspace & Collaboration 分组。
 */

export interface BusinessFeatureRow {
  label: string;
  /** 行标签后跟一个 (i)，内容为该行展开说明 */
  tooltip?: string;
  values: Record<BusinessPlanId, AccessValue>;
}

export interface BusinessFeatureSection {
  title: string;
  rows: BusinessFeatureRow[];
}

const yes: AccessValue = { kind: 'yes' };
const no: AccessValue = { kind: 'no' };
const val = (label: string): AccessValue => ({ kind: 'value', label });

const row = (
  label: string,
  team: AccessValue,
  scale: AccessValue,
  enterprise: AccessValue,
): BusinessFeatureRow => ({ label, values: { team, scale, enterprise } });

/** Business 口径覆盖 Individual 的行，继承时按 label 剔除。 */
const OVERRIDDEN_INDIVIDUAL_ROWS = new Set(['Parallel Generations', 'Processing Speed']);

const businessSections = (featureLines: string): BusinessFeatureSection[] => [
  {
    title: 'Workspace & Collaboration',
    rows: [
      row('Members in one shared workspace', val('2 to 9'), val('5 to 30'), val('Unlimited')),
      row('Parallel generations', val('Up to 14'), val('Up to 20'), val('Dedicated (SLA)')),
      row('Processing speed', val('Standard'), val('Priority queue'), val('Dedicated')),
      {
        ...row('Access to all features & models', yes, yes, yes),
        tooltip: `Includes:\n${featureLines}\n• All image and video models listed below`,
      },
      row('Shared credit pool', yes, yes, yes),
      row('Per-member credit quota', yes, yes, yes),
      row('Shared workspace & assets', yes, yes, yes),
      row('Early access to advanced AI features', yes, yes, yes),
      row('API access', no, no, yes),
    ],
  },
  {
    title: 'Analytics & Support',
    rows: [
      row('Analytics (usage monitoring dashboard)', val('Basic'), val('Detailed'), val('Enterprise reports')),
      row('Technical support', val('Basic'), val('Priority'), val('Dedicated')),
      row('Guided onboarding', no, no, yes),
    ],
  },
  {
    title: 'Management',
    rows: [
      row('Team seat management', no, yes, yes),
      row('Credit usage controls', no, yes, yes),
    ],
  },
];

/**
 * 把 Individual 的权益分组转成 Business 三列：模型分组沿用 Ultra 的取值。
 *
 * Key Features 分组在 Business 卡不单独列出——三档都是全量，逐行铺开只是重复；
 * 它的内容收进 "Access to all features & models" 那行的 tooltip 里。
 */
export function toBusinessSections(individual: FeatureSection[]): BusinessFeatureSection[] {
  const keyFeatureLabels = (individual.find(s => s.title === 'Key Features')?.rows ?? [])
    .filter(r => !OVERRIDDEN_INDIVIDUAL_ROWS.has(r.label))
    .map(r => r.label);

  const inherited = individual
    .filter(section => section.title !== 'Key Features')
    .map(section => ({
      title: section.title,
      rows: section.rows
        .filter(r => !OVERRIDDEN_INDIVIDUAL_ROWS.has(r.label))
        .map(r => ({
          label: r.label,
          values: { team: r.values.ultra, scale: r.values.ultra, enterprise: r.values.ultra },
        })),
    }))
    .filter(section => section.rows.length > 0);

  return [
    ...businessSections(keyFeatureLabels.map(l => `• ${l}`).join('\n')),
    ...inherited,
  ];
}
