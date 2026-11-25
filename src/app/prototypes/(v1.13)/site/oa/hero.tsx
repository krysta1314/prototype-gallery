"use client";

/* 落地页首屏(2026-11-19 Monica 从 9 个方向里选定 A · Prompt 显影):
   输入框在上，不压任何一张图;框里自动打一条真实 prompt,打完对应成片从模糊、褪色到清晰「显影」落进卡组中间，旧图往两边让;
   成片照 OpenArt AI Video Generator 首屏的 5 张正方形拼贴(新图显影在正中下方那张);用户一碰输入框就停止自动打字;点卡片把它的 prompt 填回输入框;
   只用真实成片(卡片上不标模型名，Monica 2026-11-19);「减少动态效果」时静止;不在视口 / 标签页隐藏时停。
   (其余 8 个方向 B–I 的代码见 git 历史 2026-11-19 之前未提交的版本，已删除) */

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Pic } from "./pool";
import { posterOf } from "./pool";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ar = (a?: string) => (a ?? "4:5").replace(":", " / ");

/** 视口内 + 标签页可见 才跑 */
function useActive(ref: React.RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let vis = false;
    const upd = () => setOn(vis && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      upd();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", upd);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", upd);
    };
  }, [ref]);
  return on;
}

/* 2026-11-26 Monica:「如果是视频的页面，视频要动起来」「有视频的地方，视频要自动播放」——
   首屏拼贴里的视频素材不再只放封面，直接静音循环自动播放(进入视口才播;系统开了「减少动态效果」时只显示封面)。 */
function Img({ p, className = "" }: { p: Pic; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.1 });
    io.observe(v);
    return () => io.disconnect();
  }, [p.src]);
  if (p.kind === "video")
    return <video ref={ref} src={p.src} poster={posterOf(p)} muted loop playsInline preload="metadata" aria-hidden draggable={false} className={`size-full object-cover ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={posterOf(p)} alt="" draggable={false} className={`size-full object-cover ${className}`} />;
}

/* ══════════ A · Prompt 显影 ══════════ */
/* 拼贴布局：照 openart.ai/ai-video-generator 首屏实测(1440 宽，单位 vw,以输入框顶部为 0):
   5 张正方形 —— 左上 / 右上在标题两侧(不压标题),左中 / 右中在输入框两侧(输入框压在上面),正中下方最大 = 新成片显影的位置。 */
/* 2026-11-19 照 openart.ai/ai-image-generator 首屏(Monica 给了它的大屏 / 小屏截图):
   5 张正方形，固定像素、以页面中线为基准左右并排(和 OpenArt 一样，小屏放不下时最外两张被屏幕裁掉，不缩小);
   x = 相对中线的左边距，t = 相对输入框顶部;最外两张顶边和说明文字齐平，内侧两张从输入框顶部开始，正中那张紧贴输入框下边(below)。 */
/* 照 openart.ai/ai-image-generator 实测(2026-11-19,Monica 画线标的对齐关系):
   最外两张顶边 = 大标题底边;内侧两张顶边 = 输入框顶上 18px;正中那张顶边 = 输入框底边往上 14px。
   尺寸两档(屏幕 ≥1680 用 1920 实测，否则 1440 实测),固定像素、以中线为基准，叠压固定为正中最上、内侧其次、最外最下。depth = 鼠标跟随幅度。 */
type Slot = { x: number; w: number; depth: number; anchor: "title" | "box" | "below"; t: number };
/* 1440 档(笔记本屏，Monica 2026-11-19 截图核对):OpenArt 实测 —— 最外两张顶边 = 输入框顶上 55px(约等于说明文字底边),
   内侧两张从输入框顶下 65px 开始，正中那张在输入框底边下 70px */
const SLOTS_1440: Slot[] = [
  { x: -850, w: 380, depth: 15, anchor: "box", t: -55 },
  { x: -540, w: 420, depth: 29, anchor: "box", t: 65 },
  { x: -230, w: 460, depth: 48, anchor: "below", t: 70 },
  { x: 120, w: 420, depth: 29, anchor: "box", t: 65 },
  { x: 470, w: 380, depth: 15, anchor: "box", t: -55 },
];
/* 大屏：整组卡片再下移 100px(Monica 2026-11-19:不压标题、副标题);最外两张改以输入框为基准(Monica 2026-11-19:大屏只把文字往上挪，卡片不跟着动);台阶 120px 等距 */
const SLOTS_1920: Slot[] = [
  { x: -1140, w: 460, depth: 15, anchor: "box", t: -38 },
  { x: -705, w: 500, depth: 29, anchor: "box", t: 82 },
  { x: -270, w: 540, depth: 48, anchor: "below", t: -14 },
  { x: 205, w: 500, depth: 29, anchor: "box", t: 82 },
  { x: 680, w: 460, depth: 15, anchor: "box", t: -38 },
];
/** 首屏输入框里能放的提示词长度上限(字符) */
const PROMPT_MAX = 240;

export function HeroDevelop({ pics, box, onPrompt }: { pics: Pic[]; box: ReactNode; onPrompt?: (s: string) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const active = useActive(stage);
  const queue = pics.filter((p) => p.kind !== "audio");
  const [deck, setDeck] = useState(() => queue.slice(0, 5));
  const deckRef = useRef(deck);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);
  /* 轮播只用有 prompt 的成片(要能打出来);没有 prompt 的只放在初始牌组里 */
  /* 2026-11-25 Monica:「非常长的提示词不要」—— 首屏只轮播短提示词，长的(MCP Skill 那种整段 brief)不打进输入框 */
  const cycle = queue.filter((p) => p.prompt && p.prompt.length <= PROMPT_MAX);
  const [fresh, setFresh] = useState<string | null>(null);
  const [wide, setWide] = useState(false);
  const [fit, setFit] = useState({ kS: 1, kX: 1 });
  useEffect(() => {
    const m = () => {
      setWide(innerWidth >= 1680);
      /* 大屏：整组按屏幕宽度缩放到完整显示，两边各留 48px(Monica 2026-11-19:大屏图片要完整、两边有间距);笔记本档照 OpenArt 固定尺寸，最外两张被裁 */
      /* 2026-11-19 Monica:大屏卡片尺寸照 OpenArt(固定 460/500/540,放不下时最外两张被屏幕裁掉，和 OpenArt 1720 宽实测一致) */
      setFit({ kS: 1, kX: 1 });
    };
    m();
    addEventListener("resize", m);
    return () => removeEventListener("resize", m);
  }, []);
  const kS = wide ? fit.kS : 1;
  const kX = wide ? fit.kX : 1;
  const SLOTS = (wide ? SLOTS_1920 : SLOTS_1440).map((L) => ({ ...L, x: (L.x + L.w / 2) * kX - (L.w * kS) / 2, w: L.w * kS, t: L.t * kS }));
  /* 大标题底边相对本容器(输入框顶部)的位置 */
  const anchorEl = useRef<HTMLDivElement>(null);
  const [titleBottom, setTitleBottom] = useState(-170);
  useEffect(() => {
    const el = anchorEl.current;
    const h1 = el?.closest("section")?.querySelector("h1");
    if (!el || !h1) return;
    const m = () => setTitleBottom(Math.round(h1.getBoundingClientRect().bottom - el.getBoundingClientRect().top));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);
  /* 三层台阶等距(Monica 2026-11-19:每层遮盖的高度要一样):正中那张比内侧两张低的距离 = 内侧比最外低的距离 */
  const rawTop = (L: (typeof SLOTS)[number]) => (L.anchor === "title" ? titleBottom : L.anchor === "below" ? boxH + L.t : L.t);
  const outerTop = rawTop(SLOTS[0]);
  const innerTop = rawTop(SLOTS[1]);
  const topOf = (i: number) => (i === 2 ? innerTop + (innerTop - outerTop) : rawTop(SLOTS[i]));
  const slotsRef = useRef(SLOTS);
  useEffect(() => {
    slotsRef.current = SLOTS;
  }, [SLOTS]);
  /* 鼠标跟随：横竖都跟，缓动约 0.6 秒跟到位;不在视口 / 减少动态效果时不动 */
  const cardEls = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (!active || reduced()) return;
    /* 2026-11-19 Monica:跟随鼠标的任何方向(上下左右、画圈都跟);竖向幅度为横向的 0.7 */
    let tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
    const move = (e: PointerEvent) => {
      tx = Math.max(-1, Math.min(1, (e.clientX - innerWidth / 2) / (innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - innerHeight / 2) / (innerHeight / 2)));
    };
    const tick = () => {
      mx += (tx - mx) * 0.09;
      my += (ty - my) * 0.09;
      cardEls.current.forEach((el, i) => {
        const d = slotsRef.current[i]?.depth ?? 0;
        if (el) el.style.translate = `${(mx * d).toFixed(2)}px ${(my * d * 0.7).toFixed(2)}px`;
      });
      raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move);
    };
  }, [active]);
  /* 输入框高度(正中那张紧贴它的下边) */
  const [boxH, setBoxH] = useState(176);
  useEffect(() => {
    const el = boxRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const m = () => setBoxH(el.offsetHeight);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const manual = useRef(false);
  const next = useRef(0);
  const side = useRef(0);

  useEffect(() => {
    const b = boxRef.current;
    if (!b) return;
    const stop = () => (manual.current = true);
    b.addEventListener("focusin", stop);
    b.addEventListener("pointerdown", stop);
    return () => {
      b.removeEventListener("focusin", stop);
      b.removeEventListener("pointerdown", stop);
    };
  }, []);

  useEffect(() => {
    if (!active || reduced() || cycle.length < 2) return;
    let dead = false;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    (async () => {
      while (!dead) {
        /* 优先挑不在牌组里的;都在就挑不在中间的 */
        let p = cycle[next.current % cycle.length];
        for (let k = 0; k < cycle.length; k++) {
          const c = cycle[(next.current + k) % cycle.length];
          if (!deckRef.current.some((x) => x.src === c.src)) {
            p = c;
            next.current += k;
            break;
          }
        }
        next.current++;
        /* 1. 打字(只在用户没动过输入框时) */
        if (!manual.current && onPrompt && p.prompt) {
          const text = p.prompt;
          const step = Math.max(1, Math.round(text.length / 70));
          for (let i = step; i <= text.length + step && !dead && !manual.current; i += step) {
            onPrompt(text.slice(0, i));
            await wait(22);
          }
          await wait(350);
        } else await wait(2600);
        if (dead) return;
        /* 2. 显影落位：新图进中间，一侧旧图往外推，最外那张离场(左右轮流) */
        setFresh(p.src);
        setDeck((d) => {
          const at = d.findIndex((x) => x.src === p.src);
          if (at === 2) return d;
          if (at >= 0) {
            /* 已在牌组：和中间那张换位 */
            const n = [...d];
            [n[2], n[at]] = [n[at], n[2]];
            return n;
          }
          side.current ^= 1;
          return side.current ? [d[1], d[2], p, d[3], d[4]] : [d[0], d[1], p, d[2], d[3]];
        });
        await wait(3400);
      }
    })();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div ref={stage}>
      <style>{`@keyframes hero-develop{0%{opacity:0;filter:blur(22px) saturate(0) brightness(1.6);clip-path:inset(0 0 100% 0 round 18px);translate:0 -70px;scale:.82}55%{opacity:1;filter:blur(6px) saturate(.5) brightness(1.2)}100%{opacity:1;filter:none;clip-path:inset(0 0 0 0 round 18px);translate:0 0;scale:1}}`}</style>
      <div ref={anchorEl} className="relative md:h-[var(--hero-h)]" style={{ ["--hero-h" as string]: `${topOf(2) + SLOTS[2].w}px` }}>
        <div ref={boxRef} className="relative z-20 mx-auto max-w-[44rem] md:max-w-[min(calc(38.2vw+32px),852px)] px-4">
          {box}
        </div>
        {deck.map((p, i) => {
          const L = SLOTS[i];
          return (
            <button
              key={p.src}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              type="button"
              aria-label={`Use the prompt of this ${p.model ?? "BuzzVideo"} example`}
              onClick={() => {
                manual.current = true;
                if (p.prompt && p.prompt.length <= PROMPT_MAX) onPrompt?.(p.prompt);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group absolute hidden transition-[left,top,width,height] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:block"
              style={{ left: `calc(50% + ${L.x}px)`, top: topOf(i), width: L.w, height: L.w, zIndex: 4 - Math.abs(i - 2) }}
            >
              <div
                className="relative size-full overflow-hidden rounded-[16px] shadow-[0_30px_70px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-2 group-hover:ring-[#FF744D]/60"
                style={{ animation: fresh === p.src && i === 2 ? "hero-develop 1.3s cubic-bezier(0.22,1,0.36,1) both" : undefined }}
              >
                <Img p={p} />
              </div>
            </button>
          );
        })}
      </div>
      <MobileRow pics={pics} />
    </div>
  );
}

/* 手机宽：横排可滑动(各方向共用) */
function MobileRow({ pics }: { pics: Pic[] }) {
  if (!pics.length) return null;
  return (
    <div aria-hidden className="mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-10 [scrollbar-width:none] md:hidden">
      {pics.slice(0, 6).map((p) => (
        <div key={p.src} className="relative w-[44vw] shrink-0 snap-start overflow-hidden rounded-[16px] ring-1 ring-white/10" style={{ aspectRatio: ar("4:5") }}>
          <Img p={p} />
        </div>
      ))}
    </div>
  );
}
