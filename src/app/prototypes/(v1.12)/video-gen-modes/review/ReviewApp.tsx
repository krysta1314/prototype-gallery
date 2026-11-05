"use client";

/* 视频生成模式 · 评审原型(结构照 ai-tools 的 ReviewApp):
   顶部演示条「主页 | 画布」+ 重来;中间是可直接点的产品;
   下方白底区是这一面的 PM 式交互说明(可收起，记在 localStorage)。网址 ?v=canvas 直接开画布。
   演示条和说明是中文(不是产品界面),产品里一律英文。 */

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Link2, RotateCcw, TriangleAlert } from "lucide-react";
import { CanvasView } from "../app/CanvasView";
import { ProductApp } from "../app/ProductApp";
import { NOTES, VIEW_LABEL, type ReviewView } from "./notes";

const PANEL_KEY = "video-gen-modes:review-panel-collapsed";
/** 评审里生成得快一点(开发原型 8s) */
const DEMO_MS = 4000;
const VIEWS: ReviewView[] = ["home", "canvas"];

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* 存储不可用就只在这次生效 */
  }
}

function NotesPanel({ view, onCollapse }: { view: ReviewView; onCollapse: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  const btn = "inline-flex items-center gap-1 rounded-full border border-[#ececf1] bg-white px-3 py-1 text-[12.5px] text-[#4a4b5c] transition hover:text-[#1a1a2e]";
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
          className={btn}
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

export default function ReviewApp() {
  const [view, setView] = useState<ReviewView>("home");
  const [run, setRun] = useState(0);
  const [panel, setPanelState] = useState<boolean | null>(null);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === "canvas") setView("canvas");
    const stored = readRaw(PANEL_KEY);
    setPanelState(stored === null ? !window.matchMedia("(max-width: 639px)").matches : stored !== "1");
  }, []);

  const go = (v: ReviewView) => {
    setView(v);
    try {
      const url = new URL(window.location.href);
      if (v === "canvas") url.searchParams.set("v", v);
      else url.searchParams.delete("v");
      window.history.replaceState(null, "", url);
    } catch {
      /* 改不了网址就算了 */
    }
  };
  /* 画布里输入框：全部展开(一次看完每个模型的输入框)/ 只展开选中节点(产品行为) */
  const [composers, setComposers] = useState<"all" | "selected">("all");
  const setPanel = (open: boolean) => {
    writeFlag(PANEL_KEY, !open);
    setPanelState(open);
  };

  if (panel === null) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <style>{`.review-product { transform: translateZ(0); }`}</style>
      <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-[#141414] px-4 py-1.5">
        <span className="text-[13px] font-semibold text-white">演示状态切换</span>
        <div role="tablist" aria-label="演示视图" className="flex rounded-full bg-white/10 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === view}
              onClick={() => go(v)}
              className={`rounded-full px-4 py-1 text-[12.5px] font-semibold transition ${v === view ? "bg-white text-[#141414]" : "text-white/60 hover:text-white"}`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        {view === "canvas" && (
          <div role="radiogroup" aria-label="画布输入框" className="flex items-center gap-2">
            <span className="text-[12.5px] text-white/60">输入框</span>
            <div className="flex rounded-full bg-white/10 p-0.5">
              {(
                [
                  ["all", "全部展开"],
                  ["selected", "只看选中"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={composers === k}
                  onClick={() => setComposers(k)}
                  className={`rounded-full px-3 py-1 text-[12.5px] font-semibold transition ${composers === k ? "bg-white text-[#141414]" : "text-white/60 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[12.5px] text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-3.5" /> 重来
        </button>
      </div>
      {/* 主页一直挂着(切去画布再回来，结果和输入还在) */}
      <div className={`review-product min-h-0 flex-1 overflow-hidden ${view === "home" ? "" : "hidden"}`}>
        <ProductApp key={run} onCanvas={() => go("canvas")} generateMs={DEMO_MS} />
      </div>
      <div className={`review-product min-h-0 flex-1 overflow-hidden ${view === "canvas" ? "" : "hidden"}`}>
        <CanvasView key={run} onBack={() => go("home")} generateMs={DEMO_MS} composers={composers} />
      </div>
      {panel ? (
        <NotesPanel view={view} onCollapse={() => setPanel(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setPanel(true)}
          aria-label="展开交互说明"
          className="flex h-9 shrink-0 items-center gap-2 border-t border-[#ececf1] bg-white px-4 text-left text-[12px] font-semibold text-[#9a9bb0] transition hover:text-[#1a1a2e] sm:h-8 sm:px-6"
        >
          <ChevronUp className="size-4" />
          展开交互说明 · {VIEW_LABEL[view]}
        </button>
      )}
    </div>
  );
}
