"use client";

/* 2026-11-27 Monica:Marketing Agent 首屏「要改成 3d to video 和 canvas 这样的 hero」——居中大标题 + 说明 + 按钮，下面一整块产品演示。
   演示流程(Monica:「也是一句话，AI 给 3 个方案，用户选择，然后 agent 根据用户选择出脚本等等，然后生成，然后给结果，然后大屏预览结果」,
   对应 2026-10-14 hybrid-reel Agent 设计里的「A/B/C 三版方案卡 → 确认 → Agent 跑完 → 交回成片」):
   ① 输入框带产品图 + 模特图，打一句话(要 9:16 和 16:9)→ ② Agent 给 3 个方向(A/B/C 卡片)→ ③ 光标点选 B → ④ Agent 按 B 写分镜脚本 → ⑤ 逐项生成 → ⑥ 对话里出成片卡 → ⑦ 大屏预览。
   素材来自 UAT 画布的 AURELIA 项目。约 28 秒一轮，循环;减少动态效果时停在大屏预览。 */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Check, Download, Expand, FileText, Loader2, MousePointer2, Paperclip } from "lucide-react";
import { OA_CTA, OA_WRAP } from "../oa/kit";

/* 2026-11-27 Monica:「markting agent 用这个」——UAT 画布 384612351330017280 的 AURELIA 项目(产品图 + 模特 Brooke Palmer → 两张生成图 → 16:9 和 9:16 两条成片);
   「prompt 里说我要出 9:16,16:9，表示同时出不同尺寸」。素材已下载压缩到 public/prototypes/site/pages/marketing-agent/aurelia/ */
const AU = "/prototypes/site/pages/marketing-agent/aurelia";
const BRIEF = "Make a 15s launch ad for AURELIA serum and cream with Brooke as the model. I need 9:16 and 16:9.";
const REFS = [
  { src: `${AU}/product.webp`, alt: "AURELIA serum and cream product photo attached to the brief" },
  { src: `${AU}/model.webp`, alt: "Portrait of the model Brooke attached to the brief" },
];
const OPTIONS = [
  { k: "A", title: "Close-up glow", hook: "Brooke presses in one golden drop.", fmt: "Beauty close-up · 15s", poster: `${AU}/img-sq.webp` },
  { k: "B", title: "Golden hour ritual", hook: "Sunset lake, the product, then Brooke.", fmt: "Luxury film · 15s", poster: `${AU}/img-wide.webp` },
  { k: "C", title: "Liquid gold", hook: "Gold drops burst into skin science.", fmt: "Product macro · 15s", poster: `${AU}/gold.webp` },
];
const SCRIPT = [
  { t: "0–3s", shot: "Serum and cream on sunlit rock by the lake; a gold drop falls from the dropper." },
  { t: "3–6s", shot: "Macro: liquid gold drops drift and burst." },
  { t: "6–11s", shot: "Close-up of Brooke's skin as her fingertips press the serum in." },
  { t: "11–15s", shot: "Brooke at golden hour with both products. End card: AURELIA Skin Rituals." },
];
const GEN = ["16:9 shots · Seedance 2.5", "9:16 shots · Seedance 2.5", "Music + sound", "End card + logo"];
const SIZES = [
  { r: "16:9", src: `${AU}/v169.mp4`, poster: `${AU}/v169.webp`, alt: "AURELIA launch ad in 16:9: the serum and cream at a sunset lake, liquid gold, Brooke's glowing skin and the end card" },
  { r: "9:16", src: `${AU}/v916.mp4`, poster: `${AU}/v916.webp`, alt: "The same AURELIA ad cut in 9:16 for Reels and TikTok" },
];
const PICK = { title: "Golden hour ritual", spec: "Seedance 2.5 · 16:9 + 9:16 · 15s" }; /* Monica:模型是 Seedance 2.5 */

type Phase = "brief" | "think" | "options" | "pick" | "script" | "gen" | "result" | "preview";
const DUR: Record<Phase, number> = { brief: 600 + BRIEF.length * 32 + 800, think: 1300, options: 2600, pick: 1700, script: 3600, gen: 3400, result: 1600, preview: 15500 } /* 2026-11-27 Monica「播放完吧」:成片 15s 完整播完再循环 */;
const ORDER: Phase[] = ["brief", "think", "options", "pick", "script", "gen", "result", "preview"];

function Agent({ children }: { children: React.ReactNode }) {
  return (
    /* 2026-11-27 Monica 划掉 Agent 消息前的头像：只留内容 */
    <div className="min-w-0">{children}</div>
  );
}

function AgentDemo() {
  const [phase, setPhase] = useState<Phase>("brief");
  const [t, setT] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { const id = requestAnimationFrame(() => setPhase("preview")); return () => cancelAnimationFrame(id); }
    let raf = 0, start = performance.now(), ph: Phase = "brief", on = true;
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) start = performance.now(); }, { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    const tick = (now: number) => {
      if (on) {
        let el = now - start;
        if (el > DUR[ph]) {
          ph = ORDER[(ORDER.indexOf(ph) + 1) % ORDER.length];
          start = now; el = 0;
          setPhase(ph);
          if (ph === "preview") vids.current.forEach((v) => { if (v) { v.currentTime = 0; v.play().catch(() => {}); } });
        }
        setT(el);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const i = ORDER.indexOf(phase);
  const past = (p: Phase) => i > ORDER.indexOf(p);
  const at = (p: Phase) => i >= ORDER.indexOf(p);
  const typed = phase === "brief" ? BRIEF.slice(0, Math.max(0, Math.floor((t - 600) / 32))) : "";
  const picked = past("pick") || (phase === "pick" && t > 900);
  const scriptRows = phase === "script" ? Math.min(SCRIPT.length, Math.floor((t - 500) / 650) + 1) : past("script") ? SCRIPT.length : 0;
  const genDone = phase === "gen" ? Math.floor(t / (DUR.gen / GEN.length)) : past("gen") ? GEN.length : 0;

  return (
    <div ref={box} className="overflow-hidden rounded-[24px] bg-[#141414] shadow-[0_40px_120px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.12]">
      {/* 2026-11-27 Monica 划掉顶栏(步骤标签 + Marketing Agent 字样):演示窗口直接从项目栏和对话开始 */}

      <div className="relative flex h-[min(620px,calc(100svh-120px))] min-h-[460px]">
        {/* 左：项目栏 */}
        <aside className="hidden w-[210px] shrink-0 flex-col gap-1 border-r border-white/[0.07] bg-[#171717] p-3 lg:flex">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">Projects</p>
          {["AURELIA launch", "Spring sale · Reels", "PAWLY always-on", "Bakery weekend ads"].map((n, k) => (
            <span key={n} className={`truncate rounded-lg px-2.5 py-2 text-[12.5px] ${k === 0 ? "bg-white/[0.08] font-semibold text-white" : "text-white/55"}`}>{n}</span>
          ))}
        </aside>

        {/* 中：对话 */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-end gap-4 overflow-hidden px-4 pb-3 pt-6 md:px-8">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
              {past("brief") && (
                <div className="ml-auto flex max-w-[80%] flex-col items-end gap-1.5">
                  <div className="flex gap-1.5">
                    {REFS.map((r) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={r.src} src={r.src} alt={r.alt} className="size-16 rounded-xl object-cover ring-1 ring-white/10" />
                    ))}
                  </div>
                  <div className="rounded-2xl rounded-br-md bg-white/[0.09] px-4 py-2.5 text-[13.5px] text-white">{BRIEF}</div>
                </div>
              )}
              {phase === "think" && (
                <Agent>
                  <p className="flex items-center gap-2 pt-1 text-[13px] text-white/60"><Loader2 className="size-3.5 animate-spin text-[#FF744D]" /> Reading the product and model, checking what runs in luxury skincare ads…</p>
                </Agent>
              )}
              {at("options") && (
                <Agent>
                  <p className="pt-1 text-[13.5px] text-white/85">Here are 3 directions for AURELIA, each cut in 9:16 and 16:9. Pick one and I&apos;ll write the script.</p>
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {OPTIONS.map((o, k) => {
                      const sel = picked && o.k === "B";
                      const dim = picked && o.k !== "B";
                      const shown = phase !== "options" || t > k * 260;
                      return (
                        <div key={o.k} className={`relative overflow-hidden rounded-xl bg-white/[0.04] ring-1 transition-all duration-500 ${sel ? "ring-2 ring-[#FF744D]" : "ring-white/10"} ${dim ? "opacity-40" : ""} ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={o.poster} alt="" className="aspect-[4/3] w-full object-cover object-[50%_30%]" />
                          <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-black/60 text-[10.5px] font-bold text-white backdrop-blur">{o.k}</span>
                          {sel && <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[#FF744D] text-white"><Check className="size-3" /></span>}
                          <div className="p-2.5">
                            <p className="truncate text-[12.5px] font-bold text-white">{o.title}</p>
                            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-white/55">{o.hook}</p>
                            <p className="mt-1.5 hidden text-[10.5px] font-semibold text-white/45 md:block">{o.fmt} · Seedance 2.5</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Agent>
              )}
              {at("script") && (
                <>
                  <div className="ml-auto rounded-2xl rounded-br-md bg-white/[0.09] px-4 py-2.5 text-[13.5px] text-white">Go with B.</div>
                  <Agent>
                    <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
                      <p className="flex items-center gap-2 text-[12.5px] font-bold text-white"><FileText className="size-3.5 text-[#FF744D]" /> Script · {PICK.title} <span className="ml-auto text-[11px] font-semibold text-white/45">{PICK.spec}</span></p>
                      <ol className="mt-2.5 space-y-1.5">
                        {SCRIPT.slice(0, scriptRows).map((r) => (
                          <li key={r.t} className="flex gap-3 text-[12.5px] leading-snug">
                            <span className="w-11 shrink-0 tabular-nums text-[#FF9A73]">{r.t}</span>
                            <span className="text-white/80">{r.shot}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Agent>
                </>
              )}
              {at("gen") && (
                <Agent>
                  {phase === "gen" ? (
                    <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
                      <p className="text-[12.5px] font-bold text-white">Generating 2 sizes…</p>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" style={{ width: `${Math.min(100, (t / DUR.gen) * 100)}%` }} /></div>
                      <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
                        {GEN.map((g, k) => (
                          <li key={g} className={`flex items-center gap-1.5 text-[12px] ${k < genDone ? "text-white/80" : "text-white/35"}`}>
                            {k < genDone ? <Check className="size-3.5 text-[#3DD68C]" /> : k === genDone ? <Loader2 className="size-3.5 animate-spin text-[#FF744D]" /> : <span className="size-3.5" />} {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/10">
                      <div className="flex items-end gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={SIZES[0].poster} alt="" className="aspect-video w-28 rounded-lg object-cover" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={SIZES[1].poster} alt="" className="aspect-[9/16] w-9 rounded-md object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-white">Your ads are ready</p>
                        <p className="text-[11.5px] text-white/50">{PICK.title} · Seedance 2.5 · 16:9 + 9:16</p>
                        <div className="mt-2 flex gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${phase === "result" && t > 900 ? "bg-[#FF744D] text-white" : "bg-white/10 text-white/80"}`}><Expand className="size-3" /> Preview</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80"><Download className="size-3" /> Download</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Agent>
              )}
            </div>
          </div>

          {/* 输入框 */}
          <div className="px-4 pb-4 md:px-8">
            <div className="mx-auto max-w-[760px] rounded-2xl bg-[#1e1e1e] p-2.5 ring-1 ring-white/10">
              {/* 2026-11-27 Monica「也不要有上传那个，直接就是出现图，写 prompt」:附图直接在，不放上传进度和文件名 */}
              {phase === "brief" && (
                <div className="mb-2 flex gap-1.5 px-1">
                  {REFS.map((r) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={r.src} src={r.src} alt="" className="size-12 rounded-lg object-cover ring-1 ring-white/15" />
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
              <Paperclip className="mb-1.5 ml-1 size-4 shrink-0 text-white/40" />
              <p className="min-h-[22px] flex-1 py-1 text-[13.5px] text-white">
                {phase === "brief" ? typed : <span className="text-white/35">Reply to the agent…</span>}
                {phase === "brief" && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#FF744D] align-middle" />}
              </p>
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white"><ArrowUp className="size-4" /></span>
              </div>
            </div>
          </div>

          {/* 选方案时的光标 */}
          {phase === "pick" && (
            <MousePointer2 aria-hidden className="pointer-events-none absolute z-20 size-6 fill-white text-black drop-shadow transition-all duration-700 ease-out" style={{ left: t > 150 ? "50%" : "70%", top: t > 150 ? "52%" : "80%" }} />
          )}
        </div>

        {/* 大屏预览 */}
        <div className={`absolute inset-0 z-30 bg-black transition-all duration-700 ${phase === "preview" ? "scale-100 opacity-100" : "pointer-events-none scale-[0.96] opacity-0"}`}>
          {/* 两个尺寸同时出：16:9 和 9:16 并排播放 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SIZES[0].poster} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 px-4 pb-16 pt-14 md:flex-row md:gap-6 md:px-10">
            {SIZES.map((z, k) => (
              <figure key={z.r} className={`relative overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/15 ${k === 0 ? "aspect-video w-full shrink-0 md:h-full md:w-auto md:max-w-[75%]" : "aspect-[9/16] min-h-0 flex-1 md:h-full md:flex-none"}`}>
                <video ref={(el) => { vids.current[k] = el; }} src={z.src} poster={z.poster} muted loop playsInline preload="metadata" aria-label={z.alt} className="size-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">{z.r}</span>
              </figure>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-4">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">{PICK.title}</span>
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-semibold text-white/80 backdrop-blur">{PICK.spec}</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-black/75 to-transparent p-4">
            {["16:9", "9:16"].map((r) => (
              <span key={r} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#240A03]">{r}</span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3.5 py-1.5 text-[12.5px] font-bold text-white"><Download className="size-3.5" /> Export both</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketingAgentHero({ title, lead, onStart }: { title: string; lead: string; onStart: () => void }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-[96px] md:pb-24 md:pt-[104px]">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[min(1100px,90vw)] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
      <div className={`${OA_WRAP} text-center`}>
        <h1 className="mx-auto max-w-[min(1320px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(44px,calc(24px+4.6vw),112px)]">
          <span className="block">{title}</span>
          <span className="mt-2 block text-[clamp(24px,calc(12px+2.4vw),56px)] leading-[1] tracking-[-0.02em] text-[#FF744D]">One brief in, finished ads out</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-[15px] leading-[24px] text-white/75 [text-wrap:pretty] md:text-[16px] md:leading-[26px]">{lead}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onStart} className={`${OA_CTA} px-6 py-3.5`}>
            Brief the agent <ArrowRight className="size-4" />
          </button>
          <a href="#features" className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-[15px] font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15">
            See how it works
          </a>
        </div>
      </div>
      <div className="mx-auto mt-12 w-[min(1320px,calc(100vw-32px))] md:mt-14">
        <AgentDemo />
      </div>
    </section>
  );
}
