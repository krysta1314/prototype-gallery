'use client';

import { Children, cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import type { ArtKey, Campaign, CampaignRule, CampaignType, PlanId, PopupHighlight } from '../_lib/types';
import { useCodes } from '../_lib/store';
import { CampaignArt, ART_OPTIONS } from './CampaignArt';
import { PreviewPanel } from './PreviewPanel';

const PLAN_OPTIONS: { id: PlanId; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro' },
  { id: 'ultra', label: 'Ultra' },
];

const TYPE_OPTIONS: { id: CampaignType; label: string; desc: string }[] = [
  { id: 'bonus_credits', label: 'Bonus credits', desc: 'Reward paid plans with extra credits.' },
  { id: 'discount', label: 'Discount', desc: 'Percentage off the plan price.' },
  { id: 'unlock', label: 'Feature unlock', desc: 'Temporarily unlock a model for certain plans.' },
  { id: 'promo_code', label: 'Promo code', desc: 'Redeemable code with a usage quota.' },
];

const BILLING_OPTIONS: { id: 'monthly' | 'yearly' | 'both'; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'both', label: 'Both' },
];

function defaultRule(type: CampaignType): CampaignRule {
  switch (type) {
    case 'bonus_credits':
      return { kind: 'bonus_credits', percent: 20, plans: ['starter', 'pro', 'ultra'], includeTopup: true };
    case 'discount':
      return { kind: 'discount', percent: 20, plans: ['starter', 'pro', 'ultra'], billing: 'both' };
    case 'unlock':
      return { kind: 'unlock', models: [], forPlans: ['free', 'starter'] };
    case 'promo_code':
      return { kind: 'promo_code', code: '', percent: 20, totalQuota: 100, perUserLimit: 1 };
  }
}

function blankCampaign(): Campaign {
  return {
    id: 'cmp-new',
    name: '',
    published: false,
    startAt: '',
    endAt: '',
    type: 'bonus_credits',
    rule: defaultRule('bonus_credits'),
    popup: {
      enabled: true,
      badgeLeft: 'LIMITED TIME',
      badgeRight: 'SPECIAL OFFER',
      headlineNumber: '20%',
      headlineText: 'Special offer',
      highlights: [],
      ctaText: 'Claim now',
      ctaHref: '/prototypes/promo-campaigns/pricing',
    },
    pricingBanner: { enabled: true, text: '', showCountdown: true },
    frequency: { maxPerUser: 1, intervalDays: 7 },
  };
}

function togglePlan(plans: PlanId[], id: PlanId): PlanId[] {
  return plans.includes(id) ? plans.filter(p => p !== id) : [...plans, id];
}

function summarizeRule(rule: CampaignRule): string {
  switch (rule.kind) {
    case 'bonus_credits':
      return `+${rule.percent}% credits · ${rule.plans.join(', ') || 'no plans selected'}${rule.includeTopup ? ' (incl. top-ups)' : ''}`;
    case 'discount':
      return `${rule.percent}% OFF · ${rule.billing} · ${rule.plans.join(', ') || 'no plans selected'}`;
    case 'unlock':
      return `${rule.models.join(', ') || 'no models'} → ${rule.forPlans.join(', ') || 'no plans selected'}`;
    case 'promo_code':
      return `${rule.code || '(no code)'} · ${rule.percent}% OFF · ${rule.totalQuota} uses, ${rule.perUserLimit}/user`;
  }
}

// 每一步的校验只在这里定义一次：Field 的行内错误文案与 Next 按钮的禁用条件都从同一个
// 按字段归位的错误对象里取值，避免两处各写一份、改一处漏改另一处。
type BasicsErrors = { name?: string; startAt?: string; endAt?: string };
type OfferErrors = {
  percent?: string;
  plans?: string;
  models?: string;
  forPlans?: string;
  code?: string;
  totalQuota?: string;
  perUserLimit?: string;
};
type PlacementErrors = { highlights?: string; headlineText?: string; ctaText?: string };

function hasError(errs: Record<string, string | undefined>): boolean {
  return Object.values(errs).some(Boolean);
}

function basicsErrors(d: Campaign): BasicsErrors {
  const errs: BasicsErrors = {};
  if (!d.name.trim()) errs.name = 'Campaign name is required.';
  if (!d.startAt) errs.startAt = 'Start date is required.';
  if (!d.endAt) errs.endAt = 'End date is required.';
  if (d.startAt && d.endAt && new Date(d.endAt).getTime() <= new Date(d.startAt).getTime()) {
    errs.endAt = 'End date must be after start date.';
  }
  return errs;
}

function offerErrors(rule: CampaignRule): OfferErrors {
  const errs: OfferErrors = {};
  switch (rule.kind) {
    case 'bonus_credits':
    case 'discount':
      if (rule.percent < 1 || rule.percent > 100) errs.percent = 'Percent must be between 1 and 100.';
      if (rule.plans.length === 0) errs.plans = 'Select at least one plan.';
      break;
    case 'unlock':
      if (rule.models.length === 0) errs.models = 'List at least one model.';
      if (rule.forPlans.length === 0) errs.forPlans = 'Select at least one plan.';
      break;
    case 'promo_code':
      if (!rule.code.trim()) errs.code = 'Promo code is required.';
      if (rule.percent < 1 || rule.percent > 100) errs.percent = 'Percent must be between 1 and 100.';
      if (rule.totalQuota < 1) errs.totalQuota = 'Total quota must be at least 1.';
      if (rule.perUserLimit < 1) errs.perUserLimit = 'Per-user limit must be at least 1.';
      break;
  }
  return errs;
}

function placementErrors(d: Campaign): PlacementErrors {
  const errs: PlacementErrors = {};
  if (d.popup.highlights.length > 2) errs.highlights = 'Only up to 2 highlights are supported.';
  if (d.popup.enabled) {
    if (!d.popup.headlineText.trim()) errs.headlineText = 'Headline text is required.';
    if (!d.popup.ctaText.trim()) errs.ctaText = 'CTA text is required.';
  }
  return errs;
}

function fmtDate(s: string): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CampaignEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial: Campaign | 'new';
  onCancel: () => void;
  onSave: (c: Campaign) => void;
}) {
  const [draft, setDraft] = useState<Campaign>(() => (initial === 'new' ? blankCampaign() : initial));
  const { codes } = useCodes();
  const isNew = initial === 'new';
  const titleId = useId();

  const basicsErrs = basicsErrors(draft);
  const offerErrs = offerErrors(draft.rule);
  const placementErrs = placementErrors(draft);

  const missingCode = draft.rule.kind === 'promo_code' && !draft.codeId;
  const blocking = hasError(basicsErrs) || hasError(offerErrs) || hasError(placementErrs) || missingCode;

  const finalize = (published: boolean) => {
    const id = isNew ? `cmp-${Date.now()}` : draft.id;
    onSave({ ...draft, id, published });
  };

  const setRule = (rule: CampaignRule) => setDraft(d => ({ ...d, rule }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
          >
            <ArrowLeft className="size-4" /> All campaigns
          </button>
          <h1 id={titleId} className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">
            {isNew ? 'New campaign' : draft.name || 'Untitled campaign'}
          </h1>
          <p className="mt-1 text-sm text-[#6a6b7b]">
            {isNew
              ? 'Fill in the four sections below, then publish.'
              : 'Every change is saved to this campaign only when you hit save.'}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-5">
            <Section step={1} title="Basics" hint="Name, schedule and popup frequency">
              <div className="space-y-5">
                <Field label="Campaign name" error={basicsErrs.name}>
                  <input
                    value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Summer Boost"
                    className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Start date" error={basicsErrs.startAt}>
                    <input
                      type="date"
                      value={draft.startAt.slice(0, 10)}
                      onChange={e => setDraft(d => ({ ...d, startAt: e.target.value ? `${e.target.value}T00:00` : '' }))}
                      className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                    />
                  </Field>
                  <Field label="End date" error={basicsErrs.endAt}>
                    <input
                      type="date"
                      value={draft.endAt.slice(0, 10)}
                      onChange={e => setDraft(d => ({ ...d, endAt: e.target.value ? `${e.target.value}T23:59` : '' }))}
                      className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Max per user">
                    <input
                      type="number"
                      min={1}
                      value={draft.frequency.maxPerUser}
                      onChange={e => setDraft(d => ({ ...d, frequency: { ...d.frequency, maxPerUser: Number(e.target.value) } }))}
                      className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                    />
                  </Field>
                  <Field label="Repeat interval (days)">
                    <input
                      type="number"
                      min={0}
                      value={draft.frequency.intervalDays}
                      onChange={e => setDraft(d => ({ ...d, frequency: { ...d.frequency, intervalDays: Number(e.target.value) } }))}
                      className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            <Section step={2} title="Offer" hint="What the user actually gets">{(() => {
              const rule = draft.rule;
              return (
              <div className="space-y-5">
                <Field label="Campaign type">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={draft.type === opt.id}
                        onClick={() => setDraft(d => ({ ...d, type: opt.id, rule: defaultRule(opt.id) }))}
                        className={`rounded-xl border px-3.5 py-3 text-left transition ${
                          draft.type === opt.id ? 'border-[#ff9a3d] bg-[#fff3ec]' : 'border-[#ececf1] hover:border-[#d4d3df]'
                        }`}
                      >
                        <div className="text-sm font-bold text-[#1a1a2e]">{opt.label}</div>
                        <div className="mt-0.5 text-xs text-[#6a6b7b]">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {(rule.kind === 'bonus_credits' || rule.kind === 'discount') && (
                  <>
                    <Field label="Percent" error={offerErrs.percent}>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={rule.percent}
                        onChange={e => setRule({ ...rule, percent: Number(e.target.value) } as CampaignRule)}
                        className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                      />
                    </Field>
                    <Field label="Applies to plans" error={offerErrs.plans}>
                      <PlanChips
                        selected={rule.plans}
                        onToggle={id => setRule({ ...rule, plans: togglePlan(rule.plans, id) } as CampaignRule)}
                      />
                    </Field>
                  </>
                )}

                {rule.kind === 'bonus_credits' && (
                  <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
                    <input
                      type="checkbox"
                      checked={rule.includeTopup}
                      onChange={e => setRule({ ...rule, includeTopup: e.target.checked } as CampaignRule)}
                      className="size-4 rounded border-[#ececf1]"
                    />
                    Include credit top-ups
                  </label>
                )}

                {rule.kind === 'discount' && (
                  <Field label="Billing cycle">
                    <div className="flex gap-2">
                      {BILLING_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={rule.kind === 'discount' && rule.billing === opt.id}
                          onClick={() => setRule({ ...rule, billing: opt.id } as CampaignRule)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                            rule.kind === 'discount' && rule.billing === opt.id
                              ? 'bg-[#1a1a2e] text-white'
                              : 'bg-[#f4f4f6] text-[#6a6b7b] hover:bg-[#ececf1]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {rule.kind === 'unlock' && (
                  <>
                    <Field label="Models (comma-separated)" error={offerErrs.models}>
                      <input
                        value={rule.models.join(', ')}
                        onChange={e =>
                          setRule({
                            ...rule,
                            models: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                          } as CampaignRule)
                        }
                        placeholder="Seedance 2.0, Seedream 5.0"
                        className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                      />
                      <p className="mt-1 text-xs text-[#9a9aa6]">Names must match the rows in the comparison matrix exactly.</p>
                    </Field>
                    <Field label="Unlocked for plans" error={offerErrs.forPlans}>
                      <PlanChips
                        selected={rule.forPlans}
                        onToggle={id => setRule({ ...rule, forPlans: togglePlan(rule.forPlans, id) } as CampaignRule)}
                      />
                    </Field>
                  </>
                )}

                {rule.kind === 'promo_code' && (
                  <div className="rounded-2xl border border-[#ececf1] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-[#1a1a2e]">Linked redeem code</h4>
                        <p className="mt-0.5 text-[12px] text-[#6a6b7b]">
                          码在 Redeem codes 里统一维护,这里只做绑定,避免同一个码两处配置对不上。
                        </p>
                      </div>
                      <Link
                        href="/prototypes/promo-campaigns/admin/codes"
                        className="shrink-0 text-[12.5px] font-semibold text-[#ff5e1a] hover:underline"
                      >
                        Manage codes →
                      </Link>
                    </div>

                    <select
                      value={draft.codeId ?? ''}
                      onChange={e => {
                        const id = e.target.value;
                        const picked = codes.find(c => c.id === id);
                        setDraft(d => ({
                          ...d,
                          codeId: id || null,
                          rule: picked
                            ? {
                                kind: 'promo_code',
                                code: picked.code,
                                percent: picked.percent,
                                totalQuota: picked.maxRedemptions,
                                perUserLimit: picked.perUserLimit,
                              }
                            : d.rule,
                        }));
                      }}
                      className="mt-4 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                    >
                      <option value="">Select a code…</option>
                      {codes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.percent}% OFF
                        </option>
                      ))}
                    </select>

                    {draft.codeId ? (
                      (() => {
                        const picked = codes.find(c => c.id === draft.codeId);
                        if (!picked) {
                          return (
                            <p className="mt-3 text-[12.5px] font-semibold text-[#c9432a]">
                              The linked code no longer exists. Pick another one.
                            </p>
                          );
                        }
                        return (
                          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px] sm:grid-cols-4">
                            <SummaryRow label="Discount" value={`${picked.percent}% OFF`} />
                            <SummaryRow label="Quota" value={picked.maxRedemptions === 0 ? 'Unlimited' : String(picked.maxRedemptions)} />
                            <SummaryRow label="Per user" value={String(picked.perUserLimit)} />
                            <SummaryRow label="First order only" value={picked.firstTimeOnly ? 'Yes' : 'No'} />
                          </dl>
                        );
                      })()
                    ) : (
                      <p className="mt-3 text-[12.5px] font-semibold text-[#c9432a]">
                        Pick a code — a promo-code campaign without one has nothing to apply at checkout.
                      </p>
                    )}

                    <p className="mt-4 rounded-xl bg-[#faf8f6] px-3 py-2.5 text-[12px] text-[#6a6b7b]">
                      用户不需要手动输入:结账时由 Stripe Checkout 自动带上这个码。
                    </p>
                  </div>
                )}
              </div>
              );
            })()}</Section>

            <Section step={3} title="Placement" hint="Where the offer shows up on the client">
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#ececf1] p-4">
                  <h4 className="text-sm font-bold text-[#1a1a2e]">Pricing page artwork</h4>
                  <p className="mt-0.5 text-[12px] text-[#6a6b7b]">
                    活动 live 时显示在定价页标题上方。现在用 CSS 画,接真图时只换这一层。
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ART_OPTIONS.map(opt => {
                      const on = (draft.art ?? 'none') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDraft(d => ({ ...d, art: opt.id as ArtKey }))}
                          className={`overflow-hidden rounded-xl border text-left transition ${
                            on ? 'border-[#ff5e1a] ring-2 ring-[#ff5e1a]/20' : 'border-[#ececf1] hover:border-[#d4d3df]'
                          }`}
                        >
                          <CampaignArt art={opt.id} className="h-14 w-full" />
                          <span className="block px-2.5 py-2 text-[12px] font-semibold text-[#1a1a2e]">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#ececf1] p-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                    <input
                      type="checkbox"
                      checked={draft.popup.enabled}
                      onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, enabled: e.target.checked } }))}
                      className="size-4 rounded border-[#ececf1]"
                    />
                    Show popup
                  </label>

                  {draft.popup.enabled && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Badge (left)">
                          <input
                            value={draft.popup.badgeLeft}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, badgeLeft: e.target.value } }))}
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                        <Field label="Badge (right)">
                          <input
                            value={draft.popup.badgeRight}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, badgeRight: e.target.value } }))}
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Headline number">
                          <input
                            value={draft.popup.headlineNumber}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, headlineNumber: e.target.value } }))}
                            placeholder="50%"
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                        <Field label="Headline text" error={placementErrs.headlineText}>
                          <input
                            value={draft.popup.headlineText}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, headlineText: e.target.value } }))}
                            placeholder="Extra credits"
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="CTA text" error={placementErrs.ctaText}>
                          <input
                            value={draft.popup.ctaText}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, ctaText: e.target.value } }))}
                            placeholder="Claim now"
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                        <Field label="CTA link">
                          <input
                            value={draft.popup.ctaHref}
                            onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, ctaHref: e.target.value } }))}
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                      </div>

                      <HighlightsEditor
                        highlights={draft.popup.highlights}
                        onChange={highlights => setDraft(d => ({ ...d, popup: { ...d.popup, highlights } }))}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#ececf1] p-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                    <input
                      type="checkbox"
                      checked={draft.pricingBanner.enabled}
                      onChange={e => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, enabled: e.target.checked } }))}
                      className="size-4 rounded border-[#ececf1]"
                    />
                    Show pricing page banner
                  </label>

                  {draft.pricingBanner.enabled && (
                    <div className="mt-4 space-y-4">
                      <Field label="Banner text">
                        <input
                          value={draft.pricingBanner.text}
                          onChange={e => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, text: e.target.value } }))}
                          placeholder="Summer Boost — 50% extra credits on every paid plan."
                          className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                        />
                      </Field>
                      <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
                        <input
                          type="checkbox"
                          checked={draft.pricingBanner.showCountdown}
                          onChange={e =>
                            setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, showCountdown: e.target.checked } }))
                          }
                          className="size-4 rounded border-[#ececf1]"
                        />
                        Show countdown timer
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section step={4} title="Review" hint="Check everything before it goes live">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#ececf1] p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#9a9aa6]">Summary</h3>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <SummaryRow label="Name" value={draft.name || '(untitled)'} />
                    <SummaryRow label="Type" value={TYPE_OPTIONS.find(t => t.id === draft.type)?.label ?? draft.type} />
                    <SummaryRow label="Offer" value={summarizeRule(draft.rule)} />
                    <SummaryRow label="Schedule" value={`${fmtDate(draft.startAt)} – ${fmtDate(draft.endAt)}`} />
                    <SummaryRow
                      label="Placement"
                      value={
                        [draft.popup.enabled && 'Popup', draft.pricingBanner.enabled && 'Pricing banner']
                          .filter(Boolean)
                          .join(' + ') || 'None'
                      }
                    />
                  </dl>
                </div>
                <p className="text-sm text-[#6a6b7b]">
                  Save as a draft to keep editing later, or publish now to make it live for eligible users immediately.
                </p>
              </div>
            </Section>
          </div>

          {/* 预览跟着滚,改到哪一段都能立刻看到客户端长什么样 */}
          <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)] lg:w-[420px] lg:shrink-0">
            <PreviewPanel draft={draft} />
          </aside>
        </div>

      {/* 动作条钉在底部,四段都改完了才提交,不再有 Next / Back */}
      <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] bg-white/95 px-4 py-3 backdrop-blur">
        <span className="text-[13px] text-[#6a6b7b]">
          {blocking ? (
            <span className="font-semibold text-[#c9432a]">Some required fields are missing — check the sections above.</span>
          ) : (
            'Everything checks out.'
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#6a6b7b] hover:border-[#d4d3df]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => finalize(false)}
            disabled={blocking}
            className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => finalize(true)}
            disabled={blocking}
            className="rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publish now
          </button>
        </div>
      </div>
    </div>
  );
}

/** 一段流程模块。页面式详情页靠编号 + 标题分段,不再用 Next 把人往前推。 */
function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#1a1a2e] text-[11px] font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-[#6a6b7b]">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;

  // 只对第一个子节点做 id/aria 注入,且只在它是原生表单元素(input/select/textarea)时才做——
  // 这样 label 的 htmlFor 才真正对应一个可关联的控件。像 PlanChips 这类自定义组件不认识
  // 这些 DOM 属性,注入了反而会破坏其类型安全,所以保持不变、不做关联。
  // Field 里偶尔还带一个说明性的 <p> 作为第二个子节点(例如 Models 字段),原样透传。
  const [firstChild, ...rest] = Children.toArray(children);
  const canAssociate = isValidElement(firstChild) && typeof firstChild.type === 'string';
  const input = canAssociate
    ? cloneElement(firstChild as ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': error ? errorId : undefined,
        'aria-invalid': error ? true : undefined,
      })
    : firstChild;

  return (
    <div>
      <label htmlFor={canAssociate ? id : undefined} className="mb-1.5 block text-sm font-semibold text-[#1a1a2e]">
        {label}
      </label>
      {input}
      {rest}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-[#c0392b]">
          {error}
        </p>
      )}
    </div>
  );
}

function PlanChips({ selected, onToggle }: { selected: PlanId[]; onToggle: (id: PlanId) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLAN_OPTIONS.map(opt => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={selected.includes(opt.id)}
          onClick={() => onToggle(opt.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            selected.includes(opt.id) ? 'bg-[#1a1a2e] text-white' : 'bg-[#f4f4f6] text-[#6a6b7b] hover:bg-[#ececf1]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function HighlightsEditor({
  highlights,
  onChange,
}: {
  highlights: PopupHighlight[];
  onChange: (h: PopupHighlight[]) => void;
}) {
  const addHighlight = () => {
    if (highlights.length >= 2) return;
    onChange([...highlights, { name: '', status: 'LIVE NOW', icon: 'image' }]);
  };
  const updateHighlight = (i: number, patch: Partial<PopupHighlight>) => {
    onChange(highlights.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  };
  const removeHighlight = (i: number) => {
    onChange(highlights.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-sm font-semibold text-[#1a1a2e]">Highlights (max 2)</span>
        <button
          type="button"
          onClick={addHighlight}
          disabled={highlights.length >= 2}
          className="text-xs font-bold text-[#ff5e1a] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add highlight
        </button>
      </div>
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#ececf1] p-2.5">
            <input
              value={h.name}
              onChange={e => updateHighlight(i, { name: e.target.value })}
              placeholder="Feature name"
              aria-label={`Highlight ${i + 1} name`}
              className="min-w-[140px] flex-1 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
            />
            <select
              value={h.status}
              onChange={e => updateHighlight(i, { status: e.target.value as PopupHighlight['status'] })}
              aria-label={`Highlight ${i + 1} status`}
              className="rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
            >
              <option value="LIVE NOW">LIVE NOW</option>
              <option value="COMING SOON">COMING SOON</option>
            </select>
            <select
              value={h.icon}
              onChange={e => updateHighlight(i, { icon: e.target.value as PopupHighlight['icon'] })}
              aria-label={`Highlight ${i + 1} icon`}
              className="rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
            >
              <option value="image">image</option>
              <option value="video">video</option>
            </select>
            <button
              type="button"
              onClick={() => removeHighlight(i)}
              aria-label="Remove highlight"
              className="rounded-lg p-1.5 text-[#c0392b] hover:bg-[#fdecea]"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {highlights.length === 0 && <p className="text-xs text-[#9a9aa6]">No highlights added — the popup will show a single-column layout.</p>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[#9a9aa6]">{label}</dt>
      <dd className="text-right font-semibold text-[#1a1a2e]">{value}</dd>
    </div>
  );
}
