'use client';

import type { ReactNode } from 'react';
import type { AccessValue } from '../../lib/pricing/features-v2';
import type { PlanId } from '../../lib/pricing/pricing';
import { InfoIcon } from '../../components/buzz-ui/InfoIcon';
import { Tag } from '../../components/buzz-ui/Tag';
import { useFeatureSections } from '../../lib/pricing/features-context';
import { usePromo, isUnlocked } from '../../lib/pricing/promo-context';
import { cn } from '../../lib/utils';

interface FeatureMatrixProps {
  planId: PlanId;
}

export function FeatureMatrix({ planId }: FeatureMatrixProps) {
  const sections = useFeatureSections();
  const promo = usePromo();
  // usePromo() 无 Provider 时返回 null → isUnlocked 恒为 false，现有页面行为不变。
  const isRowUnlocked = (label: string) => isUnlocked(promo, label, planId);
  return <MatrixSections sections={sections} column={planId} isRowUnlocked={isRowUnlocked} />;
}

/**
 * 与 Individual / Business 卡片共用的权益渲染：分组标题 + label / value 行。
 * `column` 是泛型（Individual 用 PlanId，Business 用 BusinessPlanId），
 * 所以「限时解锁」判断不能塞进这个通用组件内部——isRowUnlocked 由调用方
 * （已知具体 planId 的 FeatureMatrix）算好后传入，可选，不传则行为不变。
 */
export function MatrixSections<K extends string>({
  sections,
  column,
  isRowUnlocked,
}: {
  sections: {
    title: string;
    rows: { label: string; tooltip?: ReactNode; values: Record<K, AccessValue> }[];
  }[];
  column: K;
  isRowUnlocked?: (label: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map(section => (
        <div key={section.title}>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a0a0a] mb-3">
            {section.title}
          </div>
          <ul className="flex flex-col gap-2">
            {section.rows.map(row => {
              const value = row.values[column];
              const unlocked = value.kind === 'no' && !!isRowUnlocked?.(row.label);
              const disabled = value.kind === 'no' && !unlocked;
              return (
                <li
                  key={row.label}
                  className={`flex items-start gap-2 text-[12px] leading-snug ${disabled ? 'text-neutral-400' : ''}`}
                >
                  <span className={`flex-1 min-w-0 ${disabled ? 'text-neutral-400' : 'text-neutral-800'}`}>
                    {row.label}
                    {row.tooltip && (
                      <>
                        {' '}
                        <InfoIcon label={`What ${row.label} includes`}>
                          {/* 文案里的 \n 直接换行，便于逐条列出 */}
                          <span className="whitespace-pre-line">{row.tooltip}</span>
                        </InfoIcon>
                      </>
                    )}
                  </span>
                  <span className="flex-shrink-0 flex justify-end items-start">
                    {unlocked ? <FestivalUnlockBadge /> : <Value value={value} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** 限时解锁徽章——替代 ✗，标识该行在当前促销下临时可用。 */
export function FestivalUnlockBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#fff3ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e1a] ring-1 ring-[#ffc8b1] whitespace-nowrap">
      Festival unlock
    </span>
  );
}

export function emphasizeDigits(s: string) {
  const parts = s.split(/(\d+)/);
  return (
    <span>
      {parts.map((p, i) =>
        /^\d+$/.test(p)
          ? <span key={i} className="font-bold text-[13px]">{p}</span>
          : p
      )}
    </span>
  );
}

// 定性档位统一走标签：中性 → 提速 → 专属，同一行里三档视觉可比
export const SPEED_TAG_STYLES: Record<string, string> = {
  'Standard':          'bg-sky-100 text-[#0a0a0a]',
  'Fast':              'bg-[#99E22F] text-[#0a0a0a]',
  'Basic':             'bg-neutral-100 text-neutral-700',
  'Detailed':          'bg-sky-100 text-[#0a0a0a]',
  'Priority':          'bg-[#99E22F] text-[#0a0a0a]',
  'Dedicated':         'bg-violet-100 text-violet-800',
  'Enterprise reports': 'bg-violet-100 text-violet-800',
};

export function SpeedBadge({ label }: { label: string }) {
  const style = SPEED_TAG_STYLES[label];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-[2px] rounded text-[10px] font-semibold leading-tight whitespace-nowrap', style)}>
      {label}
    </span>
  );
}

/** 单个权益取值的渲染（✓ / ✗ / 标签），Business 对比表的单元格复用。 */
export function Value({ value }: { value: AccessValue }) {
  switch (value.kind) {
    case 'yes':
      return <span aria-label="included" className="text-emerald-600 font-bold text-[14px] leading-none">✓</span>;
    case 'no':
      return <span aria-label="not included" className="text-neutral-300 font-bold text-[13px] leading-none">✗</span>;
    case 'value': {
      if (SPEED_TAG_STYLES[value.label]) {
        return <SpeedBadge label={value.label} />;
      }
      const isUnlimited = value.label === 'Unlimited';
      // 只在字符串包含字母 + 数字混合时加粗数字（如 "Up to 4"），纯数字（如 "10"）不强调
      const hasMixedDigits = /\d/.test(value.label) && /[A-Za-z]/.test(value.label);
      return (
        <Tag variant={isUnlimited ? 'unlimited' : 'count'}>
          {hasMixedDigits ? emphasizeDigits(value.label) : value.label}
        </Tag>
      );
    }
    case 'full':
      return <Tag variant="unlimited">Unlimited</Tag>;
  }
}
