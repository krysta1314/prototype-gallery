'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Copy, Pencil, Trash2, Power, AlertTriangle } from 'lucide-react';
import { useCampaigns, resolveStatus } from '../_lib/store';
import { popupQueue } from '../_lib/apply';
import type { Campaign, CampaignStatus, PopupKind } from '../_lib/types';
import { AdminSidebar } from '../_components/AdminSidebar';
import { ViewBar } from '../_components/ViewBar';

/* 操作列的图标按钮 + 即时 tooltip。
   原生 title 要悬停约一秒才出现、外观由系统决定,在后台这种高频操作区不够用。
   这里用纯 CSS 的 group-hover,鼠标一上就出;aria-label 仍然保留给读屏。 */
function IconAction({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`rounded-lg p-2 transition ${
          danger ? 'text-[#c0392b] hover:bg-[#fdecea]' : 'text-[#6a6b7b] hover:bg-[#f4f4f6]'
        }`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg bg-[#1a1a2e] px-2 py-1 text-[11.5px] font-semibold text-white shadow-[0_6px_18px_rgba(26,26,46,0.22)] group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}

/* 下线和删除都要二次确认。下线是让线上活动立刻消失、删除不可恢复,
   这两个都属于「点错了会有真实后果」的操作,不能一键就执行。
   用自绘弹窗而不是 window.confirm:原生弹窗文案不可控,也说不清后果。 */
function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_28px_90px_rgba(26,26,46,0.32)]"
      >
        <span
          className={`grid size-10 place-items-center rounded-xl ${
            danger ? 'bg-[#fdecea] text-[#c0392b]' : 'bg-[#fff3ec] text-[#ff5e1a]'
          }`}
        >
          <AlertTriangle className="size-5" />
        </span>
        <h2 className="mt-4 text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">{title}</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-semibold text-[#6a6b7b] hover:border-[#d4d3df]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${
              danger ? 'bg-[#c0392b] hover:bg-[#a93226]' : 'bg-[#1a1a2e] hover:bg-[#2b2c3b]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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
const KIND_LABEL: Record<PopupKind, string> = {
  promo: 'Promotion',
  model_launch: 'Model launch',
  feature_launch: 'Feature launch',
};

const KIND_STYLE: Record<PopupKind, string> = {
  promo: 'bg-[#fff3ec] text-[#ff5e1a]',
  model_launch: 'bg-[#eef2ff] text-[#4f46e5]',
  feature_launch: 'bg-[#eef7ee] text-[#2f7a3d]',
};

/**
 * 复制活动时生成不冲突的 id。不能用 campaigns.length 做后缀——删掉别的活动后长度会回落，
 * 再复制同一条就会撞出重复 id（上下线/删除会同时命中两行，React key 也会重复）。
 */
function nextCopyId(baseId: string, list: Campaign[]): string {
  let n = 1;
  while (list.some(c => c.id === `${baseId}-copy-${n}`)) n += 1;
  return `${baseId}-copy-${n}`;
}

function fmtRange(c: Campaign): string {
  const f = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${f(c.startAt)} – ${f(c.endAt)}`;
}

export default function PromoAdminPage() {
  const router = useRouter();
  const { campaigns, save, ready } = useCampaigns();
  const [tab, setTab] = useState<CampaignStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState<number | null>(null);

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

  /** 同时段可能有多个弹窗 live,列表上要标出这次真正会弹的是哪个 —— 否则运营只能靠猜 */
  const showingId = useMemo(
    () => (ready && now !== null ? (popupQueue(campaigns, now)[0]?.id ?? null) : null),
    [campaigns, ready, now],
  );

  const open = (id: string) => router.push(`/prototypes/promo-campaigns/admin/${id}`);

  /* 下线要确认,重新上线不用 —— 上线是可逆的,下线会让线上活动立刻消失 */
  const [confirming, setConfirming] = useState<{ intent: 'unpublish' | 'delete'; target: Campaign } | null>(null);

  const setPublished = (target: Campaign, published: boolean) =>
    save(campaigns.map(c => (c.id === target.id ? { ...c, published } : c)));

  const togglePublish = (target: Campaign) => {
    if (target.published) {
      setConfirming({ intent: 'unpublish', target });
      return;
    }
    setPublished(target, true);
  };

  const duplicate = (target: Campaign) =>
    save([
      { ...target, id: nextCopyId(target.id, campaigns), name: `${target.name} (copy)`, published: false },
      ...campaigns,
    ]);

  const remove = (target: Campaign) => setConfirming({ intent: 'delete', target });

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      <ViewBar />

      {confirming &&
        (confirming.intent === 'delete' ? (
          <ConfirmDialog
            title={`Delete “${confirming.target.name || 'this popup'}”?`}
            body="This removes the popup, its pricing card and its top banner. It cannot be undone."
            confirmLabel="Delete"
            danger
            onCancel={() => setConfirming(null)}
            onConfirm={() => {
              save(campaigns.filter(c => c.id !== confirming.target.id));
              setConfirming(null);
            }}
          />
        ) : (
          <ConfirmDialog
            title={`Unpublish “${confirming.target.name || 'this popup'}”?`}
            body="It stops showing on the client right away and goes back to draft. You can publish it again at any time."
            confirmLabel="Unpublish"
            onCancel={() => setConfirming(null)}
            onConfirm={() => {
              setPublished(confirming.target, false);
              setConfirming(null);
            }}
          />
        ))}

      <div className="flex">
        <AdminSidebar view="campaigns" />
      <main className="min-w-0 flex-1 px-6 py-10">
        <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">Campaign settings</h1>
            <p className="mt-1 text-sm text-[#6a6b7b]">
              Promotions, model launches and feature launches — popup, pricing card and top banner in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => open('new')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2.5 text-sm font-bold text-white">
              <Plus className="size-4" /> New popup
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
              placeholder="Search popups"
              className="w-full bg-transparent text-sm text-[#1a1a2e] outline-none placeholder:text-[#a3a3ae]"
            />
          </div>
        </div>

        {/* 窄屏让表格自己横向滚,否则整页会横向溢出;lg 以上不裁,tooltip 才能溢出容器。
            (overflow-x-auto 会同时裁纵向,所以只能按断点二选一 —— 窄屏保页面不歪,宽屏保 tooltip) */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#ececf1] bg-white lg:overflow-x-visible">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#faf8f6] text-[11px] uppercase tracking-wider text-[#9a9aa6] [&_th:first-child]:rounded-tl-2xl [&_th:last-child]:rounded-tr-2xl">
              <tr>
                <th className="px-5 py-3 font-bold">Campaign</th>
                <th className="px-5 py-3 font-bold">Type</th>
                <th className="px-5 py-3 font-bold">Priority</th>
                <th className="px-5 py-3 font-bold">Schedule</th>
                <th className="px-5 py-3 font-bold">Placement</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, status }) => (
                <tr
                  key={c.id}
                  onClick={() => open(c.id)}
                  className="cursor-pointer border-t border-[#f1f1f4] transition hover:bg-[#fffaf7]"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#1a1a2e]">{c.name || '(untitled)'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_STYLE[c.kind]}`}>
                      {KIND_LABEL[c.kind]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold tabular-nums text-[#1a1a2e]">{c.priority}</span>
                    {showingId === c.id && (
                      <span className="ml-2 inline-flex rounded-full bg-[#1a1a2e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Showing now
                      </span>
                    )}
                  </td>
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
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-0.5">
                      <IconAction label="Edit" onClick={() => open(c.id)}>
                        <Pencil className="size-4" />
                      </IconAction>
                      <IconAction label="Duplicate as a new draft" onClick={() => duplicate(c)}>
                        <Copy className="size-4" />
                      </IconAction>
                      <IconAction
                        label={c.published ? 'Unpublish — back to draft' : 'Publish'}
                        onClick={() => togglePublish(c)}
                      >
                        <Power className="size-4" />
                      </IconAction>
                      <IconAction label="Delete permanently" danger onClick={() => remove(c)}>
                        <Trash2 className="size-4" />
                      </IconAction>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm font-semibold text-[#1a1a2e]">No popups yet.</p>
                    <p className="mt-1 text-[13px] text-[#6a6b7b]">
                      Create one, publish it, then open it on the client to see it live.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        </div>

        </main>
      </div>
    </div>
  );
}
