"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, Play, Pause, Download, RotateCcw, Check, Volume2, Info, Mic, X, Sparkles, Upload,
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
};

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
  sampleRate: 24000,
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
export function VoiceModal({ value, onChange, onClose }: { value: Voice | null; onChange: (v: Voice) => void; onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: APPLE_FONT }}>
      <div className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_30px_80px_rgba(26,26,46,0.25)]">
        {/* header */}
        <div className="relative flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="relative z-10">
            <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-[#1a1a2e]">Select or add a voice</h2>
            <p className="mt-1 text-sm text-[#6a6b7b]">Select from presets, record your own, or upload an audio.</p>
            <div className="mt-4 flex gap-2">
              <button className={`flex items-center gap-1.5 rounded-xl ${ctaGrad} px-4 py-2 text-sm font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105`}>
                Create custom voice <Sparkles className="size-4" />
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-sm font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]">
                <Upload className="size-4" /> Upload
              </button>
            </div>
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

        {/* voice cards */}
        <div className="grid grid-cols-2 gap-3 overflow-auto border-t border-[#ececf1] p-5 sm:grid-cols-3 lg:grid-cols-4">
          {VOICES.map((v, idx) => {
            const active = value?.id === v.id;
            const playing = preview === v.id;
            return (
              <button
                key={v.id}
                onClick={() => { onChange(v); onClose(); }}
                className={`flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition ${active ? "border-[#ff5e1a] bg-[#fff7f1] shadow-[0_0_0_1px_#ff5e1a,0_10px_28px_rgba(255,94,26,0.14)]" : "border-[#ececf1] bg-white hover:-translate-y-0.5 hover:border-[#d4d3df] hover:shadow-[0_10px_24px_rgba(26,26,46,0.08)]"}`}
              >
                <div className="flex items-start justify-between">
                  <span className="size-9 rounded-xl" style={{ background: VOICE_SWATCH[idx % VOICE_SWATCH.length] }} />
                  {active && <Check className="size-4 text-[#ff5e1a]" />}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#9a9aa8]">{v.gender}</p>
                  <p className="text-[15px] font-bold uppercase tracking-wide text-[#ff5e1a]" style={{ fontFamily: MONO_FONT }}>{v.name}</p>
                </div>
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
              </button>
            );
          })}
        </div>
      </div>
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
        {value ? `${value.name} · ${value.style}` : <span className="text-[#9a9aa8]">Select a voice</span>}
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

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="size-3.5 cursor-help text-[#b4b4c0]" />
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-52 rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-[0_8px_22px_rgba(26,26,46,0.24)] group-hover:block">
        {text}
      </span>
    </span>
  );
}

function ParamSlider({ label, value, min, max, step = 1, format, info, onChange }: { label: string; value: number; min: number; max: number; step?: number; format?: (n: number) => string; info?: string; onChange: (n: number) => void }) {
  const display = format ? format(value) : value > 0 ? `+${value}` : `${value}`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-semibold text-[#1a1a2e]">
        <span className="flex items-center gap-1.5">{label}{info && <InfoHint text={info} />}</span>
        <span className="tabular-nums text-[#6a6b7b]">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(a) => onChange(a[0])} />
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
        <span>{current.label}</span>
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
  { value: 24000, label: "24000 Hz", desc: "default — fine for voice" },
  { value: 32000, label: "32000 Hz", desc: "near-CD" },
  { value: 44100, label: "44100 Hz", desc: "CD quality" },
  { value: 48000, label: "48000 Hz", desc: "video / studio" },
];

function SampleRatePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
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
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1a1a2e]">Voice</span>
          <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[#ff5e1a] hover:underline">
            <Mic className="size-3.5" /> Clone voice
          </button>
        </div>
        <VoicePicker value={voice} onChange={onVoice} fullWidth />
      </div>
      <Field label="Sample Rate">
        <SampleRatePicker value={params.sampleRate} onChange={(n) => set({ sampleRate: n })} />
      </Field>
      <ParamSlider label="Speed" value={params.speechRate} min={0.5} max={2} step={0.1} format={(n) => `${n.toFixed(1)}x`} info="How fast the voice talks (0.5x–2.0x). 1.0 is normal — below slows down, above speeds up." onChange={(n) => set({ speechRate: n })} />
      <ParamSlider label="Volume" value={params.loudnessRate} min={0.5} max={2} step={0.1} format={(n) => n.toFixed(1)} info="Loudness of the output (0.5–2.0). 1.0 is the normal level." onChange={(n) => set({ loudnessRate: n })} />
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

