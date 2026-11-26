"use client";

/* 模型页的「参数图形卡」和步骤小界面(2026-11-18)。
   没有真实成片的地方，用模型的真实参数画图(分辨率套方框、比例画成真实形状、参考图堆叠、时长时间轴、声波),
   做法参考 Magnific 模型页：画面是参数本身，不是假成片。深色底上用，配色只取官方色板。 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, Download, ImageIcon, Mic, Music, Pause, Play, Plus, RefreshCw, Video, Volume2 } from "lucide-react";
import type { ModelEntry } from "../../site-nav/models-catalog";
import type { ModelFacts } from "./model-facts";
import type { Sample } from "./model-media";

const ORANGE = "#FF744D";

/* 2026-11-26 Monica:「能听就好了」—— 音频模型页的声波卡接上本页真实样曲，点了就播。
   同一时间只播一条：开新的会停掉上一条 */
let playingNow: HTMLAudioElement | null = null;
function useClip(src?: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => () => ref.current?.pause(), []);
  const toggle = () => {
    if (!src) return;
    if (!ref.current) {
      const a = new Audio(src);
      a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
      a.onpause = () => setPlaying(false);
      a.onplay = () => setPlaying(true);
      a.onended = () => setProgress(0);
      ref.current = a;
    }
    const a = ref.current;
    if (a.paused) {
      if (playingNow && playingNow !== a) playingNow.pause();
      playingNow = a;
      a.play().catch(() => {});
    } else a.pause();
  };
  return { playing, progress, toggle };
}

/* 比例字符串 → 数值;Auto / Adaptive 这类不画 */
const ratioNum = (r: string) => {
  const [w, h] = r.split(/[:x]/).map(Number);
  return w && h ? w / h : undefined;
};

/* ── 单张图形卡(作品墙里和成片穿插) ── */
export type TileKind = "resolution" | "ratios" | "refs" | "duration" | "sound" | "voice" | "music" | "price";

export function tilesOf(m: ModelEntry, f: ModelFacts | undefined, from?: number): TileKind[] {
  const t: TileKind[] = [];
  if (m.type === "audio") {
    t.push(f?.audioKind === "music" ? "music" : "voice");
    t.push("sound");
  } else {
    if (f?.durations) t.push("duration");
    if (f?.resolutions?.length) t.push("resolution");
    if ((f?.ratios?.filter((r) => ratioNum(r)).length ?? 0) >= 3) t.push("ratios");
    if (f?.refs?.images && f.refs.images > 1) t.push("refs");
    if (m.type === "video") t.push("sound");
  }
  if (from) t.push("price");
  return t;
}

const tileFrame = "relative flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10";
const tileLabel = "mt-auto text-[13px] font-semibold leading-snug text-[#CACACA]";

export function SpecTile({ kind, m, f, from, samples, audio }: { kind: TileKind; m: ModelEntry; f?: ModelFacts; from?: number; samples: Sample[]; /** 声波卡可播放的样曲 */ audio?: string }) {
  if ((kind === "sound" || kind === "voice" || kind === "music") && audio) return <WaveTile kind={kind} m={m} f={f} audio={audio} />;
  if (kind === "resolution") {
    const res = f?.resolutions ?? [];
    const shown = res.slice(-3);
    return (
      <div className={tileFrame}>
        <div className="relative mx-auto mt-2 aspect-square w-[78%]">
          {shown.map((r, i) => {
            const size = 100 - (shown.length - 1 - i) * 26;
            const top = i === shown.length - 1;
            return (
              <div
                key={r}
                className="absolute bottom-0 left-0 rounded-[10px] border-2"
                style={{ width: `${size}%`, height: `${size}%`, borderColor: top ? ORANGE : "rgba(255,255,255,0.28)" }}
              >
                <span className={`absolute right-2 top-1.5 text-[13px] font-extrabold ${top ? "text-white" : "text-[#9F9F9F]"}`}>{r.replace(/^(\d+)P$/, "$1p")}</span>
              </div>
            );
          })}
        </div>
        <p className={tileLabel}>
          <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">Up to {res[res.length - 1]?.replace(/^(\d+)P$/, "$1p")}</span>
          {res.length} {/Low|High/.test(res.join()) ? "quality levels" : "resolutions"}
        </p>
      </div>
    );
  }
  if (kind === "ratios") {
    const all = (f?.ratios ?? []).filter((r) => ratioNum(r));
    const sorted = [...all].sort((a, b) => ratioNum(a)! - ratioNum(b)!);
    const pick = [...new Set([sorted[0], all.find((r) => r === "9:16") ?? sorted[1], "1:1", all.find((r) => r === "16:9") ?? sorted[sorted.length - 2], sorted[sorted.length - 1]])].filter((r) => r && all.includes(r)) as string[];
    return (
      <div className={tileFrame}>
        <div className="mt-2 flex h-[58%] items-end justify-center gap-2.5">
          {pick.map((r, i) => {
            const v = ratioNum(r)!;
            const h = v >= 1 ? 72 / Math.min(v, 4) : 100;
            const w = v >= 1 ? 72 : Math.max(100 * v, 9);
            return (
              <div key={r} className="flex flex-col items-center gap-1.5" style={{ width: `${Math.max(w * 0.42, 14)}%` }}>
                <div className="w-full rounded-[6px] border-2" style={{ aspectRatio: `${v}`, maxHeight: `${h}%`, borderColor: i === pick.length - 1 ? ORANGE : "rgba(255,255,255,0.3)" }} />
                <span className="text-[11px] font-bold text-[#CACACA]">{r}</span>
              </div>
            );
          })}
        </div>
        <p className={tileLabel}>
          <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">{all.length} ratios</span>
          From {sorted[0]} to {sorted[sorted.length - 1]}
        </p>
      </div>
    );
  }
  if (kind === "refs") {
    const n = f?.refs?.images ?? 0;
    const thumbs = samples.filter((s) => s.kind === "image");
    return (
      <div className={tileFrame}>
        <div className="relative mt-3 h-[52%]">
          {Array.from({ length: Math.min(n, 6) }).map((_, i) => {
            const s = thumbs[i % Math.max(thumbs.length, 1)];
            return (
              <div
                key={i}
                className="absolute top-0 h-[78%] w-[42%] overflow-hidden rounded-[10px] bg-white/10 ring-2 ring-black"
                style={{ left: `${i * 11}%`, top: `${(i % 2) * 10}%`, transform: `rotate(${(i - 2.5) * 4}deg)` }}
              >
                {s ? <img src={s.src} alt="" className="size-full object-cover" /> : <ImageIcon className="m-auto mt-[35%] size-5 text-white/40" />}
              </div>
            );
          })}
        </div>
        <p className={tileLabel}>
          <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">{n} references</span>
          {f?.refs?.videos ? `Plus ${f.refs.videos} videos${f.refs.audios ? ` and ${f.refs.audios} audio clips` : ""}` : "Images in one prompt"}
        </p>
      </div>
    );
  }
  if (kind === "duration") {
    const [lo, hi] = f?.durations ?? [0, 0];
    return (
      <div className={tileFrame}>
        <div className="mt-6">
          <div className="flex justify-between text-[11px] font-bold tabular-nums text-[#9F9F9F]">
            <span>0 s</span>
            <span>{hi} s</span>
          </div>
          <div className="relative mt-2 h-14 overflow-hidden rounded-[10px] bg-white/[0.06]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="absolute top-0 h-full border-r border-black/60 bg-white/[0.08]" style={{ left: `${i * 12.5}%`, width: "12.5%" }} />
            ))}
            <div className="absolute inset-y-0 left-0 rounded-l-[10px] border-2" style={{ width: "100%", borderColor: ORANGE }} />
            <div className="absolute inset-y-[-4px] w-[3px] rounded-full bg-white" style={{ left: `${(lo / hi) * 100}%` }} />
          </div>
        </div>
        <p className={tileLabel}>
          <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">Up to {hi} s</span>
          Clips from {lo} to {hi} seconds
        </p>
      </div>
    );
  }
  if (kind === "sound" || kind === "voice" || kind === "music") {
    return <WaveTile kind={kind} m={m} f={f} />;
  }
  /* price */
  return <PriceTile m={m} from={from} />;
}

function WaveTile({ kind, m, f, audio }: { kind: "sound" | "voice" | "music"; m: ModelEntry; f?: ModelFacts; audio?: string }) {
  const clip = useClip(audio);
  {
    const bars = [18, 42, 30, 64, 88, 52, 76, 40, 96, 60, 34, 70, 48, 82, 28, 56, 38, 66, 24, 46];
    const title = kind === "music" ? "Full tracks" : kind === "voice" ? (f?.audioKind === "voice clone" ? "Your voice" : "Voiceover") : m.type === "video" ? "Native audio" : f?.audioKind === "sound effects" ? "Sound effects" : "Studio sound";
    const sub =
      kind === "sound" && m.type === "video"
        ? f?.soundOff
          ? "Sound on or off, your call"
          : "Every clip comes with sound"
        : (f?.notes?.[0] ?? "Generated in BuzzVideo");
    const Icon = kind === "music" ? Music : kind === "voice" ? Mic : Volume2;
    const Tag = audio ? "button" : "div";
    return (
      <Tag
        {...(audio ? { type: "button" as const, onClick: clip.toggle, "aria-label": `${clip.playing ? "Pause" : "Play"} a ${m.name} sample` } : {})}
        className={`${tileFrame} text-left ${audio ? "cursor-pointer transition hover:bg-white/[0.09]" : ""}`}
      >
        <span className="flex items-center justify-between">
          <Icon className="size-5 text-white" />
          {audio && (
            <span className="grid size-11 place-items-center rounded-full bg-[#FF744D] text-[#240A03] shadow-[0_8px_24px_rgba(255,116,77,0.35)]">
              {clip.playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
            </span>
          )}
        </span>
        <span className="mt-4 flex h-[34%] items-center gap-[3px]">
          {bars.map((b, i) => (
            <span key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${b}%`, background: (audio && (clip.playing || clip.progress > 0) ? i < Math.round(clip.progress * bars.length) : i < 9) ? ORANGE : "rgba(255,255,255,0.3)" }} />
          ))}
        </span>
        <span className={`block ${tileLabel}`}>
          <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">{title}</span>
          {sub}
        </span>
      </Tag>
    );
  }
}

function PriceTile({ m, from }: { m: ModelEntry; from?: number }) {
  return (
    <div className={tileFrame}>
      <div className="mt-3 rounded-[14px] bg-black/50 p-3 ring-1 ring-white/10">
        <div className="flex items-center justify-between text-[12px] font-semibold text-[#CACACA]">
          <span className="truncate">{m.name}</span>
          <span className="tabular-nums text-white">{from} credits</span>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3.5 py-2 text-[12px] font-bold text-white">
            Generate <ArrowUp className="size-3.5" />
          </span>
        </div>
      </div>
      <p className={tileLabel}>
        <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">From {from} credits</span>
        Price shows before you create
      </p>
    </div>
  );
}

/* ── 成片卡(作品墙) ── */
export function SampleCard({ s, className = "" }: { s: Sample; className?: string }) {
  if (s.kind === "video")
    return <video src={s.src} poster={s.poster} muted loop playsInline autoPlay aria-label={s.alt} className={`size-full object-cover ${className}`} />;
  if (s.kind === "audio")
    return (
      <div className={`flex size-full flex-col justify-end bg-white/[0.06] p-4 ${className}`}>
        <p className="line-clamp-3 text-[13px] text-[#CACACA]">{s.prompt}</p>
        <audio src={s.src} controls className="mt-3 w-full" />
      </div>
    );
  return <img src={s.src} alt={s.alt} loading="lazy" className={`size-full object-cover ${className}`} />;
}

/* ── 「How to use」三步的小界面 ── */
const uiFrame = "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] bg-white/[0.05] ring-1 ring-white/10";

export function StepPickModel({ m, siblings }: { m: ModelEntry; siblings: ModelEntry[] }) {
  const TypeIcon = m.type === "video" ? Video : m.type === "image" ? ImageIcon : Volume2;
  const list = [m, ...siblings].slice(0, 4);
  return (
    <div className={uiFrame}>
      {/* 2026-11-26 Monica:「审美上我需要对齐」—— 三张步骤卡里的小界面同宽同高(90% × 92%),上下边对齐;模型列表在卡里均匀铺满 */}
      <div className="flex h-[90%] w-[92%] flex-col rounded-[14px] bg-[#1C1C1C] p-2 ring-1 ring-white/10">
        <div className="flex items-center justify-between rounded-[9px] bg-white/[0.06] px-3 py-2 text-[12.5px] font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <TypeIcon className="size-3.5" /> {m.name}
          </span>
          <ChevronDown className="size-3.5 text-[#9F9F9F]" />
        </div>
        <ul className="mt-1.5 flex flex-1 flex-col justify-around">
          {list.map((x) => (
            <li key={x.slug} className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[12.5px] ${x.slug === m.slug ? "bg-[#FF744D]/15 font-bold text-white" : "text-[#CACACA]"}`}>
              <span className="truncate">{x.name}</span>
              {x.slug === m.slug ? <Check className="size-3.5" style={{ color: ORANGE }} /> : <span className="text-[11px] text-[#9F9F9F]">{x.vendor}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function StepPrompt({ prompt, chips }: { prompt: string; chips: string[] }) {
  return (
    <div className={uiFrame}>
      <div className="flex h-[90%] w-[92%] flex-col rounded-[14px] bg-[#1C1C1C] p-4 ring-1 ring-white/10">
        <p className="line-clamp-4 text-[14px] leading-snug text-white">
          {prompt}
          <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-[#FF744D] motion-reduce:animate-none" />
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#CACACA]">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepResult({ sample, m, from }: { sample?: Sample; m: ModelEntry; from?: number }) {
  return (
    <div className={uiFrame}>
      <div className="flex h-[90%] w-[92%] flex-col overflow-hidden rounded-[14px] bg-[#1C1C1C] ring-1 ring-white/10">
        <div className="relative min-h-0 flex-1">
          {sample ? (
            <SampleCard s={sample} />
          ) : (
            /* data-empty-step:巡检用标记(curl 全站搜它就知道哪页第 3 步没分到成片),2026-11-26 全站 0 处 */
            <div data-empty-step className="flex size-full items-center justify-center bg-white/[0.04]">
              <Plus className="size-6 text-white/30" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-[11.5px] text-[#CACACA]">
          <span className="truncate">
            {m.name}
            {from ? ` · ${from} credits` : ""}
          </span>
          <span className="flex gap-2.5 text-white">
            <Download className="size-3.5" />
            <RefreshCw className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* 2026-11-26 Monica 在 Video Generation MCP Server 的 How to use:「这里怎么是空的?」——
   不绑定单一模型的页面(MCP 服务器、Claude / ChatGPT 插件、Marketing Agent)第 1 步和第 3 步没有模型卡和成片卡，补两张界面示意 */
export function StepConnect({ url, label = "Server URL", client = "Claude" }: { url: string; label?: string; client?: string }) {
  return (
    <div className={uiFrame}>
      <div className="flex h-[90%] w-[92%] flex-col justify-center gap-3 rounded-[14px] bg-[#1C1C1C] p-4 ring-1 ring-white/10">
        <p className="text-[12px] font-semibold text-[#CACACA]">Add custom connector · {client}</p>
        <div>
          <p className="mb-1 text-[11px] text-white/50">Name</p>
          <div className="rounded-[8px] bg-white/[0.06] px-3 py-2 text-[13px] text-white ring-1 ring-white/10">BuzzVideo</div>
        </div>
        <div>
          <p className="mb-1 text-[11px] text-white/50">{label}</p>
          <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.06] py-1.5 pl-3 pr-1.5 ring-1 ring-[#FF744D]/60">
            <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-white">{url}</span>
            <span className="rounded-[6px] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#240A03]">Copy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepChatReply({ sample, ask, reply }: { sample?: Sample; ask: string; reply: string }) {
  return (
    <div className={uiFrame}>
      <div className="flex h-[90%] w-[92%] flex-col gap-2 overflow-hidden rounded-[14px] bg-[#1C1C1C] p-3 ring-1 ring-white/10">
        <p className="ml-auto max-w-[85%] truncate rounded-[12px] rounded-br-[4px] bg-white/[0.1] px-3 py-1.5 text-[12px] text-white">{ask}</p>
        <div className="flex min-h-0 flex-1 gap-2">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FF744D] text-[10px] font-bold text-white">B</span>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-[12px] leading-snug text-[#CACACA]">{reply}</p>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[10px]">{sample && <SampleCard s={sample} />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
