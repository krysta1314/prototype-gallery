"use client";

/* 2026-11-27 Monica:3D to Video 首屏「这里视频内容是：1. 一句话打出去，比如 GTA 游戏那个风格 2. 然后 3D 建模开始，一点一点搭建
   3. 然后再打一句话要编辑 4. 然后演示成片」→ 一个循环播放的产品演示(约 28 秒一轮)。
   2026-11-27 Monica 圈出第 2 步「不是这样出来的，而是像 blender 一样在这个工作室里面一点一点绘制 3D」——
   第 2 步改成真的 3D 工作室视口(Three.js):Blender 式深灰网格视口 + 左侧工具栏 + 右侧大纲(Outliner),
   马路、人行道、楼、棕榈树、路灯、跑车按顺序一个个加进场景，每加一个被选中(橙色描边 + 移动轴),大纲同步多一行。
   第 3 步编辑：粉色霓虹亮起、加跟拍摄像机和轨迹，跑车往前开。第 4 步渲染进度 → 成片(本页「Sports car street run」那组成片)。
   减少动态效果时直接停在成片。 */
import { useEffect, useRef, useState } from "react";
import { Box, Camera, Eye, Lightbulb, MousePointer2, Move, RotateCw, Scaling, Sparkles } from "lucide-react";
import type { BuildItem } from "./three-d-build-scene";

const PG = "/prototypes/site/pages/3d-to-video";
const P1 = "A red 90s sports car drifts down a neon Miami street at sunset, palm trees, wet asphalt, open-world game style.";
const P2 = "Make it dusk with pink neon, add a low tracking shot that follows the car.";
const CH = 34; /* 每个字的打字毫秒 */
const BUILD = 9000;
const APPLY = 3000;
type Phase = "type1" | "build" | "type2" | "render" | "final";
const STEPS: { k: Phase; label: string }[] = [
  { k: "type1", label: "Describe" },
  { k: "build", label: "Build in 3D" },
  { k: "type2", label: "Edit" },
  { k: "render", label: "Render" },
];
const TOOLS = [MousePointer2, Move, RotateCw, Scaling, Box, Lightbulb, Camera];

export function ThreeDBuildDemo() {
  const [phase, setPhase] = useState<Phase>("type1");
  const [t, setT] = useState(0); /* 当前阶段内的毫秒 */
  const [items, setItems] = useState<BuildItem[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fin = useRef<HTMLVideoElement>(null);
  const st = useRef({ build: 0, edit: 0 });

  /* Three.js 视口(只在浏览器里加载) */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dispose: (() => void) | undefined, dead = false;
    import("./three-d-build-scene").then(({ createBuildScene }) => {
      if (dead || !cv.current) return;
      const s = createBuildScene(cv.current, st.current);
      setItems(s.items);
      dispose = s.dispose;
    });
    return () => { dead = true; dispose?.(); };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase("final"); return; }
    let raf = 0, start = performance.now(), ph: Phase = "type1", on = true;
    const DUR: Record<Phase, number> = { type1: P1.length * CH + 900, build: BUILD, type2: P2.length * CH + 600 + APPLY, render: 1800, final: 8000 };
    const ORDER: Phase[] = ["type1", "build", "type2", "render", "final"];
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) start = performance.now(); }, { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    const tick = (now: number) => {
      if (on) {
        let el = now - start;
        if (el > DUR[ph]) {
          ph = ORDER[(ORDER.indexOf(ph) + 1) % ORDER.length];
          start = now; el = 0;
          setPhase(ph);
          if (ph === "final" && fin.current) { fin.current.currentTime = 0; fin.current.play().catch(() => {}); }
        }
        setT(el);
        const s = st.current;
        s.build = ph === "type1" ? 0 : ph === "build" ? Math.min(1, el / (BUILD - 600)) : 1;
        s.edit = ph === "type2" ? Math.max(0, Math.min(1, (el - P2.length * CH - 600) / APPLY)) : ph === "render" || ph === "final" ? 1 : 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const typed = (s: string) => s.slice(0, Math.max(0, Math.floor(t / CH)));
  const stepIdx = phase === "final" ? 3 : STEPS.findIndex((s) => s.k === phase);
  const { build, edit } = st.current;
  const list = items.filter((x) => (x.at > 1 ? edit > 0.15 : x.at <= build));
  const current = phase === "build" || (phase === "type2" && edit > 0) ? list[list.length - 1] : undefined;
  const meshes = list.filter((x) => x.kind === "mesh").length;
  const typing2 = phase === "type2" && edit === 0;
  const prompt = phase === "type1" ? typed(P1) : phase === "type2" ? typed(P2) : phase === "build" ? P1 : P2;
  const status =
    phase === "type1" ? "Empty scene" :
    phase === "build" ? (current ? `Adding ${current.name}` : "Generating layout…") :
    phase === "type2" ? (edit > 0 ? (current ? `Editing · ${current.name}` : "Applying edit…") : `${meshes} objects · ready to edit`) :
    "Scene locked";

  return (
    <div ref={box} className="overflow-hidden rounded-[24px] bg-[#1d1d1d] shadow-[0_40px_120px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.12]">
      {/* 顶栏：步骤 + 工作室菜单 */}
      <div className="flex min-h-10 items-center gap-3 border-b border-black/60 bg-[#2b2b2b] px-3 py-2 md:h-11 md:py-0">
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s.k} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition md:text-[11.5px] ${i === stepIdx ? "bg-[#FF744D] text-white" : i < stepIdx ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/55"}`}>{i + 1} · {s.label}</span>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-4 text-[12px] text-white/55 md:flex">
          {["File", "Edit", "Add", "Object", "View"].map((m) => <span key={m}>{m}</span>)}
          <span className="flex items-center gap-1.5 rounded-md bg-black/30 px-2 py-1 font-semibold text-white/80"><Box className="size-3.5 text-[#FF744D]" /> 3D Studio</span>
        </div>
      </div>

      <div className="relative flex aspect-[4/3] md:aspect-video">
        {/* 左：工具栏 */}
        <div className="hidden w-11 shrink-0 flex-col items-center gap-1.5 border-r border-black/60 bg-[#2b2b2b] py-3 md:flex">
          {TOOLS.map((I, i) => (
            <span key={i} className={`grid size-8 place-items-center rounded-md ${(i === 1 && phase === "build") || (i === 6 && phase === "type2" && edit > 0) || (i === 4 && phase === "build" && build < 0.05) ? "bg-[#FF744D] text-white" : "text-white/60"}`}><I className="size-4" /></span>
          ))}
        </div>

        {/* 中：3D 视口 */}
        <div className="relative min-w-0 flex-1 bg-[#3a3a3a]">
          <canvas ref={cv} aria-label="BuzzVideo 3D Studio viewport where a grey 3D street scene with buildings, palm trees, street lights and a sports car is built object by object" className="absolute inset-0 size-full" />
          <span className="absolute left-3 top-3 rounded-md bg-black/35 px-2 py-1 text-[11px] font-semibold text-white/80">User Perspective · Solid</span>
          <span className="absolute bottom-3 left-3 hidden rounded-md bg-black/35 px-2 py-1 text-[11px] text-white/75 md:block">{status}</span>

          {/* 成片 */}
          <video ref={fin} src={`${PG}/use2-after.mp4`} poster={`${PG}/use2-after-poster.webp`} muted loop playsInline preload="auto" aria-label="The same shot rendered as a glossy red sports car on a neon Miami street at sunset" className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${phase === "final" ? "opacity-100" : "opacity-0"}`} />
          {phase === "final" && <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur">Seedance 2.5 · 16:9 · 8s</span>}

          {/* 渲染进度 */}
          {phase === "render" && (
            <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
              <div className="w-[min(320px,60%)] text-center text-white">
                <p className="flex items-center justify-center gap-2 text-[14px] font-semibold"><Sparkles className="size-4 text-[#FF744D]" /> Rendering with Seedance 2.5…</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#FF744D]" style={{ width: `${Math.min(100, (t / 1800) * 100)}%` }} /></div>
              </div>
            </div>
          )}

          {/* 底部输入框 */}
          <div className={`absolute inset-x-[4%] bottom-[4%] rounded-[12px] bg-[#232323]/95 p-2.5 md:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition-opacity duration-500 md:inset-x-[12%] ${phase === "final" || phase === "render" ? "opacity-0" : "opacity-100"}`}>
            <p className="text-[11.5px] leading-[17px] text-white/90 md:min-h-[40px] md:text-[13.5px] md:leading-[20px]">
              {prompt}
              {(phase === "type1" || typing2) && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#FF744D] align-middle" />}
            </p>
            <div className="mt-2 hidden items-center justify-between md:flex">
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-white/70">{phase === "type2" ? "Edit scene" : phase === "build" ? `Building · ${meshes} objects` : "3D Studio · Seedance 2.5 · 16:9"}</span>
              <span className="rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3 py-1.5 text-[12px] font-bold text-white">{phase === "type2" ? "Apply" : "Create"}</span>
            </div>
          </div>
        </div>

        {/* 右：大纲(Outliner) */}
        <div className="hidden w-[200px] shrink-0 flex-col border-l border-black/60 bg-[#2b2b2b] lg:flex">
          <p className="border-b border-black/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Outliner · Scene</p>
          <ul className="thin-scroll-dark flex-1 overflow-hidden px-1.5 py-1.5">
            {list.slice(-17).map((x) => {
              const Icon = x.kind === "camera" ? Camera : x.kind === "light" ? Lightbulb : Box;
              const on = x === current;
              return (
                <li key={x.name} className={`flex items-center gap-2 rounded px-2 py-[3px] text-[11.5px] ${on ? "bg-[#FF744D]/25 text-white" : "text-white/70"}`}>
                  <Icon className={`size-3.5 shrink-0 ${on ? "text-[#FF8A3D]" : x.kind === "mesh" ? "text-[#E8A64B]" : "text-white/55"}`} />
                  <span className="truncate">{x.name}</span>
                  <Eye className="ml-auto size-3 shrink-0 text-white/35" />
                </li>
              );
            })}
          </ul>
          <p className="border-t border-black/50 px-3 py-2 text-[11px] text-white/45">{list.length} objects · editable</p>
        </div>
      </div>
    </div>
  );
}
