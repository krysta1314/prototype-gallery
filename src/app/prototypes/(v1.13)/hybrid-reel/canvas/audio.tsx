"use client";

/* 音频面板(照剪映「音乐 / 音效」的结构):
   Music —— 搜索 + 快捷标签 + 分类 + 推荐列表,可试听、一键使用;AI 生成配乐
   Sound effects —— 分组列表,试听,加到播放头位置(出现在音乐轨上,播放到那一刻响)
   底部 Mix:原声开关 + 人声 / 音乐音量 */

import { useMemo, useRef, useState } from "react";
import { Music2, Pause, Play, Plus, Search, Wand2, X } from "lucide-react";
import {
  MUSIC_CATEGORIES,
  MUSIC_LIBRARY,
  SFX_LIBRARY,
  arrange,
  fmt,
  newId,
  type MusicCategory,
  type Project,
  type SfxKind,
} from "./project";
import type { Player } from "./player";
import type { EditApi } from "./timeline";
import { Tabs, Toggle } from "./ui";

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

const QUICK = ["Trending", "Product launch", "Chill background", "Beat drop"];

export function AudioPanel({
  project,
  edit,
  player,
  onGenerate,
}: {
  project: Project;
  edit: EditApi;
  player: Player;
  onGenerate: (id: string) => void;
}) {
  const [tab, setTab] = useState<"music" | "sfx">("music");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MusicCategory | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const began = useRef(false);

  const aiTracks = project.assets.filter((a) => a.kind === "audio");
  const q = query.trim().toLowerCase();

  const tracks = useMemo(() => {
    const quickMap: Record<string, MusicCategory[]> = {
      trending: ["tiktok"],
      "product launch": ["promo", "marketing"],
      "chill background": ["emotional"],
      "beat drop": ["beat", "energetic"],
    };
    return MUSIC_LIBRARY.filter((m) => {
      if (category && !m.categories.includes(category)) return false;
      if (!q) return true;
      const cats = quickMap[q];
      if (cats) return m.categories.some((c) => cats.includes(c));
      return `${m.name} ${m.artist} ${m.mood}`.toLowerCase().includes(q);
    });
  }, [q, category]);

  const sfx = SFX_LIBRARY.filter((s) => !q || s.name.toLowerCase().includes(q));

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

  const slide = (key: "musicVol" | "voiceVol") => (v: number) => {
    if (!began.current) {
      edit.begin();
      began.current = true;
    }
    edit.update((p) => ({ ...p, [key]: v }));
  };

  const addAiMusic = () => {
    const id = newId("bgm");
    edit.commit((p) =>
      arrange({
        ...p,
        assets: [
          ...p.assets,
          {
            id,
            kind: "audio",
            origin: "ai",
            label: "AI music",
            durationSec: 30,
            aspect: 2,
            prompt: p.bgmPrompt || "Light, bright background music that sits under a voiceover",
            status: "idle",
            x: p.editor.x - 340,
            y: p.editor.y + 620,
          },
        ],
      }),
    );
    /* 新节点要等这次渲染写进工程后才找得到 */
    window.setTimeout(() => onGenerate(id), 60);
  };

  const addSfx = (kind: SfxKind) => {
    playSfx(kind);
    edit.commit((p) => ({ ...p, sfx: [...(p.sfx ?? []), { id: newId("sfx"), kind, at: Math.round(player.t * 10) / 10 }] }));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Music / Sound effects */}
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setQuery("");
          setCategory(null);
        }}
        items={[
          { id: "music", label: "Music" },
          { id: "sfx", label: "Sound effects" },
        ]}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-3 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]">
        {/* 搜索 */}
        <label className="flex items-center gap-2 rounded-xl bg-[#f3f4f6] px-3 py-2 focus-within:ring-2 focus-within:ring-[#ff5e1a]/25">
          <Search className="size-4 shrink-0 text-[#9a9bb0]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "music" ? "Search music" : "Search sound effects"}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="text-[#9a9bb0] hover:text-[#4a4b5c]">
              <X className="size-3.5" />
            </button>
          )}
        </label>

        {tab === "music" ? (
          <>
            <div className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {QUICK.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setQuery(query.toLowerCase() === k.toLowerCase() ? "" : k)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${
                    query.toLowerCase() === k.toLowerCase() ? "bg-[#1a1a2e] text-white" : "bg-[#f3f4f6] text-[#4a4b5c] hover:bg-[#e8e9ee]"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <h4 className="text-[14px] font-bold">Categories</h4>
              {category && (
                <button type="button" onClick={() => setCategory(null)} className="text-[12px] font-medium text-[#6a6b7b] hover:text-[#1a1a2e]">
                  Clear
                </button>
              )}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {MUSIC_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(category === c.id ? null : c.id)}
                  className={`grid h-12 place-items-center rounded-lg px-1 text-center text-[11.5px] font-semibold leading-tight text-white transition hover:brightness-110 ${
                    category === c.id ? "ring-2 ring-[#ff5e1a] ring-offset-2" : ""
                  }`}
                  style={{ background: c.color }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-baseline justify-between">
              <h4 className="text-[14px] font-bold">
                {category ? MUSIC_CATEGORIES.find((c) => c.id === category)?.name : q ? "Results" : "Recommended"}
              </h4>
              <span className="text-[11.5px] text-[#9a9bb0]">Royalty-free</span>
            </div>
            <ul className="mt-1.5">
              <li>
                <button
                  type="button"
                  onClick={addAiMusic}
                  className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition hover:bg-[#f6f5f8]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-dashed border-[#ffbd99] bg-[#fff7f1] text-[#ff5e1a]">
                    <Wand2 className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1a1a2e]">Make music with AI</span>
                    <span className="block text-[11.5px] text-[#6a6b7b]">Composed for this reel · adds a node on the canvas</span>
                  </span>
                </button>
              </li>
              {aiTracks.map((a) => (
                <TrackRow
                  key={a.id}
                  cover="#ff5e1a"
                  name={a.label}
                  meta={a.status === "ready" ? "AI · made for this reel" : a.status === "generating" ? `Composing… ${a.progress ?? 0}%` : "Not generated"}
                  active={project.musicId === a.id}
                  disabled={a.status !== "ready"}
                  playing={preview === a.id}
                  onPreview={a.url ? () => togglePreview(a.id, a.url) : undefined}
                  onUse={() => edit.commit((p) => ({ ...p, musicId: p.musicId === a.id ? null : a.id }))}
                />
              ))}
              {tracks.map((m) => (
                <TrackRow
                  key={m.id}
                  cover={m.color}
                  name={m.name}
                  meta={`${fmt(m.durationSec)} · ${m.artist}`}
                  active={project.musicId === m.id}
                  playing={preview === m.id}
                  onPreview={() => togglePreview(m.id, m.url)}
                  onUse={() => edit.commit((p) => ({ ...p, musicId: p.musicId === m.id ? null : m.id }))}
                />
              ))}
              {tracks.length === 0 && <li className="px-2 py-6 text-center text-[12.5px] text-[#9a9bb0]">No tracks match — try another word.</li>}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-3 text-[12px] leading-snug text-[#6a6b7b]">
              Added at the playhead ({fmt(player.t)}). They show on the music track — click one there to remove it.
            </p>
            {(["Transitions", "UI", "Impact"] as const).map((g) => {
              const list = sfx.filter((s) => s.group === g);
              if (list.length === 0) return null;
              return (
                <div key={g} className="mt-4">
                  <h4 className="text-[13px] font-bold">{g}</h4>
                  <ul className="mt-1">
                    {list.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition hover:bg-[#f6f5f8]">
                        <button
                          type="button"
                          aria-label={`Preview ${s.name}`}
                          onClick={() => playSfx(s.id)}
                          className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f3f4f6] text-[#4a4b5c] transition hover:bg-[#e8e9ee]"
                        >
                          <Play className="ml-px size-3.5" fill="currentColor" />
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-[#1a1a2e]">{s.name}</span>
                          <span className="block text-[11.5px] text-[#6a6b7b]">{s.durationSec.toFixed(1)}s</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => addSfx(s.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-[#4a4b5c] transition hover:bg-[#e8e9ee] hover:text-[#1a1a2e]"
                        >
                          <Plus className="size-3.5" /> Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Mix */}
      <div className="mt-3 space-y-3 border-t border-[#e6e7ec] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Original audio</span>
          <Toggle label="Original audio track" on={project.originalOn} onChange={(on) => edit.commit((p) => ({ ...p, originalOn: on }))} />
        </div>
        <label className="grid grid-cols-[64px_1fr_32px] items-center gap-2 text-[12px] text-[#6a6b7b]">
          Voice
          <SlimRange label="Voice volume" value={project.voiceVol} onStart={() => (began.current = false)} onChange={slide("voiceVol")} />
          <span className="text-right tabular-nums">{project.voiceVol}</span>
        </label>
        <label className="grid grid-cols-[64px_1fr_32px] items-center gap-2 text-[12px] text-[#6a6b7b]">
          Music
          <SlimRange label="Music volume" value={project.musicVol} onStart={() => (began.current = false)} onChange={slide("musicVol")} />
          <span className="text-right tabular-nums">{project.musicVol}</span>
        </label>
      </div>
      <audio ref={audioRef} onEnded={() => setPreview(null)} />
    </div>
  );
}

function TrackRow({
  cover,
  name,
  meta,
  active,
  disabled,
  playing,
  onPreview,
  onUse,
}: {
  cover: string;
  name: string;
  meta: string;
  active: boolean;
  disabled?: boolean;
  playing?: boolean;
  onPreview?: () => void;
  onUse: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 rounded-xl px-1.5 py-2 transition hover:bg-[#f6f5f8]">
      <button
        type="button"
        aria-label={playing ? `Stop ${name}` : `Preview ${name}`}
        onClick={onPreview}
        disabled={!onPreview}
        className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg text-white"
        style={{ background: cover }}
      >
        <Music2 className={`size-4 transition ${playing ? "opacity-0" : "opacity-70 group-hover:opacity-0"}`} />
        {onPreview && (
          <span className={`absolute inset-0 grid place-items-center bg-black/30 transition ${playing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-px size-4" fill="currentColor" />}
          </span>
        )}
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]">{name}</span>
        <span className="block truncate text-[11.5px] text-[#6a6b7b]">{meta}</span>
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onUse}
        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition disabled:opacity-40 ${
          active ? "bg-[#fff3ec] text-[#d24f14]" : "text-[#4a4b5c] opacity-0 hover:bg-[#e8e9ee] group-hover:opacity-100 focus-visible:opacity-100"
        }`}
      >
        {active ? "In use" : "Use"}
      </button>
    </li>
  );
}
