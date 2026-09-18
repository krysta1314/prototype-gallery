'use client';

import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorThumb,
  Input as AriaInput,
  Label as AriaLabel,
  SliderOutput,
  SliderTrack,
} from 'react-aria-components';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import { POPUP_KINDS, offerOn, pricingCardOn } from '../_lib/types';
import type { ArtKey, Campaign, CampaignRule, CampaignType, PlanId, PopupKind } from '../_lib/types';
import { useCodes } from '../_lib/store';
import { CampaignArt, ART_OPTIONS } from './CampaignArt';
import { ImageSlot } from './ImageSlot';
import { BLANK_PRICING_CARD, pricingCardHints } from '../_lib/pricing-card';
import { PreviewPanel } from './PreviewPanel';

const PLAN_OPTIONS: { id: PlanId; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro' },
  { id: 'ultra', label: 'Ultra' },
];

/* 两种主力奖励:一种在「买成功之后」加赠 credits,一种在「结账当下」用码打折。
   节日活动(万圣节 / 黑五 / 新年)挑其中一种,不叠加。 */
const TYPE_OPTIONS: { id: CampaignType; label: string; desc: string }[] = [
  { id: 'bonus_credits', label: 'Bonus credits on purchase', desc: 'Pays full price, gets extra credits after the payment succeeds.' },
  { id: 'promo_code', label: 'Discount code', desc: 'A redeem code takes money off at checkout. Nothing is added afterwards.' },
  { id: 'discount', label: 'Price discount (no code)', desc: 'Percentage off the listed price, applied to everyone — no code needed.' },
  { id: 'unlock', label: 'Feature unlock', desc: 'Temporarily unlock a model for certain plans.' },
];

/* 顶部条的底色预设。业界就三类:品牌主色(一眼认出是自家活动)、近黑(最不喧哗,
   适合常驻公告)、深色饱和色(促销感强又不刺眼)。浅色条只在低干扰通知里用,
   所以留一个就够。运营还能直接填 Hex。 */
const BANNER_COLORS: { hex: string; label: string }[] = [
  { hex: '#FF5E1A', label: 'Brand orange' },
  { hex: '#141420', label: 'Near black' },
  { hex: '#1F2A5C', label: 'Deep indigo' },
  { hex: '#0F6B4A', label: 'Deep green' },
  { hex: '#FFF3EC', label: 'Soft cream' },
];

/** 本地上传的素材:图片转成 data URI,视频是 object URL。两者都不是运营填的外链。 */
function isUploaded(src: string): boolean {
  return src.startsWith('data:') || src.startsWith('blob:');
}

const BILLING_OPTIONS: { id: 'monthly' | 'yearly' | 'both'; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'both', label: 'Both' },
];

function defaultRule(type: CampaignType): CampaignRule {
  switch (type) {
    case 'bonus_credits':
      return {
        kind: 'bonus_credits',
        percent: 20,
        plans: ['starter', 'pro', 'ultra'],
        includeTopup: false, // 只有订阅参与,单次充值不参与
        bonusExpiryDays: 0, // 永久积分,不过期
        consumeFirst: false, // 赠送额度与付费额度等价,不区分消耗顺序
        recurring: false, // 活动期内只赠一次
        clawbackOnRefund: false, // 不退款原则,不做回收
        grantMode: 'once', // 永久积分,月付年付一样一次性发满,不做按月分发
      };
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
    kind: 'promo',
    priority: 1,
    offerEnabled: true,
    pricingCardEnabled: true,
    name: '',
    published: false,
    startAt: '',
    endAt: '',
    type: 'bonus_credits',
    rule: defaultRule('bonus_credits'),
    art: 'none',
    pricingImage: '',
    pricingCard: { ...BLANK_PRICING_CARD },
    popup: {
      enabled: true,
      media: { kind: 'image', src: '' },
      title: '',
      description: '',
      items: [{ title: '', subtitle: '' }],
      ctaText: 'Claim now',
      ctaHref: '/prototypes/promo-campaigns/pricing',
    },
    pricingBanner: { enabled: true, bg: '#FF5E1A', text: '', ctaText: '', ctaHref: '#plans', showCountdown: true, countdownFrom: '', countdownTo: '' },
    frequency: { maxPerUser: 1, intervalDays: 7 },
  };
}

function togglePlan(plans: PlanId[], id: PlanId): PlanId[] {
  return plans.includes(id) ? plans.filter(p => p !== id) : [...plans, id];
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
type PlacementErrors = { items?: string; title?: string; ctaText?: string };

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
  // 模板最多三条卖点:再多弹窗就得滚动,首页弹窗一滚就没人读了
  if (d.popup.items.length > 3) errs.items = 'Up to 3 lines. More than that and nobody reads them.';
  if (d.popup.enabled) {
    if (!d.popup.title.trim()) errs.title = 'Title is required.';
    if (!d.popup.ctaText.trim()) errs.ctaText = 'CTA text is required.';
  }
  return errs;
}

export function CampaignEditor({
  initial,
  onCancel,
  onSave,
  initialToast = null,
}: {
  initial: Campaign | 'new';
  onCancel: () => void;
  onSave: (c: Campaign, opts?: { stay?: boolean }) => void;
  /* 新建活动首次保存时,详情页会把 URL 从 /new 换成真实 id —— 那次替换会让本组件
     重新挂载,自身的 toast state 随之丢失。所以由详情页通过 URL 参数把「刚保存成功」
     这件事带进来,挂载后补一个 toast。 */
  initialToast?: string | null;
}) {
  const [draft, setDraft] = useState<Campaign>(() => (initial === 'new' ? blankCampaign() : initial));
  const { codes } = useCodes();
  const isNew = initial === 'new';
  const titleId = useId();

  const basicsErrs = basicsErrors(draft);
  const offerErrs = offerErrors(draft.rule);
  const placementErrs = placementErrors(draft);

  const missingCode = draft.rule.kind === 'promo_code' && !draft.codeId;
  // Offer 段勾掉了就不该被它的校验拦住 —— 没启用的东西不算缺
  const blocking =
    hasError(basicsErrs) || hasError(placementErrs) || (offerOn(draft) && (hasError(offerErrs) || missingCode));

  /* 存草稿和发布都留在本页,只是保存。新建时把生成的 id 写回 draft,
     否则留在本页再存一次会又生成一个新 id,变成两条记录。 */
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(initialToast);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const finalize = (published: boolean) => {
    const id = draft.id === 'cmp-new' ? `cmp-${Date.now()}` : draft.id;
    const next = { ...draft, id, published };
    setBusy(published ? 'publish' : 'draft');
    // 原型没有后端,给一个短暂的 loading 让「已保存」这件事看得见
    window.setTimeout(() => {
      setDraft(next);
      onSave(next, { stay: true });
      setBusy(null);
      setSavedAt(Date.now());
      setToast(published ? 'Published — it is live for eligible users now.' : 'Saved as draft.');
    }, 500);
  };

  const setRule = (rule: CampaignRule) => setDraft(d => ({ ...d, rule }));

  // 改了任何字段就不再显示「Saved」—— 否则会让人以为新的改动也存进去了
  useEffect(() => {
    setSavedAt(null);
  }, [draft]);

  return (
    <div>
      {/* 动作按钮跟标题同一行并整条吸顶 —— 详情页不是向导,底部固定条会让人以为还有下一步。
          校验状态靠各字段自己的错误提示 + 按钮禁用表达,不再单独占一条横幅。 */}
      <div className="sticky top-0 z-20 border-b border-[#ececf1] bg-white/95 shadow-[0_6px_18px_-12px_rgba(26,26,46,0.25)] backdrop-blur">
        <div className="mx-auto max-w-[1180px] px-6 pb-4 pt-8">
        <button
          type="button"
          onClick={onCancel}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
        >
          <ArrowLeft className="size-4" /> All popups
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 id={titleId} className="truncate text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">
              {isNew ? 'New popup' : draft.name || 'Untitled popup'}
            </h1>
            <p className="mt-1 text-sm text-[#6a6b7b]">
              {isNew
                ? 'Fill in the sections below, then publish.'
                : 'Every change is saved to this popup only when you hit save.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
              disabled={busy !== null}
              title="Drafts can be saved at any time, even half-filled"

              className="inline-flex min-w-[124px] items-center justify-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === 'draft' ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : savedAt ? (
                <>
                  <Check className="size-4 text-[#0f7a3d]" /> Saved
                </>
              ) : (
                'Save as draft'
              )}
            </button>
            <button
              type="button"
              onClick={() => finalize(true)}
              disabled={blocking || busy !== null}
              title={blocking ? 'Some required fields are still missing.' : undefined}
              className="inline-flex min-w-[124px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === 'publish' ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Publishing…
                </>
              ) : (
                'Publish now'
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* 保存/发布都留在本页,所以要有一个明确的「成功了」反馈,否则点完不知道有没有生效 */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#141420] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_36px_rgba(26,26,46,0.32)]"
        >
          <Check className="size-4 text-[#7ee2a8]" />
          {toast}
        </div>
      )}

      <div className="mx-auto mt-7 flex max-w-[1180px] flex-col gap-6 px-6 pb-10 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-5">
            <Section step={1} title="Basics" hint="Type, name, schedule and priority">
              <div className="space-y-5">
                <Field label="Popup type">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {POPUP_KINDS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={draft.kind === opt.id}
                        onClick={() => setDraft(d => ({ ...d, kind: opt.id as PopupKind }))}
                        className={`rounded-xl border px-3.5 py-3 text-left transition ${
                          draft.kind === opt.id ? 'border-[#ff9a3d] bg-[#fff3ec]' : 'border-[#ececf1] hover:border-[#d4d3df]'
                        }`}
                      >
                        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#9a9aa6]">
                          {opt.group}
                        </span>
                        <span className="mt-0.5 block text-sm font-bold text-[#1a1a2e]">{opt.label}</span>
                        <span className="mt-0.5 block text-xs text-[#6a6b7b]">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Popup name" error={basicsErrs.name}>
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
                <Field label="Priority">
                  <input
                    type="number"
                    min={1}
                    value={draft.priority}
                    onChange={e => setDraft(d => ({ ...d, priority: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] sm:max-w-[160px]"
                  />
                  <p className="mt-1.5 text-[12px] text-[#6a6b7b]">
                    <b className="text-[#1a1a2e]">1 is the highest.</b> When several popups are live at once, only the
                    top-priority one shows. The rest wait for the user&apos;s next visit — never two in a row.
                  </p>
                </Field>
              </div>
            </Section>

            <Section step={2} title="Offer" hint="Pays full price, gets extra credits after the payment succeeds">{(() => {
              const rule = draft.rule;
              if (rule.kind !== 'bonus_credits') return null;
              const on = offerOn(draft);
              return (
              <div className="space-y-5">
                <SectionToggle
                  checked={on}
                  onChange={v => setDraft(d => ({ ...d, offerEnabled: v }))}
                  label="Grant bonus credits with this popup"
                  hint="Off means the popup is announcement-only — no credits, no price change."
                />
                {on && (
                <div className="space-y-5">
                <ul className="space-y-2 rounded-xl bg-[#faf8f6] px-3.5 py-3 text-[12.5px] text-[#6a6b7b]">
                  <li>
                    <b className="text-[#1a1a2e]">Bonus credits never expire.</b> They behave exactly like purchased
                    credits once granted.
                  </li>
                  <li>
                    <b className="text-[#1a1a2e]">Granted once per user per campaign.</b> Renewals inside the campaign
                    window do not grant it again.
                  </li>
                  <li>
                    <b className="text-[#1a1a2e]">Subscriptions only.</b> One-off credit top-ups do not qualify for the
                    bonus.
                  </li>
                  <li>
                    <b className="text-[#1a1a2e]">Never clawed back.</b> Purchases are non-refundable, so granted
                    credits always stay with the user.
                  </li>
                </ul>

                <Field label="Bonus percent" error={offerErrs.percent}>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rule.percent}
                    onChange={e => setRule({ ...rule, percent: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] sm:max-w-[240px]"
                  />
                </Field>

                <Field label="Applies to plans" error={offerErrs.plans}>
                  <PlanChips
                    selected={rule.plans}
                    onToggle={id => setRule({ ...rule, plans: togglePlan(rule.plans, id) })}
                  />
                </Field>
                </div>
                )}
              </div>
              );
            })()}</Section>

            <Section step={3} title="Popup" hint="One template for every type: media → title → lines → CTA">
              <div className="space-y-6">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                  <input
                    type="checkbox"
                    checked={draft.popup.enabled}
                    onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, enabled: e.target.checked } }))}
                    className="size-4 rounded border-[#ececf1]"
                  />
                  Show popup on the homepage
                </label>

                {draft.popup.enabled && (
                  <>
                    <div className="rounded-2xl border border-[#ececf1] p-4">
                      <h4 className="text-sm font-bold text-[#1a1a2e]">Media</h4>
                      <p className="mt-0.5 text-[12px] text-[#6a6b7b]">16:9, shown at the top of the popup. Upload a file or paste a URL.</p>

                      <div className="mt-3 flex gap-2">
                        {(['image', 'video'] as const).map(k => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={draft.popup.media.kind === k}
                            onClick={() =>
                              setDraft(d => ({ ...d, popup: { ...d.popup, media: { kind: k, src: '' } } }))
                            }
                            className={`rounded-xl border px-3.5 py-2 text-[13px] font-semibold capitalize transition ${
                              draft.popup.media.kind === k
                                ? 'border-[#ff9a3d] bg-[#fff3ec] text-[#ff5e1a]'
                                : 'border-[#ececf1] text-[#1a1a2e] hover:border-[#d4d3df]'
                            }`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>

                      {/* 图和视频都能上传,也都能填外链 —— 两种输入共用一个 src 字段 */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[240px_1fr]">
                        <ImageSlot
                          label="Upload"
                          hint={
                            draft.popup.media.kind === 'video'
                              ? 'MP4 or WebM, any size'
                              : 'Longest edge is capped at 1600px'
                          }
                          ratio="aspect-video"
                          media={draft.popup.media.kind}
                          value={isUploaded(draft.popup.media.src) ? draft.popup.media.src : ''}
                          onChange={v =>
                            setDraft(d => ({ ...d, popup: { ...d.popup, media: { ...d.popup.media, src: v } } }))
                          }
                        />
                        <div>
                          <Field label={`…or paste a ${draft.popup.media.kind} URL`}>
                            <input
                              value={isUploaded(draft.popup.media.src) ? '' : draft.popup.media.src}
                              onChange={e =>
                                setDraft(d => ({ ...d, popup: { ...d.popup, media: { ...d.popup.media, src: e.target.value } } }))
                              }
                              placeholder={
                                draft.popup.media.kind === 'video'
                                  ? 'https://…/launch.mp4'
                                  : 'https://…/launch.png'
                              }
                              className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                            />
                          </Field>
                          {draft.popup.media.kind === 'video' && (
                            <p className="mt-2 text-[12px] text-[#6a6b7b]">
                              Autoplays muted on loop. An uploaded video plays for this session only — the real upload
                              endpoint gives it a permanent URL.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Field label="Title" error={placementErrs.title}>
                      <input
                        value={draft.popup.title}
                        onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, title: e.target.value } }))}
                        placeholder="Seedream 5.0 Pro is here"
                        className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                      />
                    </Field>

                    <Field label="Description">
                      <textarea
                        value={draft.popup.description}
                        onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, description: e.target.value } }))}
                        rows={2}
                        placeholder="One or two sentences under the title. Optional."
                        className="w-full resize-y rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm leading-relaxed text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                      />
                    </Field>

                    <Field label="Lines" error={placementErrs.items}>
                      <div className="space-y-3">
                        {draft.popup.items.map((it, i) => (
                          <div key={i} className="rounded-xl border border-[#ececf1] p-3">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                                <input
                                  value={it.title}
                                  onChange={e =>
                                    setDraft(d => ({
                                      ...d,
                                      popup: {
                                        ...d.popup,
                                        items: d.popup.items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)),
                                      },
                                    }))
                                  }
                                  placeholder="Bold line"
                                  className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] font-semibold"
                                />
                                <input
                                  value={it.subtitle}
                                  onChange={e =>
                                    setDraft(d => ({
                                      ...d,
                                      popup: {
                                        ...d.popup,
                                        items: d.popup.items.map((x, k) => (k === i ? { ...x, subtitle: e.target.value } : x)),
                                      },
                                    }))
                                  }
                                  placeholder="Supporting line"
                                  className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] text-[#6a6b7b]"
                                />
                              </div>
                              <button
                                type="button"
                                aria-label="Remove line"
                                onClick={() =>
                                  setDraft(d => ({ ...d, popup: { ...d.popup, items: d.popup.items.filter((_, k) => k !== i) } }))
                                }
                                className="mt-2 shrink-0 rounded-lg px-1 text-[#b6b1bd] transition hover:text-[#c0392b]"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          disabled={draft.popup.items.length >= 3}
                          onClick={() =>
                            setDraft(d => ({ ...d, popup: { ...d.popup, items: [...d.popup.items, { title: '', subtitle: '' }] } }))
                          }
                          className="rounded-xl border border-dashed border-[#d4d2da] px-3 py-2 text-[12.5px] font-semibold text-[#6a6b7b] transition hover:border-[#ffb694] hover:text-[#ff5e1a] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          + Add line
                        </button>
                      </div>
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="CTA text" error={placementErrs.ctaText}>
                        <input
                          value={draft.popup.ctaText}
                          onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, ctaText: e.target.value } }))}
                          placeholder="Grab the bonus"
                          className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                        />
                      </Field>
                      <Field label="CTA link">
                        <input
                          value={draft.popup.ctaHref}
                          onChange={e => setDraft(d => ({ ...d, popup: { ...d.popup, ctaHref: e.target.value } }))}
                          placeholder="/prototypes/promo-campaigns/pricing"
                          className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                        />
                      </Field>
                    </div>
                  </>
                )}
              </div>
            </Section>

            <Section step={4} title="Pricing page" hint="Promo card under the heading while the promotion is live">
              <div className="space-y-6">
                <SectionToggle
                  checked={pricingCardOn(draft)}
                  onChange={v => setDraft(d => ({ ...d, pricingCardEnabled: v }))}
                  label="Show a promo card on the pricing page"
                  hint="Off means the pricing page stays untouched by this popup."
                />
                {pricingCardOn(draft) && (
                <div className="space-y-6">
                <div className="rounded-2xl border border-[#ececf1] p-4">
                  <h4 className="text-sm font-bold text-[#1a1a2e]">Card background</h4>
                  <p className="mt-0.5 text-[12px] text-[#6a6b7b]">Sits behind the promo card, about 3:1. Copy is overlaid on the left, so keep that side clear.</p>
                  <div className="mt-4 max-w-[320px]">
                    <ImageSlot
                      label="Card image"
                      hint="Falls back to the color preset below"
                      ratio="aspect-[3/1]"
                      value={draft.pricingImage}
                      onChange={v => setDraft(d => ({ ...d, pricingImage: v }))}
                      placeholder={<CampaignArt art={draft.art} className="h-full w-full" />}
                    />
                  </div>

                  <div className="mt-4">
                    <span className="text-[13px] font-bold text-[#1a1a2e]">Color preset</span>
                    <p className="mt-0.5 text-[12px] text-[#6a6b7b]">Used as the card background when no image is uploaded.</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
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
                            <CampaignArt art={opt.id} className="h-10 w-full" />
                            <span className="block px-2 py-1.5 text-[11.5px] font-semibold text-[#1a1a2e]">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* 卡里的文案。留空就用占位(从活动数据推导),填了就完全听运营的 */}
                <div className="rounded-2xl border border-[#ececf1] p-4">
                  <h4 className="text-sm font-bold text-[#1a1a2e]">Card copy</h4>
                  <p className="mt-0.5 text-[12px] text-[#6a6b7b]">
                    Empty fields are not shown on the client — the greyed-out text is only a suggestion.
                  </p>

                  {(() => {
                    const card = draft.pricingCard ?? BLANK_PRICING_CARD;
                    const ph = pricingCardHints(draft);
                    const set = (k: keyof typeof card, v: string) =>
                      setDraft(d => ({ ...d, pricingCard: { ...(d.pricingCard ?? BLANK_PRICING_CARD), [k]: v } }));
                    return (
                      <div className="mt-4 space-y-4">
                        {/* 顺序照卡片上的阅读顺序来:标签 → 大标题 → 第二行 → 说明 → CTA。
                            填写顺序和视觉顺序对不上,运营就得来回跳着看预览。 */}
                        <Field label="Tag">
                          <input value={card.tag} onChange={e => set('tag', e.target.value)} autoComplete="off" name={`card-tag`} placeholder={ph.tag} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] sm:max-w-[280px]" />
                        </Field>
                        <Field label="Headline">
                          <input value={card.headline} onChange={e => set('headline', e.target.value)} autoComplete="off" name={`card-headline`} placeholder={ph.headline} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]" />
                        </Field>
                        <Field label="Second line">
                          <input value={card.subheadline} onChange={e => set('subheadline', e.target.value)} autoComplete="off" name={`card-subheadline`} placeholder={ph.subheadline} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]" />
                        </Field>
                        <Field label="Note">
                          <input value={card.note} onChange={e => set('note', e.target.value)} autoComplete="off" name={`card-note`} placeholder={ph.note} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]" />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="CTA text">
                            <input value={card.ctaText} onChange={e => set('ctaText', e.target.value)} autoComplete="off" name={`card-ctaText`} placeholder={ph.ctaText} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]" />
                          </Field>
                          <Field label="CTA link">
                            <input value={card.ctaHref} onChange={e => set('ctaHref', e.target.value)} autoComplete="off" name={`card-ctaHref`} placeholder={ph.ctaHref} className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]" />
                          </Field>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                </div>
                )}
              </div>
            </Section>

            <Section step={5} title="Top banner" hint="Thin strip pinned to the very top of the pricing page">
              <div className="space-y-6">
                <div>
                  <SectionToggle
                    checked={draft.pricingBanner.enabled}
                    onChange={v => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, enabled: v } }))}
                    label="Show a strip at the top of the pricing page"
                    hint="A thin strip crops any image badly, so it takes a background color instead — text and button colors flip to black or white based on its brightness."
                  />

                  {draft.pricingBanner.enabled && (
                    <div className="mt-4 space-y-4">
                      <Field label="Banner text">
                        <input
                          value={draft.pricingBanner.text}
                          onChange={e => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, text: e.target.value } }))}
                          placeholder="Halloween — 25% extra credits on every plan until Nov 2."
                          className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                        />
                      </Field>

                      <Field label="Background color">
                        <div className="flex flex-wrap items-center gap-2">
                          {BANNER_COLORS.map(c => {
                            const on = draft.pricingBanner.bg.toUpperCase() === c.hex;
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.label}
                                aria-label={c.label}
                                aria-pressed={on}
                                onClick={() => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, bg: c.hex } }))}
                                className={`size-8 rounded-lg border transition ${
                                  on ? 'border-[#1a1a2e] ring-2 ring-[#1a1a2e]/15' : 'border-[#ececf1] hover:border-[#d4d3df]'
                                }`}
                                style={{ background: c.hex }}
                              />
                            );
                          })}

                          {/* 预设之外还要能自己调色 —— 节日活动的色不一定在五个预设里 */}
                          <BannerColorPicker
                            value={draft.pricingBanner.bg}
                            onChange={hex => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, bg: hex } }))}
                          />
                        </div>
                      </Field>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="CTA text">
                          <input
                            value={draft.pricingBanner.ctaText}
                            onChange={e => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, ctaText: e.target.value } }))}
                            placeholder="Leave empty to hide the button"
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                        <Field label="CTA link">
                          <input
                            value={draft.pricingBanner.ctaHref}
                            onChange={e => setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, ctaHref: e.target.value } }))}
                            placeholder="#plans"
                            className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]"
                          />
                        </Field>
                      </div>

                      <div>
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

                        {/* 倒计时要两个时刻:从什么时候开始挂、倒到哪一刻。
                            只有结束时间的话,预热期的倒计时会提前一直摆在页面上。 */}
                        {draft.pricingBanner.showCountdown && (() => {
                          const b = draft.pricingBanner;
                          const custom = Boolean(b.countdownFrom || b.countdownTo);
                          const from = b.countdownFrom || draft.startAt;
                          const to = b.countdownTo || draft.endAt;
                          const inverted = Boolean(from && to && new Date(to) <= new Date(from));
                          const setB = (patch: Partial<typeof b>) =>
                            setDraft(d => ({ ...d, pricingBanner: { ...d.pricingBanner, ...patch } }));
                          return (
                            <div className="mt-3 rounded-xl border border-[#ececf1] p-3">
                              <span className="text-[13px] font-semibold text-[#1a1a2e]">Countdown window</span>
                              <p className="mt-0.5 text-[12px] text-[#6a6b7b]">
                                The timer needs both ends: when it starts showing, and the moment it counts down to.
                              </p>

                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  aria-pressed={!custom}
                                  onClick={() => setB({ countdownFrom: '', countdownTo: '' })}
                                  className={`rounded-xl border px-3 py-2 text-[13px] font-semibold transition ${
                                    !custom
                                      ? 'border-[#ff9a3d] bg-[#fff3ec] text-[#ff5e1a]'
                                      : 'border-[#ececf1] text-[#1a1a2e] hover:border-[#d4d3df]'
                                  }`}
                                >
                                  Campaign dates
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={custom}
                                  onClick={() => setB({ countdownFrom: draft.startAt || '', countdownTo: draft.endAt || '' })}
                                  className={`rounded-xl border px-3 py-2 text-[13px] font-semibold transition ${
                                    custom
                                      ? 'border-[#ff9a3d] bg-[#fff3ec] text-[#ff5e1a]'
                                      : 'border-[#ececf1] text-[#1a1a2e] hover:border-[#d4d3df]'
                                  }`}
                                >
                                  Custom
                                </button>
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Starts showing">
                                  <input
                                    type="datetime-local"
                                    value={from}
                                    disabled={!custom}
                                    onChange={e => setB({ countdownFrom: e.target.value })}
                                    className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] disabled:cursor-not-allowed disabled:bg-[#faf8f6] disabled:text-[#9a9aa6]"
                                  />
                                </Field>
                                <Field label="Counts down to">
                                  <input
                                    type="datetime-local"
                                    value={to}
                                    disabled={!custom}
                                    onChange={e => setB({ countdownTo: e.target.value })}
                                    className="w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d] disabled:cursor-not-allowed disabled:bg-[#faf8f6] disabled:text-[#9a9aa6]"
                                  />
                                </Field>
                              </div>

                              {inverted && (
                                <p className="mt-2 text-[12px] font-semibold text-[#c9432a]">
                                  The end moment must come after the start — the timer would never show.
                                </p>
                              )}
                              <p className="mt-2 text-[12px] text-[#6a6b7b]">
                                Before the start it stays hidden; once it hits zero it disappears instead of counting
                                negative.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>

          </div>

          {/* 预览跟着滚,改到哪一段都能立刻看到客户端长什么样 */}
          <aside className="lg:sticky lg:top-[152px] lg:h-[calc(100vh-11.5rem)] lg:w-[520px] lg:shrink-0 lg:overflow-y-auto">
            <PreviewPanel draft={draft} />
          </aside>
        </div>

    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-[#ececf1]"
      />
      <span>
        <span className="block text-[13px] font-semibold text-[#1a1a2e]">{label}</span>
        <span className="block text-[12px] text-[#6a6b7b]">{hint}</span>
      </span>
    </label>
  );
}

/* 每个可选投放位的启用开关。放在 section 最上面一行 ——
   类型只决定默认勾没勾,不再按类型把整段藏起来。藏起来的坏处是运营
   根本不知道还有这个能力,而且「通知类想挂个加赠」这种诉求就没有出口。 */
function SectionToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#faf8f6] px-3.5 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-[#ececf1]"
      />
      <span>
        <span className="block text-[13.5px] font-bold text-[#1a1a2e]">{label}</span>
        <span className="block text-[12px] text-[#6a6b7b]">{hint}</span>
      </span>
    </label>
  );
}

/* 顶部条底色的自定义取色器。预设解决 90% 的场景,剩下的节日主题色得能自己调。
   用 React Aria 的 ColorPicker:自带键盘操作和本地化的无障碍标签,不用自己实现 HSB 换算。 */
function BannerColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // 点外面关掉。弹层挂在这个 div 里,所以判断 contains 就够
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Custom color"
        title="Custom color"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded-lg border border-[#ececf1] pl-1 pr-2.5 text-[12.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df]"
      >
        <span className="size-6 rounded-md border border-black/10" style={{ background: value }} />
        <span className="font-mono uppercase">{value || '#------'}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[212px] rounded-2xl border border-[#ececf1] bg-white p-3 shadow-[0_16px_40px_rgba(26,26,46,0.18)]">
          <ColorPicker value={value || '#FF5E1A'} onChange={c => onChange(c.toString('hex'))}>
            <ColorArea
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
              className="h-[150px] w-full rounded-lg"
            >
              <ColorThumb className="size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" />
            </ColorArea>

            <ColorSlider colorSpace="hsb" channel="hue" className="mt-3">
              <div className="flex items-center justify-between text-[11.5px] text-[#6a6b7b]">
                <AriaLabel>Hue</AriaLabel>
                <SliderOutput />
              </div>
              <SliderTrack className="mt-1 h-3.5 rounded-full">
                <ColorThumb className="top-1/2 size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" />
              </SliderTrack>
            </ColorSlider>

            <ColorField className="mt-3 block">
              <AriaLabel className="text-[11.5px] text-[#6a6b7b]">Hex</AriaLabel>
              <AriaInput className="mt-1 w-full rounded-lg border border-[#ececf1] px-2 py-1.5 font-mono text-[12.5px] uppercase text-[#1a1a2e] outline-none transition focus:border-[#ff5e1a]" />
            </ColorField>
          </ColorPicker>
        </div>
      )}
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
