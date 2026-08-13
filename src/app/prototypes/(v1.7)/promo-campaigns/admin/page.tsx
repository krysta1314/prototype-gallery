'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Copy, Pencil, Trash2, RotateCcw, Power } from 'lucide-react';
import { useCampaigns, resolveStatus } from '../_lib/store';
import type { Campaign, CampaignStatus } from '../_lib/types';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const TABS: (CampaignStatus | 'all')[] = ['all', 'live', 'scheduled', 'ended', 'draft'];
const TAB_LABEL: Record<CampaignStatus | 'all', string> = {
  all: 'All',
  live: 'Live',
  scheduled: 'Scheduled',
  ended: 'Ended',
  draft: 'Draft',
};
const STATUS_STYLE: Record<CampaignStatus, string> = {
  live: 'bg-[#e9f9ef] text-[#0f7a3d] ring-[#b7e6c8]',
  scheduled: 'bg-[#fff3ec] text-[#ff5e1a] ring-[#ffc8b1]',
  ended: 'bg-[#f4f4f6] text-[#6a6b7b] ring-[#e2e2e8]',
  draft: 'bg-[#f4f4f6] text-[#9a9aa6] ring-[#e2e2e8]',
};
const TYPE_LABEL = {
  bonus_credits: 'Bonus credits',
  discount: 'Discount',
  unlock: 'Feature unlock',
  promo_code: 'Promo code',
} as const;

function offerSummary(c: Campaign): string {
  switch (c.rule.kind) {
    case 'bonus_credits':
      return `+${c.rule.percent}% credits`;
    case 'discount':
      return `${c.rule.percent}% OFF · ${c.rule.billing}`;
    case 'unlock':
      return `${c.rule.models.join(', ')} → ${c.rule.forPlans.join(' / ')}`;
    case 'promo_code':
      return `${c.rule.code} · ${c.rule.percent}% OFF`;
  }
}

function fmtRange(c: Campaign): string {
  const f = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${f(c.startAt)} – ${f(c.endAt)}`;
}

export default function PromoAdminPage() {
  const { campaigns, save, reset, ready } = useCampaigns();
  const [tab, setTab] = useState<CampaignStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState<number | null>(null);
  const [editing, setEditing] = useState<Campaign | 'new' | null>(null);

  // now 只在客户端取，避免 hydration mismatch；一次性挂载标记，非订阅回调
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(Date.now()), []);

  const rows = useMemo(() => {
    if (!ready || now === null) return [];
    return campaigns
      .map(c => ({ c, status: resolveStatus(c, now) }))
      .filter(({ status }) => tab === 'all' || status === tab)
      .filter(({ c }) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [campaigns, ready, now, tab, query]);

  const counts = useMemo(() => {
    if (!ready || now === null) return {} as Record<string, number>;
    const map: Record<string, number> = { all: campaigns.length };
    for (const c of campaigns) {
      const s = resolveStatus(c, now);
      map[s] = (map[s] ?? 0) + 1;
    }
    return map;
  }, [campaigns, ready, now]);

  const togglePublish = (target: Campaign) =>
    save(campaigns.map(c => (c.id === target.id ? { ...c, published: !c.published } : c)));

  const duplicate = (target: Campaign) =>
    save([
      { ...target, id: `${target.id}-copy-${campaigns.length}`, name: `${target.name} (copy)`, published: false },
      ...campaigns,
    ]);

  const remove = (target: Campaign) => {
    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return;
    save(campaigns.filter(c => c.id !== target.id));
  };

  return (
    <main style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6] px-6 py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">Promo campaigns</h1>
            <p className="mt-1 text-sm text-[#6a6b7b]">
              Configure offers, popups and pricing banners. Changes apply to the client instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#6a6b7b] hover:border-[#d4d3df]">
              <RotateCcw className="size-4" /> Reset to defaults
            </button>
            <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2.5 text-sm font-bold text-white">
              <Plus className="size-4" /> New campaign
            </button>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#ececf1] bg-white p-1">
            {TABS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  tab === t ? 'bg-[#1a1a2e] text-white' : 'text-[#6a6b7b] hover:bg-[#f4f4f6]'
                }`}
              >
                {TAB_LABEL[t]} {counts[t] !== undefined && <span className="opacity-60">{counts[t]}</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 py-2">
            <Search className="size-4 text-[#a3a3ae]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search campaigns"
              className="w-full bg-transparent text-sm text-[#1a1a2e] outline-none placeholder:text-[#a3a3ae]"
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#faf8f6] text-[11px] uppercase tracking-wider text-[#9a9aa6]">
              <tr>
                <th className="px-5 py-3 font-bold">Campaign</th>
                <th className="px-5 py-3 font-bold">Offer</th>
                <th className="px-5 py-3 font-bold">Schedule</th>
                <th className="px-5 py-3 font-bold">Placement</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, status }) => (
                <tr key={c.id} className="border-t border-[#f1f1f4]">
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#1a1a2e]">{c.name}</div>
                    <div className="mt-1 inline-flex rounded-full bg-[#f4f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6a6b7b]">
                      {TYPE_LABEL[c.type]}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#1a1a2e]">{offerSummary(c)}</td>
                  <td className="px-5 py-4 text-[#6a6b7b]">{fmtRange(c)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      {c.popup.enabled && <span className="rounded-md bg-[#fff3ec] px-2 py-0.5 text-[11px] font-bold text-[#ff5e1a]">Popup</span>}
                      {c.pricingBanner.enabled && <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[11px] font-bold text-[#4f46e5]">Pricing</span>}
                      {!c.popup.enabled && !c.pricingBanner.enabled && <span className="text-[#a3a3ae]">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${STATUS_STYLE[status]}`}>
                      {TAB_LABEL[status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label="Edit" onClick={() => setEditing(c)} className="rounded-lg p-2 text-[#6a6b7b] hover:bg-[#f4f4f6]"><Pencil className="size-4" /></button>
                      <button type="button" aria-label="Duplicate" onClick={() => duplicate(c)} className="rounded-lg p-2 text-[#6a6b7b] hover:bg-[#f4f4f6]"><Copy className="size-4" /></button>
                      <button type="button" aria-label={c.published ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(c)} className="rounded-lg p-2 text-[#6a6b7b] hover:bg-[#f4f4f6]"><Power className="size-4" /></button>
                      <button type="button" aria-label="Delete" onClick={() => remove(c)} className="rounded-lg p-2 text-[#c0392b] hover:bg-[#fdecea]"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[#9a9aa6]">No campaigns match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3 text-sm">
          <Link href="/prototypes/promo-campaigns/home" className="font-semibold text-[#ff5e1a] hover:underline">→ Client home (popup)</Link>
          <Link href="/prototypes/promo-campaigns/pricing" className="font-semibold text-[#ff5e1a] hover:underline">→ Client pricing</Link>
        </div>
      </div>

      {/* Task 7 在此挂载 CampaignWizard */}
      {editing !== null && null}
    </main>
  );
}
