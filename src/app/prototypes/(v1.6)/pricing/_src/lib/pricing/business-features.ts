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
      // Team 原为 Standard —— 但 $19 的 Starter 都是 Fast 队列，公开定价页上无法解释
      row('Processing speed', val('Priority'), val('Priority'), val('Dedicated')),
      {
        ...row('Access to all features & models', yes, yes, yes),
        tooltip: `Includes:\n${featureLines}\n• All image and video models listed below`,
      },
      // Team / Scale 每席固定额度、不汇成池;只有 Enterprise 是池,才谈得上「按人分配」
      row('Credits included', val('8,900 / seat'), val('16,900 / seat'), val('Custom pool')),
      row('Shared credit pool', no, no, yes),
      row('Credit allocation per member', no, no, yes),
      row('Shared workspace & assets', yes, yes, yes),
      row('Early access to advanced AI features', yes, yes, yes),
      row('API access', no, no, yes),
    ],
  },
  {
    title: 'Security & Compliance',
    rows: [
      row('SSO / SAML', no, no, yes),
      // 审计日志下移到 Team —— Claude 与 ChatGPT 都在入门商业档就给,定在 Enterprise 会被比下去。
      // 导出留给 Enterprise:那是采购必问项,也是真正的付费理由。
      row('Audit log', val('In-app'), val('In-app'), val('In-app + export')),
      {
        // v1.5 未定义这条 —— 成员离开后作品无人可编辑是数据丢失事故的常见来源
        ...row('Asset ownership transfer when a member is removed', yes, yes, yes),
        tooltip:
          'When a member is removed, an owner or admin picks a teammate to inherit their projects and assets. Nothing is deleted and nothing is left unowned.',
      },
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
      row('Role and permission management', yes, yes, yes),
      row('Team seat management', yes, yes, yes),
      // 没有池就没有额度可管控 —— Team / Scale 的每席额度是天然上限
      row('Credit usage controls', no, no, yes),
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
