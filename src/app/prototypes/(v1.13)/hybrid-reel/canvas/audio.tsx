"use client";

/* 音频面板:Music 和 Sound effects 两页是同一套版式 ——
   搜索 + 上传 → 一排分类标签 → 列表(方形封面点了试听、名字、时长,悬停出 Use / Add)
   两页顶上各有一块品牌渐变的 AI 入口(Make music / a sound with AI),Music 页接着是画布上的 AI 配乐 / 上传的音乐;音效加在播放头位置
   (原声开关和音量不放在这里) */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ListFilter, Loader2, Pause, Play, Plus, Search, Upload, Wand2, X } from "lucide-react";
import {
  MUSIC_CATEGORIES,
  MUSIC_LIBRARY,
  SFX_LIBRARY,
  placeNew,
  fmt,
  musicTitle,
  newId,
  sfxTooClose,
  type MusicCategory,
  type Project,
  type SfxKind,
  addMusic,
} from "./project";
import type { Player } from "./player";
import type { EditApi } from "./timeline";
import { Tabs } from "./ui";
import { Tip } from "./tip";

/* ── 音效:Web Audio 现场合成 ── */
let ctx: AudioContext | null = null;
export function playSfx(kind: SfxKind, volume = 0.8) {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  const ac = ctx;
  void ac.resume();
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = volume;
  out.connect(ac.destination);
  const tone = (type: OscillatorType, from: number, to: number, dur: number, gain = 0.5, delay = 0) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t + delay);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + delay + dur);
    g.gain.setValueAtTime(0.0001, t + delay);
    g.gain.exponentialRampToValueAtTime(gain, t + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    o.connect(g).connect(out);
    o.start(t + delay);
    o.stop(t + delay + dur + 0.05);
  };
  const noise = (dur: number, from: number, to: number, gain = 0.4) => {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t);
  };
  switch (kind) {
    case "whoosh":
      return noise(0.6, 300, 3000, 0.6);
    case "riser":
      noise(1.2, 200, 6000, 0.35);
      return tone("sawtooth", 180, 900, 1.2, 0.08);
    case "pop":
      return tone("sine", 900, 200, 0.15, 0.6);
    case "click":
      return tone("square", 2200, 1200, 0.05, 0.25);
    case "ding":
      tone("sine", 1318, 1318, 0.9, 0.35);
      return tone("sine", 2637, 2637, 0.5, 0.1);
    case "sparkle":
      [0, 0.08, 0.16, 0.24].forEach((d, i) => tone("triangle", 1600 + i * 400, 2400 + i * 400, 0.25, 0.18, d));
      return;
    case "shutter":
      noise(0.08, 2000, 4000, 0.7);
      return setTimeout(() => noise(0.1, 1500, 3000, 0.5), 110);
    case "boom":
      tone("sine", 120, 35, 1, 0.9);
      return noise(0.5, 400, 80, 0.3);
  }
}

/* ── 细滑杆:和时间线缩放同一套样式 ── */
export function SlimRange({
  label,
  value,
  onChange,
  onStart,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onStart?: () => void;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={100}
      value={value}
      onPointerDown={onStart}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ background: `linear-gradient(to right, #6a6b7b 0%, #6a6b7b ${value}%, #e3e4ea ${value}%, #e3e4ea 100%)` }}
      className="h-[3px] w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-4 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#c9cad4] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#c9cad4] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(26,26,46,0.22)]"
    />
  );
}

/* 音效分组的封面色(列表里的方形封面) */
const SFX_COLORS: Record<string, string> = { Transitions: "#6d3fd6", UI: "#2f6fb0", Impact: "#d0342c" };
const SFX_GROUPS = ["Transitions", "UI", "Impact"] as const;

/** 列表里的方形封面:一层柔和的渐变,颜色取曲目 / 分组的主色 */
const cover = (c: string) =>
  `radial-gradient(circle at 28% 24%, color-mix(in oklab, ${c} 30%, white) 0%, transparent 58%), linear-gradient(140deg, ${c} 0%, color-mix(in oklab, ${c} 55%, white) 100%)`;

/** AI 音效节点生成出来的示例音效多长 */
const AI_SFX_LEN = 1.5;

/* 音效按秒写(0.6s);音乐统一写成 00:08 这种 */
const len = (d: number) => (d < 10 ? `${d.toFixed(1)}s` : fmt(d));

export function AudioPanel({
  project,
  edit,
  player,
  onGenerate,
  onUpload,
  onOpenNode,
  initialTab = "music",
}: {
  /** Make music with AI:画布上新建的配乐节点交给外面打开它的设置(用户在设置里确认 prompt 再点生成);不传就直接生成 */
  onOpenNode?: (id: string) => void;
  /** 从音效轨点进来时直接打开音效页 */
  initialTab?: "music" | "sfx";
  project: Project;
  edit: EditApi;
  player: Player;
  onGenerate: (id: string) => void;
  /** 上传自己的音乐 / 音效 */
  onUpload?: (file: File, as: "music" | "sfx") => void;
}) {
  const [tab, setTab] = useState<"music" | "sfx">(initialTab);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<string>("all");
  /* 分类下拉:标签一排放不下时,点左边的筛选图标看全部分类 */
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const chipRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!catOpen) return;
    const off = (e: PointerEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setCatOpen(false);
      }
    };
    document.addEventListener("pointerdown", off);
    window.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", off);
      window.removeEventListener("keydown", esc, true);
    };
  }, [catOpen]);
  const pickCat = (id: string) => {
    setChip(id);
    setCatOpen(false);
    /* 选中的标签滚进可见范围 */
    requestAnimationFrame(() => chipRow.current?.querySelector<HTMLElement>(`[data-chip="${id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  };
  const [preview, setPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* 音乐轨能用的:AI 配乐节点、用户上传的音乐(配音节点不算) */
  /* 画布上自己的曲子:上传的,和已经生成好的 AI 配乐;还没生成的 AI 配乐不进列表(去它的节点设置里生成) */
  const ownTracks = project.assets.filter((a) => a.kind === "audio" && a.purpose !== "voice" && a.purpose !== "sfx" && a.status === "ready");
  const q = query.trim().toLowerCase();

  const tracks = useMemo(
    () =>
      MUSIC_LIBRARY.filter(
        (m) => (chip === "all" || m.categories.includes(chip as MusicCategory)) && (!q || `${m.name} ${m.artist} ${m.mood}`.toLowerCase().includes(q)),
      ),
    [q, chip],
  );
  const sfx = SFX_LIBRARY.filter((x) => (chip === "all" || x.group === chip) && (!q || x.name.toLowerCase().includes(q)));
  const chips = tab === "music" ? [{ id: "all", name: "All" }, ...MUSIC_CATEGORIES] : [{ id: "all", name: "All" }, ...SFX_GROUPS.map((g) => ({ id: g, name: g }))];

  const togglePreview = (id: string, url?: string) => {
    const a = audioRef.current;
    if (!a || !url) return;
    if (preview === id) {
      a.pause();
      setPreview(null);
      return;
    }
    a.src = url;
    a.currentTime = 0;
    void a.play().catch(() => {});
    setPreview(id);
  };

  /* Make music with AI:画布上加一个 Audio Generator(配乐)节点,放在剪辑器旁边,prompt 按方案预填好,直接作为背景音乐占在音乐轨上;
     右侧打开它的设置,用户看过 prompt 再点 Generate Audio(不自动开跑) */
  const addAiMusic = () => {
    const id = newId("bgm");
    edit.commit((p) =>
      placeNew(addMusic({
        ...p,
        assets: [
          ...p.assets,
          {
            id,
            kind: "audio",
            origin: "ai",
            label: "Audio Generator",
            durationSec: 30,
            aspect: 2,
            prompt: p.bgmPrompt || "Light, bright background music that sits under a voiceover",
            status: "idle",
            x: 0,
            y: 0,
          },
        ],
      }, id, player.total), [id]),
    );
    /* 新节点要等这次渲染写进工程后才找得到 */
    window.setTimeout(() => (onOpenNode ? onOpenNode(id) : onGenerate(id)), 60);
  };

  const addSfx = (kind: SfxKind) => {
    playSfx(kind);
    edit.commit((p) => ({ ...p, sfx: [...(p.sfx ?? []), { id: newId("sfx"), kind, at: Math.round(player.t * 10) / 10 }] }));
  };
  /* 「+」:追加一段音乐,接在音乐轨最后一段后面(见 addMusic);同一首可以加多次 */
  const pickMusic = (id: string) => edit.commit((p) => addMusic(p, id, player.total));

  /* Make a sound with AI:和 Make music with AI 同一套 —— 画布上剪辑器旁边加一个 Audio Generator(音效)节点,prompt 预填好,
     音效轨上在播放头处先占一块(还没声音),右侧打开它的设置,用户确认 prompt 再点 Generate Audio */
  const makeAiSfx = () => {
    const id = newId("ais");
    const at = Math.round(player.t * 10) / 10;
    edit.commit((p) =>
      placeNew(
        {
          ...p,
          assets: [
            ...p.assets,
            {
              id,
              kind: "audio",
              origin: "ai",
              purpose: "sfx",
              label: "Audio Generator",
              durationSec: AI_SFX_LEN,
              aspect: 2,
              cost: 0,
              prompt: "A short, clean whoosh that lands on this moment",
              status: "idle",
              x: 0,
              y: 0,
            },
          ],
          sfx: [...(p.sfx ?? []), { id: newId("sfx"), kind: "click", at, name: "AI sound", len: AI_SFX_LEN, srcLen: AI_SFX_LEN, assetId: id }],
        },
        [id],
      ),
    );
    window.setTimeout(() => (onOpenNode ? onOpenNode(id) : onGenerate(id)), 60);
  };
  /* 两条音效开头隔不到 2 秒:只提示,不拦 */
  const crowded = sfxTooClose(project.sfx);

  return (
    <div className="flex h-full flex-col">
      {/* Music / Sound effects:和 Media 面板的 Imported / Assets 同一个标签页组件 */}
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setQuery("");
          setChip("all");
        }}
        items={[
          { id: "music", label: "Music" },
          { id: "sfx", label: "Sound effects" },
        ]}
      />

      {/* 搜索 + 上传 */}
      <div className="mt-3 flex items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e1e3e9] bg-white px-3 transition focus-within:border-[#ff5e1a] focus-within:ring-[3px] focus-within:ring-[#ff5e1a]/15">
          <Search className="size-4 shrink-0 text-[#6a6b7b]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label={tab === "music" ? "Search music" : "Search sound effects"}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#74758a]"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="text-[#6a6b7b] hover:text-[#4a4b5c]">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <Tip label={tab === "music" ? "Upload music" : "Upload sound effect"} side="bottom" align="end">
          <button
            type="button"
            aria-label={tab === "music" ? "Upload music" : "Upload sound effect"}
            onClick={() => fileRef.current?.click()}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3f4f6] text-[#1a1a2e] transition hover:bg-[#e8e9ee]"
          >
            <Upload className="size-4" />
          </button>
        </Tip>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload?.(f, tab);
            e.target.value = "";
          }}
        />
      </div>

      {/* 分类:一排可横滑的标签 */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <div ref={catRef} className="relative shrink-0">
          <Tip label="All categories" side="bottom" align="start">
            <button
              type="button"
              aria-label="All categories"
              aria-haspopup="listbox"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((v) => !v)}
              className={`grid size-7 place-items-center rounded-lg transition outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                catOpen || chip !== "all" ? "bg-[#fff1e8] text-[#d24f14]" : "text-[#6a6b7b] hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
              }`}
            >
              <ListFilter className="size-4" />
            </button>
          </Tip>
          {catOpen && (
            <ul
              role="listbox"
              aria-label="Category"
              className="absolute left-0 top-[calc(100%+6px)] z-40 max-h-[280px] w-48 overflow-y-auto rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_32px_rgba(26,26,46,0.16)] [scrollbar-width:none]"
            >
              {chips.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={chip === c.id}
                    onClick={() => pickCat(c.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
                      chip === c.id ? "bg-[#fff1e8] font-semibold text-[#d24f14]" : "text-[#1a1a2e] hover:bg-[#f3f4f6]"
                    }`}
                  >
                    {c.name}
                    {chip === c.id && <Check className="size-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div ref={chipRow} role="radiogroup" aria-label="Category" className="-mr-1 flex min-w-0 gap-1.5 overflow-x-auto pr-1 [scrollbar-width:none]">
          {chips.map((c) => (
            <button
              key={c.id}
              data-chip={c.id}
              type="button"
              role="radio"
              aria-checked={chip === c.id}
              onClick={() => setChip(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                chip === c.id ? "bg-[#fff1e8] text-[#d24f14]" : "bg-[#f3f4f6] text-[#4a4b5c] hover:bg-[#e8e9ee]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 列表:音乐和音效同一种行 —— 方形封面(点了试听)+ 名字 + 时长,悬停出使用 / 添加 */}
      <ul className="-mx-1.5 mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none]">
        {tab === "music" ? (
          <>
            {chip === "all" && !q && (
              <AiBanner title="Make music with AI" meta="Fits this reel's length and mood" onClick={addAiMusic} />
            )}
            {ownTracks
              .filter((a) => !q || a.label.toLowerCase().includes(q))
              .map((a) => (
                <Row
                  key={a.id}
                  bg={cover(a.origin === "ai" ? "#ff7a36" : "#4a5a78")}
                  name={a.origin === "ai" ? musicTitle(project, a) : a.label}
                  meta={a.status === "ready" ? fmt(a.durationSec) : a.status === "generating" ? `Composing… ${a.progress ?? 0}%` : "Not generated"}
                  playing={preview === a.id}
                  onClick={a.url ? () => togglePreview(a.id, a.url) : undefined}
                  action={{ label: "Use", onClick: () => pickMusic(a.id) }}
                />
              ))}
            {tracks.map((m) => (
              <Row
                key={m.id}
                bg={cover(m.color)}
                name={m.name}
                meta={fmt(m.durationSec)}
                playing={preview === m.id}
                onClick={() => togglePreview(m.id, m.url)}
                action={{ label: "Use", onClick: () => pickMusic(m.id) }}
              />
            ))}
            {tracks.length === 0 && <li className="px-2 py-8 text-center text-[13px] text-[#6a6b7b]">No music matches. Try another word.</li>}
          </>
        ) : (
          <>
            {crowded && (
              <li className="mx-1.5 mb-1 flex gap-1.5 rounded-lg bg-[#fff8eb] px-2.5 py-2 text-[12px] leading-snug text-[#8a4b0c]">
                <AlertTriangle className="mt-px size-3.5 shrink-0 text-[#b45309]" />
                Sounds this close together can feel busy.
              </li>
            )}
            {chip === "all" && !q && (
              <AiBanner
                title="Make a sound with AI"
                meta="Fits this moment in your reel"
                onClick={makeAiSfx}
              />
            )}
            {sfx.map((x) => (
              <Row
                key={x.id}
                bg={cover(SFX_COLORS[x.group])}
                name={x.name}
                meta={len(x.durationSec)}
                onClick={() => playSfx(x.id)}
                action={{ label: "Use", onClick: () => addSfx(x.id) }}
              />
            ))}
            {sfx.length === 0 && <li className="px-2 py-8 text-center text-[13px] text-[#6a6b7b]">No sound effects match. Try another word.</li>}
          </>
        )}
      </ul>

      {/* 原声开关和人声 / 音乐音量不放在这个面板里(2026-10-16 Monica 定):原声在视频轨头的喇叭开关,音量在各自的设置里 */}
      <audio ref={audioRef} onEnded={() => setPreview(null)} />
    </div>
  );
}

/* 列表顶上的 AI 入口:柔和日落渐变整块横幅(2026-10-16 Monica 选的配色,深棕字)(和普通曲目一眼分开),左侧魔法棒图标(和之前那一行同一个)、白字标题 + 一行说明、右侧箭头;
   生成中换成转圈 + 进度,不可再点。音乐页和音效页同一个样子 */
function AiBanner({ title, meta, busy = false, onClick }: { title: string; meta: string; busy?: boolean; onClick: () => void }) {
  return (
    <li className="mb-1.5 px-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy}
        className="group/ai relative flex w-full items-center gap-3 overflow-hidden rounded-xl bg-[linear-gradient(120deg,#FFC48A_0%,#FF9B6B_55%,#FF7E86_100%)] px-3.5 py-3 text-left text-[#4A1B0C] shadow-[0_6px_18px_rgba(255,126,90,0.22)] outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2 disabled:cursor-progress"
      >
        {/* 左上一团柔光,让整块不显得平 */}
        <span aria-hidden className="pointer-events-none absolute -left-6 -top-10 size-28 rounded-full bg-white/30 blur-2xl" />
        <span className="relative grid size-12 shrink-0 place-items-center rounded-[13px] bg-white/30 text-white ring-1 ring-inset ring-white/40">
          {busy ? <Loader2 className="size-7 animate-spin" /> : <Wand2 className="size-[30px]" strokeWidth={2.25} />}
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-[12px] tabular-nums text-[#712B13]">{meta}</span>
        </span>
        {!busy && <ArrowRight className="relative size-4 shrink-0 transition-transform group-hover/ai:translate-x-0.5" />}
      </button>
    </li>
  );
}

/* 一行曲目 / 音效:整行点了试听(封面上的播放键变暂停),右侧悬停出「Use / Add」,在用的常亮「In use」 */
function Row({
  bg,
  icon,
  name,
  meta,
  playing,
  onClick,
  action,
}: {
  bg: string;
  icon?: React.ReactNode;
  name: string;
  meta: string;
  playing?: boolean;
  onClick?: () => void;
  action: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; plus?: boolean };
}) {
  return (
    <li className="group relative flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[#f6f7f9]">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={playing ? `Stop ${name}` : icon ? name : `Preview ${name}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:cursor-default rounded-lg"
      >
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[10px] text-white" style={{ background: bg }}>
          {icon ?? (playing ? <Pause className="size-4 drop-shadow" fill="currentColor" /> : <Play className="ml-px size-4 drop-shadow" fill="currentColor" />)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-[#1a1a2e]">{name}</span>
          <span className="mt-0.5 block truncate text-[12px] tabular-nums text-[#6a6b7b]">{meta}</span>
        </span>
      </button>
      {action.label === "Use" || action.label === "In use" ? (
        /* 用这首 / 加这个音效:品牌橙渐变的圆形「+」;已在用的换成对勾,常亮 */
        <Tip label={action.active ? "In use" : action.label} side="left">
          <button
            type="button"
            aria-label={action.active ? `${name} is in use` : `Use ${name}`}
            aria-pressed={action.active}
            disabled={action.disabled}
            onClick={action.onClick}
            className={`grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_2px_6px_rgba(255,94,26,0.28)] transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:pointer-events-none disabled:opacity-40 ${
              action.active ? "" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
            }`}
          >
            {action.active ? <Check className="size-3.5" strokeWidth={3} /> : <Plus className="size-4" strokeWidth={2.75} />}
          </button>
        </Tip>
      ) : (
      <button
        type="button"
        disabled={action.disabled}
        onClick={action.onClick}
        className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition disabled:pointer-events-none disabled:opacity-40 ${
          action.active
            ? "bg-[#fff1e8] text-[#d24f14]"
            : "text-[#4a4b5c] opacity-0 hover:bg-[#e8e9ee] hover:text-[#1a1a2e] focus-visible:opacity-100 group-hover:opacity-100"
        }`}
      >
        {action.plus && <Plus className="size-3.5" />}
        {action.label}
      </button>
      )}
    </li>
  );
}
