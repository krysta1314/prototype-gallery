'use client';

/* 兑换码管理。和 Campaign 拆成两层:活动管「什么时候展示、怎么展示」,码管「折多少、发多少、谁能用」。
   分层照 Stripe 的 coupon / promotion code 来,后端对接时能一一对上。
   客户端没有输入框 —— 码在 Stripe Checkout 里自动带入,这里只负责发码和管额度。 */

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Copy, Pencil, Trash2, Power, ArrowLeft, Check } from 'lucide-react';
import { useCampaigns, useCodes, resolveCodeStatus, type CodeStatus } from '../../_lib/store';
import type { RedeemCode } from '../../_lib/types';
import { AdminSidebar } from '../../_components/AdminSidebar';
import { ViewBar } from '../../_components/ViewBar';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const STATUS_STYLE: Record<CodeStatus, string> = {
  active: 'bg-[#e9f9ef] text-[#0f7a3d] ring-[#b7e6c8]',
  paused: 'bg-[#f4f4f6] text-[#6a6b7b] ring-[#e2e2e8]',
  expired: 'bg-[#f4f4f6] text-[#9a9aa6] ring-[#e2e2e8]',
  exhausted: 'bg-[#fdecea] text-[#c0392b] ring-[#f6c9c3]',
};
const STATUS_LABEL: Record<CodeStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
  exhausted: 'Exhausted',
};

function blankCode(): RedeemCode {
  return {
    id: `code-${Date.now()}`,
    code: '',
    note: '',
    percent: 20,
    maxRedemptions: 0,
    redeemed: 0,
    perUserLimit: 1,
    firstTimeOnly: false,
    expiresAt: '',
    active: true,
  };
}

function fmtDate(s: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-[#1a1a2e]">{label}</span>
      {hint && <span className="mt-0.5 block text-[12px] text-[#6a6b7b]">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const INPUT =
  'w-full rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#ff9a3d]';

export default function RedeemCodesPage() {
  const { codes, save, ready } = useCodes();
  const { campaigns } = useCampaigns();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<RedeemCode | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  // 与 admin 列表同样的处理:now 放 effect 里取,避免 SSR/CSR 首帧不一致
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(Date.now()), []);

  /** 码 → 引用它的活动名。一个码可以被多个活动引用,所以这里是数组。 */
  const usedBy = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of campaigns) {
      if (!c.codeId) continue;
      (map[c.codeId] ??= []).push(c.name);
    }
    return map;
  }, [campaigns]);

  const rows = useMemo(() => {
    if (!ready || now === null) return [];
    const q = query.trim().toLowerCase();
    return codes
      .filter(c => !q || c.code.toLowerCase().includes(q) || c.note.toLowerCase().includes(q))
      .map(c => ({ c, status: resolveCodeStatus(c, now) }));
  }, [codes, query, ready, now]);

  const copy = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const remove = (target: RedeemCode) => {
    if (usedBy[target.id]?.length) {
      window.alert(`"${target.code}" is still used by: ${usedBy[target.id].join(', ')}. Unlink it first.`);
      return;
    }
    if (!window.confirm(`Delete "${target.code}"? This cannot be undone.`)) return;
    save(codes.filter(c => c.id !== target.id));
  };

  const toggle = (target: RedeemCode) =>
    save(codes.map(c => (c.id === target.id ? { ...c, active: !c.active } : c)));

  const commit = (draft: RedeemCode) => {
    const exists = codes.some(c => c.id === draft.id);
    save(exists ? codes.map(c => (c.id === draft.id ? draft : c)) : [draft, ...codes]);
    setEditing(null);
  };

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      <ViewBar />
      <div className="flex">
        <AdminSidebar view="codes" />
        <main className="min-w-0 flex-1 px-6 py-10">
          <div className="mx-auto max-w-[1180px]">
            {editing ? (
              <CodeEditor
                initial={editing}
                isNew={!codes.some(c => c.id === editing.id)}
                onCancel={() => setEditing(null)}
                onSave={commit}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">Redeem codes</h1>
                    <p className="mt-1 text-sm text-[#6a6b7b]">
                      Codes are applied automatically at Stripe Checkout — users never type them in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(blankCode())}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Plus className="size-4" /> New code
                  </button>
                </div>

                <div className="mt-7 flex items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 py-2">
                  <Search className="size-4 text-[#a3a3ae]" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search codes"
                    className="w-full bg-transparent text-sm text-[#1a1a2e] outline-none placeholder:text-[#a3a3ae]"
                  />
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#faf8f6] text-[11px] uppercase tracking-wider text-[#9a9aa6]">
                      <tr>
                        <th className="px-5 py-3 font-bold">Code</th>
                        <th className="px-5 py-3 font-bold">Discount</th>
                        <th className="px-5 py-3 font-bold">Used</th>
                        <th className="px-5 py-3 font-bold">Limits</th>
                        <th className="px-5 py-3 font-bold">Expires</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                        <th className="px-5 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ c, status }) => (
                        <tr
                          key={c.id}
                          onClick={() => setEditing(c)}
                          className="cursor-pointer border-t border-[#f1f1f4] transition hover:bg-[#fffaf7]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#f4f4f6] px-2 py-1 font-mono text-[12.5px] font-bold tracking-wide text-[#1a1a2e]">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                aria-label={`Copy ${c.code}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  copy(c.code);
                                }}
                                className="rounded-md p-1 text-[#a3a3ae] transition hover:text-[#ff5e1a]"
                              >
                                {copied === c.code ? <Check className="size-3.5 text-[#0f7a3d]" /> : <Copy className="size-3.5" />}
                              </button>
                            </div>
                            <div className="mt-1 text-[12px] text-[#6a6b7b]">
                              {usedBy[c.id]?.length ? usedBy[c.id].join(' · ') : 'Not linked to a campaign'}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#1a1a2e]">{c.percent}% OFF</td>
                          <td className="px-5 py-4 text-[#1a1a2e]">
                            {c.redeemed.toLocaleString()}
                            <span className="text-[#9a9aa6]"> / {c.maxRedemptions === 0 ? '∞' : c.maxRedemptions.toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4 text-[12.5px] text-[#6a6b7b]">
                            {c.perUserLimit} per user
                            {c.firstTimeOnly && <div className="text-[#ff5e1a]">First order only</div>}
                          </td>
                          <td className="px-5 py-4 text-[#6a6b7b]">{fmtDate(c.expiresAt)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${STATUS_STYLE[status]}`}>
                              {STATUS_LABEL[status]}
                            </span>
                          </td>
                          <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button type="button" aria-label="Edit" onClick={() => setEditing(c)} className="rounded-lg p-2 text-[#6a6b7b] hover:bg-[#f4f4f6]"><Pencil className="size-4" /></button>
                              <button type="button" aria-label={c.active ? 'Pause' : 'Activate'} onClick={() => toggle(c)} className="rounded-lg p-2 text-[#6a6b7b] hover:bg-[#f4f4f6]"><Power className="size-4" /></button>
                              <button type="button" aria-label="Delete" onClick={() => remove(c)} className="rounded-lg p-2 text-[#c0392b] hover:bg-[#fdecea]"><Trash2 className="size-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {ready && rows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#9a9aa6]">
                            No codes match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function CodeEditor({
  initial,
  isNew,
  onCancel,
  onSave,
}: {
  initial: RedeemCode;
  isNew: boolean;
  onCancel: () => void;
  onSave: (c: RedeemCode) => void;
}) {
  const [draft, setDraft] = useState<RedeemCode>(initial);
  const codeError = !draft.code.trim()
    ? 'Code is required.'
    : !/^[A-Z0-9_-]{3,24}$/.test(draft.code)
      ? 'Use 3–24 characters: A–Z, 0–9, dash or underscore.'
      : '';
  const percentError = draft.percent < 1 || draft.percent > 100 ? 'Enter 1–100.' : '';
  const blocking = Boolean(codeError || percentError);

  return (
    <div>
      <button
        type="button"
        onClick={onCancel}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
      >
        <ArrowLeft className="size-4" /> All codes
      </button>
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">
        {isNew ? 'New code' : draft.code || 'Untitled code'}
      </h1>
      <p className="mt-1 text-sm text-[#6a6b7b]">
        Link it to a campaign from that campaign&apos;s Offer section.
      </p>

      <div className="mt-7 space-y-5">
        <section className="rounded-2xl border border-[#ececf1] bg-white p-5 sm:p-6">
          <h2 className="mb-5 text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">The code</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Code" hint="Uppercase, no spaces. This is what Stripe receives.">
              <input
                value={draft.code}
                onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                placeholder="BLACKFRIDAY50"
                className={`${INPUT} font-mono tracking-wide`}
              />
              {codeError && <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{codeError}</p>}
            </Field>
            <Field label="Discount (%)">
              <input
                type="number"
                value={draft.percent}
                onChange={e => setDraft(d => ({ ...d, percent: Number(e.target.value) }))}
                className={INPUT}
              />
              {percentError && <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{percentError}</p>}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Internal note" hint="Only shown in this admin.">
                <input
                  value={draft.note}
                  onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
                  placeholder="e.g. Black Friday sale"
                  className={INPUT}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ececf1] bg-white p-5 sm:p-6">
          <h2 className="mb-5 text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">Limits</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Total redemptions" hint="0 = unlimited.">
              <input
                type="number"
                value={draft.maxRedemptions}
                onChange={e => setDraft(d => ({ ...d, maxRedemptions: Math.max(0, Number(e.target.value)) }))}
                className={INPUT}
              />
            </Field>
            <Field label="Per user">
              <input
                type="number"
                value={draft.perUserLimit}
                onChange={e => setDraft(d => ({ ...d, perUserLimit: Math.max(1, Number(e.target.value)) }))}
                className={INPUT}
              />
            </Field>
            <Field label="Expires at" hint="Leave empty to follow the linked campaign's end date.">
              <input
                type="date"
                value={draft.expiresAt ? draft.expiresAt.slice(0, 10) : ''}
                onChange={e => setDraft(d => ({ ...d, expiresAt: e.target.value ? `${e.target.value}T23:59` : '' }))}
                className={INPUT}
              />
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-[#1a1a2e]">
                <input
                  type="checkbox"
                  checked={draft.firstTimeOnly}
                  onChange={e => setDraft(d => ({ ...d, firstTimeOnly: e.target.checked }))}
                  className="size-4 rounded border-[#ececf1]"
                />
                First order only
              </label>
            </div>
          </div>
        </section>

        {!isNew && (
          <section className="rounded-2xl border border-[#ececf1] bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">Usage</h2>
            <p className="mt-2 text-sm text-[#6a6b7b]">
              <b className="text-[#1a1a2e]">{draft.redeemed.toLocaleString()}</b> redeemed
              {draft.maxRedemptions > 0 && <> of {draft.maxRedemptions.toLocaleString()}</>}.
            </p>
            {draft.maxRedemptions > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f1f4]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]"
                  style={{ width: `${Math.min(100, (draft.redeemed / draft.maxRedemptions) * 100)}%` }}
                />
              </div>
            )}
          </section>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] bg-white/95 px-4 py-3 backdrop-blur">
        <span className="text-[13px] text-[#6a6b7b]">
          {blocking ? (
            <span className="font-semibold text-[#c9432a]">Fix the highlighted fields first.</span>
          ) : draft.active ? (
            'This code is active.'
          ) : (
            'This code is paused — it will not apply at checkout.'
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, active: !d.active }))}
            className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df]"
          >
            {draft.active ? 'Pause' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#6a6b7b] hover:border-[#d4d3df]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={blocking}
            className="rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save code
          </button>
        </div>
      </div>
    </div>
  );
}
