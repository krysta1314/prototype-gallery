"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, Play, Pause, Download, RotateCcw, Check, Volume2, Info, X, Wand2, Plus, MoreHorizontal, Pencil, Trash2, Loader2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

export const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const focusRing =
  "focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20 focus-visible:outline-none";

export type Voice = {
  id: string; speakerId: string; name: string;
  gender: "Female" | "Male"; language: string; style: string;
  status?: "cloning" | "ready"; // cloned voices show a "Cloning…" state while processing
  /** 克隆时用的模型(seed-audio / kling):两家的音色 ID 不通用 */
  cloneModel?: string;
};

/** 克隆模型选项(Clone voice 旁边的下拉) */
export type CloneModel = { key: string; label: string; hint: string };

export const VOICES: Voice[] = [
  { id: "warm-f",   speakerId: "seed_warm_female_en",  name: "Aria",   gender: "Female", language: "English", style: "Warm" },
  { id: "deep-m",   speakerId: "seed_deep_male_en",    name: "Miles",  gender: "Male",   language: "English", style: "Deep" },
  { id: "bright-f", speakerId: "seed_bright_female_en",name: "Nova",   gender: "Female", language: "English", style: "Bright" },
  { id: "narr-m",   speakerId: "seed_narrator_en",     name: "Atlas",  gender: "Male",   language: "English", style: "Narrator" },
  { id: "energy-f", speakerId: "seed_energetic_en",    name: "Piper",  gender: "Female", language: "English", style: "Energetic" },
  { id: "calm-m",   speakerId: "seed_calm_en",         name: "Sage",   gender: "Male",   language: "English", style: "Calm" },
  { id: "cn-f",     speakerId: "seed_lively_zh",       name: "Xiaoyu", gender: "Female", language: "中文",     style: "Lively" },
  { id: "cn-m",     speakerId: "seed_steady_zh",       name: "Chen",   gender: "Male",   language: "中文",     style: "Steady" },
];

// Voices the user has cloned — demo entries for the "My Voice" group.
export const MY_VOICES: Voice[] = [
  { id: "mine-1", speakerId: "user_clone_01", name: "Morgan", gender: "Female", language: "English", style: "Cloned", cloneModel: "kling" },
  { id: "mine-2", speakerId: "user_clone_02", name: "Riley",  gender: "Male",   language: "English", style: "Cloned", cloneModel: "seed-audio" },
];

export type GenParams = {
  model: string;
  sampleRate: number;   // Hz
  speechRate: number;   // -50..50
  pitchRate: number;    // -12..12
  loudnessRate: number; // -50..50
  format: "mp3" | "wav";
  enableSubtitle: boolean;
};

export const DEFAULT_PARAMS: GenParams = {
  model: "seed-audio-1.0",
  sampleRate: 44100,
  speechRate: 1, pitchRate: 0, loudnessRate: 1,
  format: "mp3", enableSubtitle: false,
};

const MINI_BARS = Array.from({ length: 34 }, (_, i) => 3 + Math.round(13 * Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.5))));
const EQ_BARS = Array.from({ length: 26 }, (_, i) => 8 + Math.round(30 * Math.abs(Math.sin(i * 0.9 + 1) * Math.cos(i * 0.4))));
// per-voice gradient swatch (colored identity tiles)
const VOICE_SWATCH = [
  "linear-gradient(140deg,#5eead4,#14b8a6)",
  "linear-gradient(140deg,#fdba74,#f97316)",
  "linear-gradient(140deg,#fda4af,#fb7185)",
  "linear-gradient(140deg,#7dd3fc,#38bdf8)",
  "linear-gradient(140deg,#86efac,#22c55e)",
  "linear-gradient(140deg,#6ee7b7,#10b981)",
  "linear-gradient(140deg,#f0abfc,#d946ef)",
  "linear-gradient(140deg,#c4b5fd,#8b5cf6)",
];
const MONO_FONT = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';
// real-person avatar photos for the header decoration
const AVATARS = [
  "https://i.pravatar.cc/80?img=47",
  "https://i.pravatar.cc/80?img=13",
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=5",
];

/** Voice gallery modal — shared by every voice selection entry point (Agent + Canvas). Dark preset-library look. */
export function VoiceModal({
  value,
  onChange,
  onClose,
  initialTab = "preset",
  isSelected,
  filters = false,
  cloneModels,
  voiceModel,
  presets = VOICES,
  allowClone = true,
}: {
  value: Voice | null;
  onChange: (v: Voice) => void;
  onClose: () => void;
  initialTab?: "preset" | "mine";
  /** 多选场景(如 Kling 最多 3 个音色):已选的卡片打勾。不传则只看 value */
  isSelected?: (v: Voice) => boolean;
  /** Preset Voice 右侧显示 Gender / Language / Style 筛选(照线上产品) */
  filters?: boolean;
  /** 传了就在 Clone voice 右边出「用哪个模型克隆」下拉;My Voice 卡片标出克隆模型 */
  cloneModels?: CloneModel[];
  /** 当前场景能用哪个模型克隆的音色(如 Kling 视频 = "kling");别的模型克隆的音色置灰并写原因 */
  voiceModel?: string;
  /** 预置音色列表(默认 Seed Audio 那套);模型只认自家固定音色时传它自己的(如 Kling Lip Sync) */
  presets?: Voice[];
  /** false = 模型不支持克隆音色：不显示 Clone voice 和 My Voice,标题改成 Select a voice */
  allowClone?: boolean;
}) {
  const [cloneWith, setCloneWith] = useState<string>(voiceModel ?? cloneModels?.[0]?.key ?? "");
  const modelLabel = (k?: string) => cloneModels?.find((m) => m.key === k)?.label ?? k ?? "";
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ gender: string; language: string; style: string }>({ gender: "", language: "", style: "" });
  const presetShown = presets.filter((v) => (!filter.gender || v.gender === filter.gender) && (!filter.language || v.language === filter.language) && (!filter.style || v.style === filter.style));
  const [tab, setTab] = useState<"preset" | "mine">(initialTab);
  const [myVoices, setMyVoices] = useState<Voice[]>(MY_VOICES);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** 不可用音色右上角 ⓘ 点开的说明 */
  const [infoId, setInfoId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const startClone = () => fileRef.current?.click();
  function startRename(v: Voice) { setRenamingId(v.id); setRenameText(v.name); setMenuId(null); }
  function commitRename(id: string) {
    setMyVoices((prev) => prev.map((x) => (x.id === id ? { ...x, name: renameText.trim() || x.name } : x)));
    setRenamingId(null);
  }
  function deleteVoice(id: string) {
    setMyVoices((prev) => prev.filter((x) => x.id !== id));
    setMenuId(null);
  }
  function play(id: string) {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setPreview((p) => (p === id ? null : id));
    previewTimer.current = setTimeout(() => setPreview(null), 1500);
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [onClose]);

  return (
    <div data-voice-modal className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: APPLE_FONT }}>
      <div className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_30px_80px_rgba(26,26,46,0.25)]">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const id = `mine-${Date.now()}`;
            const name = file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "New Voice";
            setMyVoices((prev) => [{ id, speakerId: id, name, gender: "Female", language: "English", style: "Cloned", status: "cloning", ...(cloneModels ? { cloneModel: cloneWith } : {}) }, ...prev]);
            setTab("mine");
            setTimeout(() => setMyVoices((prev) => prev.map((x) => (x.id === id ? { ...x, status: "ready" } : x))), 2500);
          }}
        />
        {menuId && <div className="fixed inset-0 z-20" onClick={() => setMenuId(null)} />}
        {infoId && <div className="fixed inset-0 z-20" onClick={() => setInfoId(null)} />}
        {/* header */}
        <div className="relative flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="relative z-10">
            <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-[#1a1a2e]">{allowClone ? "Select or add a voice" : "Select a voice"}</h2>
            <p className="mt-1 text-sm text-[#6a6b7b]">{allowClone ? "Pick a preset or clone your own voice." : "Pick a voice to read your script."}</p>
            {allowClone && <div className="mt-4 flex gap-2">
              <button onClick={startClone} className={`flex items-center gap-1.5 rounded-xl ${ctaGrad} px-4 py-2 text-sm font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105`}>
                Clone voice <Wand2 className="size-4" />
              </button>
              {cloneModels && <CloneModelMenu models={cloneModels} value={cloneWith} onChange={setCloneWith} />}
            </div>}
          </div>
          {/* decorative equalizer + real-person avatar bubbles */}
          <div className="pointer-events-none absolute right-16 top-6 hidden items-end gap-[3px] sm:flex">
            {EQ_BARS.map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-[#e4e3ea]" style={{ height: h }} />
            ))}
            {AVATARS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="absolute size-7 rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(26,26,46,0.18)]"
                style={{ left: `${10 + i * 26}%`, top: i % 2 ? 0 : 16 }}
              />
            ))}
          </div>
          <button onClick={onClose} className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[#f3f3f5] text-[#6a6b7b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* voice cards — Preset Voice / My Voice tabs */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-5 px-5 pt-3">
            {([
              { key: "preset", label: "Preset Voice" },
              { key: "mine", label: "My Voice" },
            ] as const).filter((t) => allowClone || t.key === "preset").map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative -mb-px pb-2.5 text-sm font-bold uppercase tracking-wide transition ${tab === t.key ? "text-[#1a1a2e]" : "text-[#9a9aa8] hover:text-[#6a6b7b]"}`}
              >
                {t.label}
                {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#ff5e1a]" />}
              </button>
            ))}
            {filters && tab === "preset" && (
              <div className="-mt-1 ml-auto flex gap-2 pb-2">
                {([
                  ["gender", "Gender", ["Female", "Male"]],
                  ["language", "Language", [...new Set(presets.map((v) => v.language))]],
                  ["style", "Style", [...new Set(presets.map((v) => v.style))]],
                ] as const).map(([key, label, opts]) => (
                  <FilterMenu key={key} label={label} options={opts as readonly string[]} value={filter[key]} onChange={(x) => setFilter((f) => ({ ...f, [key]: x }))} />
                ))}
              </div>
            )}
          </div>
          <div className="grid h-[340px] grid-cols-2 content-start gap-3 overflow-auto p-5 sm:grid-cols-3 lg:grid-cols-4">
            {tab === "mine" && (
              <button
                onClick={startClone}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#d4d3df] p-3 text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#f3f3f5] text-[#6a6b7b] transition group-hover:bg-white">
                  <Plus className="size-5" />
                </span>
                <span className="text-sm font-bold">Clone voice</span>
              </button>
            )}
            {tab === "preset" && presetShown.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-[#9a9aa8]">No voices match these filters.</p>
            )}
            {(tab === "preset" ? presetShown : myVoices).map((v, idx) => {
              const active = value?.id === v.id || !!isSelected?.(v);
              const playing = preview === v.id;
              const isMine = tab === "mine";
              const renaming = renamingId === v.id;
              const cloning = v.status === "cloning";
              /* 别的模型克隆的音色：当前场景用不了，置灰不可选 */
              const blocked = !!(voiceModel && v.cloneModel && v.cloneModel !== voiceModel);
              return (
                <button
                  key={v.id}
                  onClick={() => { if (cloning || blocked) return; onChange(v); onClose(); }}
                  aria-disabled={blocked || undefined}
                  className={`group relative flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition ${menuId === v.id ? "z-30" : ""} ${infoId === v.id ? "z-30" : ""} ${blocked ? "cursor-not-allowed border-[#ececf1] bg-[#fafafb] [&>*:not(.voice-info)]:opacity-50" : cloning ? "cursor-default border-[#ececf1] bg-white" : active ? "border-[#ff5e1a] bg-[#fff7f1] shadow-[0_0_0_1px_#ff5e1a,0_10px_28px_rgba(255,94,26,0.14)]" : "border-[#ececf1] bg-white hover:-translate-y-0.5 hover:border-[#d4d3df] hover:shadow-[0_10px_24px_rgba(26,26,46,0.08)]"}`}
                >
                  {/* 不可用：右上角只放一个 ⓘ,点开才说明原因 */}
                  {blocked && (
                    <span className="voice-info absolute right-[38px] top-[11px] z-10">
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Why can't I use this voice?"
                        onClick={(e) => { e.stopPropagation(); setInfoId((x) => (x === v.id ? null : v.id)); }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          e.stopPropagation();
                          setInfoId((x) => (x === v.id ? null : v.id));
                        }}
                        className={`grid size-6 cursor-pointer place-items-center rounded-full text-[#9a9aa8] transition hover:bg-[#ececf1] hover:text-[#1a1a2e] ${infoId === v.id ? "bg-[#ececf1] text-[#1a1a2e]" : ""}`}
                      >
                        <Info className="size-3.5" />
                      </span>
                      {infoId === v.id && (
                        <span className="absolute right-0 top-[calc(100%+6px)] block w-56 cursor-default rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-left text-[12px] font-normal normal-case leading-snug tracking-normal text-[#6a6b7b] shadow-[0_16px_36px_rgba(26,26,46,0.16)]" onClick={(e) => e.stopPropagation()}>
                          Cloned with {modelLabel(v.cloneModel)}, so it can&apos;t be used here. Clone it again with {modelLabel(voiceModel)} to use it.
                        </span>
                      )}
                    </span>
                  )}
                  {isMine ? (
                    <div className="flex items-start justify-between gap-1">
                      {renaming ? (
                        <input
                          autoFocus
                          value={renameText}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") commitRename(v.id); if (e.key === "Escape") setRenamingId(null); }}
                          onBlur={() => commitRename(v.id)}
                          className="min-w-0 flex-1 rounded-md border border-[#ff5e1a] px-1.5 py-0.5 text-[15px] font-bold uppercase tracking-wide text-[#ff5e1a] outline-none"
                          style={{ fontFamily: MONO_FONT }}
                        />
                      ) : (
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-bold uppercase tracking-wide text-[#ff5e1a]" style={{ fontFamily: MONO_FONT }}>{v.name}</p>
                          {cloneModels && v.cloneModel && (
                            <span className="mt-1 inline-block rounded-md bg-[#f3f3f5] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#6a6b7b]">{modelLabel(v.cloneModel)}</span>
                          )}
                        </span>
                      )}
                      <span className="relative flex shrink-0 items-center gap-1">
                        {active && <Check className="size-4 text-[#ff5e1a]" />}
                        {!cloning && <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setMenuId((m) => (m === v.id ? null : v.id)); }}
                          className="grid size-6 cursor-pointer place-items-center rounded-md text-[#6a6b7b] opacity-0 transition hover:bg-[#f3f3f5] group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-4" />
                        </span>}
                        {menuId === v.id && (
                          <span className="absolute right-0 top-full z-30 mt-1 flex w-32 flex-col rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
                            <span role="button" onClick={(e) => { e.stopPropagation(); startRename(v); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#1a1a2e] hover:bg-[#faf8f6]">
                              <Pencil className="size-3.5" /> Rename
                            </span>
                            <span role="button" onClick={(e) => { e.stopPropagation(); deleteVoice(v.id); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#ff5255] hover:bg-[#fff1f1]">
                              <Trash2 className="size-3.5" /> Delete
                            </span>
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="size-9 rounded-xl" style={{ background: VOICE_SWATCH[idx % VOICE_SWATCH.length] }} />
                        {active && <Check className="size-4 text-[#ff5e1a]" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#9a9aa8]">{v.gender}</p>
                        <p className="text-[15px] font-bold uppercase tracking-wide text-[#ff5e1a]" style={{ fontFamily: MONO_FONT }}>{v.name}</p>
                      </div>
                    </>
                  )}
                  {cloning ? (
                    <div className="flex h-7 items-center gap-2 text-[#6a6b7b]">
                      <Loader2 className="size-4 shrink-0 animate-spin text-[#ff5e1a]" />
                      <span className="text-xs font-semibold">Cloning…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => { e.stopPropagation(); play(v.id); }}
                        className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-full transition ${playing ? `${ctaGrad} text-white` : "bg-[#f3f3f5] text-[#1a1a2e] hover:bg-[#ffe7d6]"}`}
                      >
                        {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                      </span>
                      <span className="flex h-6 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
                        {MINI_BARS.map((h, i) => (
                          <span key={i} className="w-[2px] rounded-full" style={{ height: h, background: playing ? "#ff5e1a" : "#d4d3df" }} />
                        ))}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Clone voice 右边的克隆模型下拉：每项写用途，选中的打勾 */
function CloneModelMenu({ models, value, onChange }: { models: CloneModel[]; value: string; onChange: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const cur = models.find((m) => m.key === value) ?? models[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Voice model"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-full items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${open ? "border-[#ff5e1a] text-[#1a1a2e]" : "border-[#ececf1] text-[#1a1a2e] hover:border-[#d4d3df]"}`}
      >
        <span className="text-[#9a9aa8]">Voice model</span>
        {cur.label}
        <ChevronDown className={`size-3.5 text-[#9a9aa8] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" aria-label="Voice model" className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
          {models.map((m) => (
            <button
              key={m.key}
              type="button"
              role="option"
              aria-selected={m.key === value}
              onClick={() => (onChange(m.key), setOpen(false))}
              className="flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#faf8f6]"
            >
              <span>
                <span className={`block text-[13px] text-[#1a1a2e] ${m.key === value ? "font-semibold" : "font-medium"}`}>{m.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[#9a9aa8]">{m.hint}</span>
              </span>
              {m.key === value && <Check className="mt-0.5 size-3.5 shrink-0 text-[#ff5e1a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Voice 弹窗里的筛选下拉(不用原生 select):空值 = 全部 */
function FilterMenu({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 min-w-[104px] items-center justify-between gap-2 rounded-full border px-3 text-[12.5px] font-semibold transition ${value ? "border-[#ffcfb3] bg-[#fff7f1] text-[#ff5e1a]" : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"}`}
      >
        {value || label}
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className="absolute right-0 top-[calc(100%+6px)] z-30 w-40 rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
          {["", ...options].map((o) => (
            <button
              key={o || "all"}
              type="button"
              role="option"
              aria-selected={value === o}
              onClick={() => (onChange(o), setOpen(false))}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition hover:bg-[#faf8f6] ${value === o ? "font-semibold text-[#1a1a2e]" : "text-[#4a4b5c]"}`}
            >
              {o || `All ${label.toLowerCase()}s`}
              {value === o && <Check className="size-3.5 text-[#ff5e1a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VoicePicker({ value, onChange, fullWidth = false }: { value: Voice | null; onChange: (v: Voice) => void; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df] ${focusRing} ${fullWidth ? "w-full" : ""}`}
      >
        <Volume2 className={`size-4 shrink-0 ${value ? "text-[#ff5e1a]" : "text-[#9a9aa8]"}`} />
        {value ? value.name : <span className="text-[#9a9aa8]">Select a voice</span>}
        <ChevronDown className={`size-4 text-[#6a6b7b] ${fullWidth ? "ml-auto" : ""}`} />
      </button>
      {open && <VoiceModal value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#1a1a2e]">{label}</span>
      {children}
    </label>
  );
}

export function InfoHint({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className="group relative inline-flex">
      <Info className="size-3.5 cursor-help text-[#b4b4c0]" />
      <span className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-52 rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-[0_8px_22px_rgba(26,26,46,0.24)] group-hover:block ${align === "right" ? "right-0" : "left-0"}`}>
        {text}
      </span>
    </span>
  );
}

export function ParamSlider({ label, value, min, max, step = 1, center, format, info, onChange }: { label: string; value: number; min: number; max: number; step?: number; center?: number; format?: (n: number) => string; info?: string; onChange: (n: number) => void }) {
  const display = format ? format(value) : value > 0 ? `+${value}` : `${value}`;
  // Neutral value sits at the visual center (50%); each half maps linearly to its end.
  const c = center ?? (min + max) / 2;
  const toPos = (v: number) => (v <= c ? ((v - min) / (c - min)) * 50 : 50 + ((v - c) / (max - c)) * 50);
  const fromPos = (p: number) => {
    const raw = p <= 50 ? min + (p / 50) * (c - min) : c + ((p - 50) / 50) * (max - c);
    const snapped = Math.min(max, Math.max(min, Math.round(raw / step) * step));
    return parseFloat(snapped.toFixed(6));
  };
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-semibold text-[#1a1a2e]">
        <span className="flex items-center gap-1.5">{label}{info && <InfoHint text={info} />}</span>
        <span className="tabular-nums text-[#6a6b7b]">{display}</span>
      </div>
      <Slider value={[toPos(value)]} min={0} max={100} step={0.1} onValueChange={(a) => onChange(fromPos(a[0]))} />
    </div>
  );
}

function ByteDanceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M14.944 18.587l-1.704-.445V10.01l1.824-.462c1-.254 1.84-.461 1.88-.453.032 0 .056 2.235.056 4.972v4.973l-.176-.008c-.104 0-.952-.207-1.88-.446z" />
      <path d="M7 16.542c0-2.736.024-4.98.064-4.98.032-.008.872.2 1.88.454l1.816.461-.016 4.05-.024 4.049-1.632.422c-.896.23-1.736.445-1.856.469L7 21.523v-4.98z" />
      <path d="M19.24 12.477c0-9.03.008-9.515.144-9.475.072.024.784.207 1.576.406.792.207 1.576.405 1.744.445l.296.08-.016 8.56-.024 8.568-1.624.414c-.888.23-1.728.437-1.856.47l-.24.055v-9.523z" />
      <path d="M1 12.509c0-4.678.024-8.505.064-8.505.032 0 .872.207 1.872.454l1.824.461v7.582c0 4.16-.016 7.574-.032 7.574-.024 0-.872.215-1.88.47L1 21.013v-8.505z" />
    </svg>
  );
}

export const AUDIO_MODELS = [
  { value: "seed-audio-1.0", label: "seed-audio-1.0" },
  { value: "seed-audio-1.0-multilingual", label: "seed-audio-1.0-multilingual" },
];

function AudioModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = AUDIO_MODELS.find((m) => m.value === value) ?? AUDIO_MODELS[0];
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={rootRef} className="relative w-full">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`flex w-full items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df] ${focusRing}`}>
        <ByteDanceIcon className="size-4 shrink-0 text-[#1a1a2e]" />
        <span className="truncate">{current.label}</span>
        {current.value === "seed-audio-1.0-multilingual" && (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex shrink-0">
            <InfoHint align="right" text="Supports English, Chinese, Japanese, Korean, Mexican Spanish, Indonesian, German, Brazilian, Portuguese, French, Thai, Vietnamese, Malay, Filipino, Italian, Russian, Dutch, Polish, Turkish, Swedish, Castilian Spanish" />
          </span>
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-[#6a6b7b]" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-auto rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
          {AUDIO_MODELS.map((m) => (
            <button key={m.value} onClick={() => { onChange(m.value); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-[#1a1a2e] ${value === m.value ? "bg-[#fff3ec]" : "hover:bg-[#faf8f6]"}`}>
              <ByteDanceIcon className="size-4 shrink-0 text-[#1a1a2e]" />
              <span>{m.label}</span>
              {value === m.value && <Check className="ml-auto size-4 shrink-0 text-[#ff5e1a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const SAMPLE_RATES = [
  { value: 8000, label: "8000 Hz", desc: "low / phone quality" },
  { value: 16000, label: "16000 Hz", desc: "basic / voice calls" },
  { value: 24000, label: "24000 Hz", desc: "fine for voice" },
  { value: 32000, label: "32000 Hz", desc: "near-CD" },
  { value: 44100, label: "44100 Hz", desc: "default — CD quality" },
  { value: 48000, label: "48000 Hz", desc: "video / studio" },
];

export function SampleRatePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = SAMPLE_RATES.find((r) => r.value === value) ?? SAMPLE_RATES[2];
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={rootRef} className="relative w-full">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`flex w-full items-center justify-between rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-sm font-semibold text-[#1a1a2e] hover:border-[#d4d3df] ${focusRing}`}>
        <span>{current.label} <span className="font-normal text-[#6a6b7b]">· {current.desc}</span></span>
        <ChevronDown className="size-4 shrink-0 text-[#6a6b7b]" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
          {SAMPLE_RATES.map((r) => (
            <button key={r.value} onClick={() => { onChange(r.value); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left ${value === r.value ? "bg-[#fff3ec]" : "hover:bg-[#faf8f6]"}`}>
              <span>
                <span className="block text-sm font-semibold text-[#1a1a2e]">{r.label}</span>
                <span className="block text-xs text-[#6a6b7b]">{r.desc}</span>
              </span>
              {value === r.value && <Check className="size-4 shrink-0 text-[#ff5e1a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Full audio parameter controls — shared by the Canvas settings panel and the Agent composer. */
export function AudioParamControls({ voice, onVoice, params, onParams }: { voice: Voice | null; onVoice: (v: Voice) => void; params: GenParams; onParams: (p: GenParams) => void }) {
  const set = (patch: Partial<GenParams>) => onParams({ ...params, ...patch });
  return (
    <div className="space-y-4">
      <Field label="Audio Model">
        <AudioModelPicker value={params.model} onChange={(m) => set({ model: m })} />
      </Field>
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-[#1a1a2e]">Voice</span>
        <VoicePicker value={voice} onChange={onVoice} fullWidth />
      </div>
      <Field label="Sample Rate">
        <SampleRatePicker value={params.sampleRate} onChange={(n) => set({ sampleRate: n })} />
      </Field>
      <ParamSlider label="Speed" value={params.speechRate} min={0.5} max={2} step={0.1} center={1} format={(n) => `${n.toFixed(1)}x`} info="How fast the voice talks (0.5x–2.0x). 1.0 is normal — below slows down, above speeds up." onChange={(n) => set({ speechRate: n })} />
      <ParamSlider label="Volume" value={params.loudnessRate} min={0.5} max={2} step={0.1} center={1} format={(n) => n.toFixed(1)} info="Loudness of the output (0.5–2.0). 1.0 is the normal level." onChange={(n) => set({ loudnessRate: n })} />
      <ParamSlider label="Pitch" value={params.pitchRate} min={-12} max={12} info="Voice height in semitones (−12 to +12). Minus = deeper, plus = higher. 0 = unchanged, speed stays the same." onChange={(n) => set({ pitchRate: n })} />
      <Field label="Output Format">
        <div className="flex rounded-lg bg-[#f3f3f5] p-0.5">
          {(["mp3", "wav"] as const).map((f) => (
            <button key={f} onClick={() => set({ format: f })} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold uppercase transition ${params.format === f ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#6a6b7b]"}`}>{f}</button>
          ))}
        </div>
      </Field>
      <label className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1a1a2e]">Enable subtitle</span>
        <input type="checkbox" checked={params.enableSubtitle} onChange={(e) => set({ enableSubtitle: e.target.checked })} className="size-4 accent-[#ff5e1a]" />
      </label>
    </div>
  );
}

// 固定 mock 波形(避免 hydration mismatch:用确定性伪随机,不用 Math.random 直出)
const BARS = Array.from({ length: 48 }, (_, i) => 6 + Math.round(18 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))));

export function AudioPlayer({ durationSec, onRegenerate, hideActions = false }: { durationSec: number; onRegenerate?: () => void; hideActions?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0); // seconds elapsed
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) { if (raf.current) clearInterval(raf.current); return; }
    raf.current = setInterval(() => {
      setT((prev) => {
        const next = prev + 0.1;
        if (next >= durationSec) { setPlaying(false); return durationSec; }
        return next;
      });
    }, 100);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [playing, durationSec]);

  function toggle() {
    if (t >= durationSec) setT(0);
    setPlaying((p) => !p);
  }
  const pct = durationSec ? t / durationSec : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#faf8f6] p-3">
      <button onClick={toggle} className={`grid size-9 shrink-0 place-items-center rounded-full ${ctaGrad} text-white shadow-[0_6px_16px_rgba(255,82,85,0.3)]`}>
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
        {BARS.map((h, i) => {
          const played = i / BARS.length <= pct;
          return <span key={i} className="w-[3px] rounded-full transition-colors" style={{ height: h, background: played ? "#ff5e1a" : "#d4d3df" }} />;
        })}
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-[#6a6b7b]">{fmt(t)} / {fmt(durationSec)}</span>
      {!hideActions && (
        <div className="flex shrink-0 gap-1">
          <button className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#f3f3f5]" aria-label="Download"><Download className="size-4" /></button>
          <button onClick={onRegenerate} disabled={!onRegenerate} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#f3f3f5] disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Regenerate"><RotateCcw className="size-4" /></button>
        </div>
      )}
    </div>
  );
}

