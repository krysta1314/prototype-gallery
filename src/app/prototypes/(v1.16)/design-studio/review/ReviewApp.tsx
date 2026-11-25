"use client";

/* Design Studio · 评审原型(结构照 video-gen-modes 的 ReviewApp):
   顶部黑色演示条(视图 / 套餐 / 角色 / 审批 / 余额 / 重来),中间是可直接点的产品，下方白底区是当前视图的 PM 式交互说明(可收起)。
   套餐等切换不重新挂载产品，当前页面立刻按新套餐生效;切视图或「重来」才重新挂载。网址 ?v=<视图>。
   演示条和说明是中文，产品里一律英文。 */

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Link2, RotateCcw, TriangleAlert } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { DesignStudioApp, DEFAULT_DEMO, type DemoState } from "../app/DesignStudioApp";
import { PLAN_LABEL, PLANS, isEnterprise, type Plan } from "../app/entitlements";
import type { Route } from "../app/studio/StudioRoot";
import { NOTES, VIEW_LABEL, VIEWS, type ReviewView } from "./notes";

const PANEL_KEY = "design-studio:review-panel-collapsed";

const ROUTE_OF: Record<ReviewView, Route | null> = {
  buzz: null,
  image: { tab: "image" },
  brand: { tab: "brand" },
  decks: { tab: "decks" },
  sites: { tab: "sites" },
  projects: { tab: "projects" },
};
const viewOf = (r: Route | null): ReviewView => (r ? r.tab : "buzz");

type Balance = "normal" | "low" | "cap";

function NotesPanel({ view, onCollapse }: { view: ReviewView; onCollapse: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <section className="flex h-[min(360px,42dvh)] shrink-0 flex-col border-t border-[#ececf1] bg-white" aria-label="交互说明">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#f1f1f4] px-4 py-2.5 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#ff5e1a]">交互说明 · {VIEW_LABEL[view]}</p>
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(window.location.href)
              .then(() => setCopied(true))
              .catch(() => {})
          }
          className="inline-flex items-center gap-1 rounded-full border border-[#ececf1] bg-white px-3 py-1 text-[12.5px] text-[#4a4b5c] transition hover:text-[#1a1a2e]"
        >
          {copied ? <Check className="size-3.5 text-[#16a34a]" /> : <Link2 className="size-3.5" />} {copied ? "已复制" : "复制链接"}
        </button>
        <button type="button" onClick={onCollapse} aria-label="收起交互说明" className="grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
          <ChevronDown className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 divide-y divide-[#f1f1f4] overflow-y-auto overscroll-contain px-4 sm:px-6">
        {NOTES[view].map((n) => (
          <article key={n.title} className="grid gap-x-10 gap-y-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="space-y-2.5">
              <h3 className="text-[13.5px] font-bold text-[#1a1a2e]">{n.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#1a1a2e]">{n.what}</p>
              <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-[#1a1a2e]">
                {n.rules.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            {n.errors?.length ? (
              <div className="lg:pt-7">
                <p className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-[#d24f14]">
                  <TriangleAlert className="size-3.5" /> 异常情况
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-[#1a1a2e]">
                  {n.errors.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-2">
      <span className="text-[12.5px] text-white/60">{label}</span>
      <div className="flex rounded-full bg-white/10 p-0.5">
        {options.map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={`rounded-full px-3 py-1 text-[12.5px] font-semibold transition ${value === k ? "bg-white text-[#141414]" : "text-white/60 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewApp() {
  const [view, setView] = useState<ReviewView>("image");
  const [shown, setShown] = useState<ReviewView>("image");
  const [run, setRun] = useState(0);
  const [panel, setPanelState] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<Plan>(DEFAULT_DEMO.plan);
  const [role, setRole] = useState(DEFAULT_DEMO.role);
  const [approvals, setApprovals] = useState(false);
  const [bal, setBal] = useState<Balance>("normal");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v") as ReviewView | null;
    if (v && VIEWS.includes(v)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(v);
      setShown(v);
    }
    const p = q.get("plan") as Plan | null;
    if (p && PLANS.includes(p)) setPlan(p);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(PANEL_KEY);
    } catch {
      /* 存储不可用 */
    }
    setPanelState(stored === null ? !window.matchMedia("(max-width: 639px)").matches : stored !== "1");
  }, []);

  const go = (v: ReviewView) => {
    setView(v);
    setShown(v);
    setRun((r) => r + 1);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("v", v);
      window.history.replaceState(null, "", url);
    } catch {
      /* 改不了网址就算了 */
    }
  };
  const setPanel = (open: boolean) => {
    try {
      localStorage.setItem(PANEL_KEY, open ? "0" : "1");
    } catch {
      /* 存储不可用 */
    }
    setPanelState(open);
  };

  /* 审批和个人额度是 Enterprise 的东西：选了非 Enterprise 套餐时提示 */
  const ent = isEnterprise(plan);
  const demo: DemoState = {
    plan,
    role,
    approvalsOn: approvals,
    balance: bal === "low" ? 8 : 1240,
    capLeft: bal === "cap" ? 5 : null,
  };

  if (panel === null) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <style>{`.review-product { transform: translateZ(0); }`}</style>
      <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-[#141414] px-4 py-1.5">
        <span className="text-[13px] font-semibold text-white">演示状态切换</span>
        <div role="tablist" aria-label="演示视图" className="flex flex-wrap rounded-full bg-white/10 p-0.5">
          {VIEWS.map((v) => (
            <button key={v} type="button" role="tab" aria-selected={v === view} onClick={() => go(v)} className={`rounded-full px-3 py-1 text-[12.5px] font-semibold transition ${v === view ? "bg-white text-[#141414]" : "text-white/60 hover:text-white"}`}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-white/60">套餐</span>
          <div className="w-[150px] shrink-0"><DropdownSelect label="套餐" size="md" value={plan} onChange={setPlan} options={PLANS.map((p) => ({ value: p, label: PLAN_LABEL[p] }))} /></div>
        </div>
        <Seg label="角色" value={role} onChange={setRole} options={[["admin", "Admin"], ["member", "Member"]] as const} />
        <Seg label={ent ? "审批" : "审批(E1+)"} value={approvals ? "on" : "off"} onChange={(v) => setApprovals(v === "on")} options={[["off", "关"], ["on", "开"]] as const} />
        <Seg label="余额" value={bal} onChange={setBal} options={[["normal", "正常"], ["low", "不足"], ["cap", "个人额度用完"]] as const} />
        <button type="button" onClick={() => setRun((r) => r + 1)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[12.5px] text-white/75 transition hover:bg-white/10 hover:text-white">
          <RotateCcw className="size-3.5" /> 重来
        </button>
      </div>
      {approvals && !ent && <p className="shrink-0 bg-[#fff7f1] px-4 py-1 text-[12px] text-[#b45309]">审批只在 Enterprise 生效：把套餐切到 Enterprise E1 以上才会看到审批流程。</p>}
      <div className="review-product min-h-0 flex-1 overflow-hidden">
        <DesignStudioApp key={`${view}-${run}`} fill demo={demo} initialRoute={ROUTE_OF[view]} onRoute={(r) => setShown(viewOf(r))} />
      </div>
      {panel ? (
        <NotesPanel view={shown} onCollapse={() => setPanel(false)} />
      ) : (
        <button type="button" onClick={() => setPanel(true)} aria-label="展开交互说明" className="flex h-9 shrink-0 items-center gap-2 border-t border-[#ececf1] bg-white px-4 text-left text-[12px] font-semibold text-[#9a9bb0] transition hover:text-[#1a1a2e] sm:h-8 sm:px-6">
          <ChevronUp className="size-4" />
          展开交互说明 · {VIEW_LABEL[shown]}
        </button>
      )}
    </div>
  );
}
