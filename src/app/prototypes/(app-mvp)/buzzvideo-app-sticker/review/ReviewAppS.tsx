"use client";

import { useEffect, useState } from "react";
import { ChevronRight, RotateCcw, TriangleAlert } from "lucide-react";
import { INITIAL_STATE } from "../../buzzvideo-app/app/store";
import { JOURNEYS as V1_JOURNEYS } from "../../buzzvideo-app/review/journeys";
import { INITIAL_STATE_FUN, funReducer, stickerPreset } from "../app/presets";
import { Phone } from "../../buzzvideo-app/shell/Shell";
import AppS from "../app/AppS";
import { INITIAL2, Provider2, useCredits, useV2, type State2 } from "../app/store";
import { AppProvider } from "../app/v1";
import { ALL_STEPS, GROUPS, type Step } from "./journeys";
import FlowPage from "../journey/FlowPageS";

/** 完整用户旅程图(一页、分组)也放在评审原型里：左栏最上面一项，网址 #journey */
const MAP_ID = "journey";

const NAV_W = 288;
const STATES_W = 320;

const tint = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** 左栏:按用户旅程排的两级菜单，一级带模块色 */
function Nav({ current, onSelect, onMap }: { current: string; onSelect: (s: Step) => void; onMap: () => void }) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  return (
    <nav className="hide-scrollbars fixed inset-y-0 left-0 overflow-y-auto border-r border-stone-200 bg-white px-3 py-4" style={{ width: NAV_W }}>
      <div className="px-2 pb-3">
        <div className="text-[15px] font-semibold text-stone-900">BuzzVideo APP · 新版设计</div>
        <div className="mt-0.5 text-[12px] text-stone-500">社交 APP 设计视角 · 评审原型</div>
        <a href="/prototypes/buzzvideo-app-sticker/kit" className="mt-2 inline-block text-[12px] font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">组件库 →</a>
      </div>
      <button
        type="button"
        onClick={onMap}
        aria-current={current === MAP_ID}
        className={`mb-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${current === MAP_ID ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-800 hover:bg-stone-200"}`}
      >
        <span className="text-[15px]">🗺</span>
        <span className="flex-1">完整用户旅程图</span>
        <span className={`text-[11px] font-normal ${current === MAP_ID ? "text-white/60" : "text-stone-400"}`}>8 组</span>
      </button>
      {GROUPS.map((g) => {
        const open = !closed.has(g.label);
        return (
          <div key={g.label} className="mb-2 rounded-xl" style={{ background: tint(g.color, 0.06) }}>
            <button
              type="button"
              onClick={() => setClosed((p) => { const n = new Set(p); if (n.has(g.label)) n.delete(g.label); else n.add(g.label); return n; })}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              aria-expanded={open}
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
              <span className="flex-1 text-[13px] font-semibold" style={{ color: g.color }}>
                {g.label}
              </span>
              <span className="text-[11px] text-stone-400">{g.steps.length}</span>
              <ChevronRight size={14} className={`text-stone-400 transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
            {open ? (
              <div className="px-1.5 pb-1.5">
                {g.steps.map((s) => {
                  const on = s.id === current;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect(s)}
                      aria-current={on}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${on ? "bg-white font-semibold text-stone-900 shadow-sm" : "text-stone-600 hover:bg-white/70"}`}
                      style={on ? { boxShadow: `inset 3px 0 0 ${g.color}, 0 1px 2px rgba(0,0,0,0.06)` } : undefined}
                    >
                      {s.title}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function Seg<T extends string | number | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-[13px] text-stone-600">{label}</span>
      <div className="flex rounded-lg bg-stone-100 p-0.5">
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)} aria-pressed={v === value} className={`rounded-md px-2.5 py-1 text-[12px] ${v === value ? "bg-white font-semibold text-stone-900 shadow-sm" : "text-stone-500"}`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 手机右侧:演示状态(直接改第二版的状态，手机里马上反映) */
function States({ step, onReplay }: { step: Step; onReplay: () => void }) {
  const { s, d } = useV2();
  const credits = useCredits();
  const patch = (p: Partial<State2>) => d({ type: "demo", patch: p });
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-stone-900">演示状态</div>
        <button type="button" onClick={onReplay} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-stone-500 hover:bg-stone-100">
          <RotateCcw size={12} /> 重置这一步
        </button>
      </div>
      <div className="mt-1 text-[12px] text-stone-500">当前:{step.title}。切换下面的状态看各种情况，手机里也可以自由点。</div>
      <div className="mt-3 divide-y divide-stone-100">
        <Seg label="今日签到" value={s.claimedToday} options={[[false, "未到账"], [true, "已到账"]]} onChange={(v) => patch({ claimedToday: v, banner: null })} />
        <Seg label="发作品火苗" value={s.postStreak} options={[[0, "0 天"], [6, "6 天"], [12, "12 天"]]} onChange={(v) => patch({ postStreak: v })} />
        <Seg label="连续签到" value={s.streak} options={[[0, "0 天"], [2, "2 天"], [6, "6 天"]]} onChange={(v) => patch({ streak: v, claimedToday: false })} />
        <Seg label="分身" value={s.twin} options={[["none", "没建"], ["ready", "已建好"]]} onChange={(v) => patch({ twin: v })} />
        <Seg label="关注的人" value={s.follows.length > 0} options={[[false, "没有"], [true, "有"]]} onChange={(v) => patch({ follows: v ? ["mochi", "oddhistory"] : [] })} />
        <Seg label="新手提示" value={s.coach} options={[[true, "显示"], [false, "不显示"]]} onChange={(v) => patch({ coach: v })} />
        <Seg label="积分" value={credits < 20} options={[[false, "够用"], [true, "不足"]]} onChange={(v) => patch({ spent: v ? 100000 : 0 })} />
      </div>
      <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-[12px] text-stone-500">当前积分 {credits.toLocaleString("en-US")} · 已发布 {s.posts.length} · 草稿 {s.jobs.length} · 火苗 {s.postStreak} 天</div>
    </div>
  );
}

/** 手机下方:PM 式交互说明(功能说明 + 异常与边界) */
function Notes({ step, color }: { step: Step; color: string }) {
  return (
    <section className="border-t border-stone-200 bg-white px-10 py-8">
      <div className="mx-auto max-w-[920px]">
        <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          交互说明
        </div>
        <h2 className="mt-1 text-[22px] font-semibold text-stone-900">{step.title}</h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <div className="text-[13px] font-semibold text-stone-900">功能说明</div>
            <ol className="mt-2 space-y-2">
              {step.notes.map((n, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-6 text-stone-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-500">{i + 1}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-900">
              <TriangleAlert size={14} className="text-amber-600" /> 异常与边界
            </div>
            {step.edge?.length ? (
              <ul className="mt-2 space-y-2">
                {step.edge.map((n, i) => (
                  <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-[14px] leading-6 text-amber-950">
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-[14px] text-stone-400">这一屏没有特殊情况。</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 第二版评审原型:左栏旅程菜单 · 中间真机 · 右侧演示状态 · 下方交互说明(评审原型标准结构)。
 * 点一步旅程 = 用该步的预置状态重新挂载 APP(key 变化)。手机里跑的和开发原型是同一份 ../app
 */
export default function ReviewAppS() {
  // 没带 # 时先看完整用户旅程图(评审主讲材料)
  const [id, setId] = useState(MAP_ID);
  const [run, setRun] = useState(0);
  // 网址里的 #步骤 id 可以直接打开某一步(方便发链接);改 # 也会跟着跳
  useEffect(() => {
    const sync = () => {
      const h = location.hash.slice(1);
      if (h === MAP_ID || ALL_STEPS.some((s) => s.id === h)) {
        setId(h);
        setRun((r) => r + 1);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const step = ALL_STEPS.find((s) => s.id === id) ?? ALL_STEPS[0];
  const go = (s: Step) => {
    setId(s.id);
    setRun((r) => r + 1);
    history.replaceState(null, "", `#${s.id}`);
  };
  const openMap = () => {
    setId(MAP_ID);
    history.replaceState(null, "", `#${MAP_ID}`);
  };
  // 借第一版的步骤(登录 / 付费 / 设置):用第一版评审原型那一步的预置状态和页面
  const v1j = step.v1 ? V1_JOURNEYS.find((x) => x.id === step.v1) : undefined;
  const v1p = v1j ? stickerPreset(v1j, step.v1Extra) : null;
  const v1State = v1p ? v1p.state : step.auth === "out" ? INITIAL_STATE_FUN() : { ...INITIAL_STATE_FUN(), signedIn: true, onboarded: true, aiConsent: true, paywallShownDay: 0 };
  if (id === MAP_ID)
    return (
      <div className="font-sans">
        <Nav current={id} onSelect={go} onMap={openMap} />
        {/* 旅程图是一整块可缩放、拖动的画布;点截图进入评审原型的那一步(借第一版的登录 / 付费 / 创作截图没有对应步骤，不跳) */}
        <main className="grid h-screen" style={{ marginLeft: NAV_W, gridTemplateRows: "minmax(0, 1fr)" }}>
          <FlowPage
            onSelect={(j) => {
              const s = j.review ? ALL_STEPS.find((x) => x.id === j.review) : undefined;
              if (s) go(s);
            }}
          />
        </main>
      </div>
    );
  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      <Nav current={id} onSelect={go} onMap={openMap} />
      <main style={{ marginLeft: NAV_W }}>
        <AppProvider key={`${id}-${run}`} reducer={funReducer} initialState={v1State} initialNav={v1p?.nav}>
          <Provider2 initial={{ ...INITIAL2, ...step.preset }}>
            <div className="grid min-h-screen content-center items-center gap-8 px-8 py-6" style={{ gridTemplateColumns: `minmax(0, 1fr) ${STATES_W}px` }}>
              <Phone initialPhase={step.auth === "out" && !step.v1 ? "home" : "app"} reserveW={NAV_W + STATES_W + 96} reserveH={8} app={<AppS />} />
              <States step={step} onReplay={() => setRun((r) => r + 1)} />
            </div>
          </Provider2>
        </AppProvider>
        <Notes step={step} color={step.group.color} />
      </main>
    </div>
  );
}
