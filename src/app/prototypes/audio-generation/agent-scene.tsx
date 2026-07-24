"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pencil, Download, RotateCcw, MoreHorizontal, Hash, Check, Plus, ArrowUp,
  BarChart3, Radio, Gauge, Volume2, Music2, FileAudio, Mic, AudioLines, ChevronDown,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AudioPlayer, VoiceModal, InfoHint, AUDIO_MODELS, SAMPLE_RATES, DEFAULT_PARAMS, type Voice, type GenParams, ctaGrad } from "./shared";

const PROMPT = "Generate a voiceover for my summer sale ad — warm, upbeat, ~5s.";
const META = "seed-audio-1.0 · Aria · Warm · 24000 Hz";

const TAKES = [
  { label: "Take 1", duration: 5 },
  { label: "Take 2", duration: 6 },
];

function ResultCard({ duration }: { duration: number }) {
  return (
    <div className="relative flex-1 rounded-2xl border border-[#ececf1] bg-white p-3 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
      <div className="mb-2 flex justify-end gap-0.5">
        {[
          { icon: Download, label: "Download" },
          { icon: RotateCcw, label: "Regenerate" },
          { icon: Hash, label: "Add to canvas" },
          { icon: MoreHorizontal, label: "More" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} aria-label={label} className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]">
            <Icon className="size-3.5" />
          </button>
        ))}
      </div>
      <AudioPlayer durationSec={duration} hideActions />
    </div>
  );
}

/** A compact param chip in the composer toolbar; click opens a small popover. */
function Chip({ icon: Icon, label, align = "left", children }: { icon: React.ComponentType<{ className?: string }>; label: string; align?: "left" | "right"; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${open ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]" : "border-[#ececf1] text-[#1a1a2e] hover:bg-[#faf8f6]"}`}
      >
        <Icon className={`size-3.5 ${open ? "text-[#ff5e1a]" : "text-[#6a6b7b]"}`} />
        {label}
      </button>
      {open && (
        <div className={`absolute bottom-full z-30 mb-1.5 rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_36px_rgba(26,26,46,0.16)] ${align === "right" ? "right-0" : "left-0"}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function SliderPopover({ label, info, value, min, max, step = 1, format, onChange }: { label: string; info?: string; value: number; min: number; max: number; step?: number; format: (n: number) => string; onChange: (n: number) => void }) {
  return (
    <div className="w-56 p-2">
      <div className="mb-2 flex justify-between text-xs font-semibold text-[#1a1a2e]">
        <span className="flex items-center gap-1.5">{label}{info && <InfoHint text={info} />}</span>
        <span className="tabular-nums text-[#6a6b7b]">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(a) => onChange(a[0])} />
    </div>
  );
}

/** Composer with all audio params attached as chips — generation is configured & triggered from the input box (图2). */
function Composer() {
  const [voice, setVoice] = useState<Voice | null>(null);
  const [params, setParams] = useState<GenParams>(DEFAULT_PARAMS);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const set = (patch: Partial<GenParams>) => setParams((p) => ({ ...p, ...patch }));
  const optionItem = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-[#1a1a2e] ${active ? "bg-[#fff3ec]" : "hover:bg-[#faf8f6]"}`;

  return (
    <div className="sticky bottom-14 mt-6 rounded-2xl border border-[#ececf1] bg-white p-2.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
      {voiceOpen && <VoiceModal value={voice} onChange={setVoice} onClose={() => setVoiceOpen(false)} />}

      {/* voice reference tile inline before the prompt text */}
      <div className="mb-1.5 flex items-start gap-2 px-1">
        <button
          onClick={() => setVoiceOpen(true)}
          className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[#ececf1] bg-[#faf8f6] px-2 py-2 text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
        >
          <AudioLines className="size-4" />
          <span className="flex max-w-full items-center gap-0.5 text-[11px] font-semibold">
            <span className="truncate">{voice ? voice.name : "Voice"}</span>
            <ChevronDown className="size-3 shrink-0" />
          </span>
        </button>
        <input
          placeholder="Describe the sound you imagine… Type @ to reference attachments"
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-[#1a1a2e] outline-none placeholder:text-[#9a9aa8]"
        />
      </div>

      {/* param chip toolbar */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button aria-label="Add attachment" className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#ececf1] text-[#6a6b7b] hover:bg-[#faf8f6]">
          <Plus className="size-4" />
        </button>

        <Chip icon={BarChart3} label={params.model}>
          {(close) => (
            <div className="w-64">
              <div className="px-2.5 pb-1 pt-0.5 text-xs font-bold uppercase tracking-wide text-[#6a6b7b]">Audio Model</div>
              {AUDIO_MODELS.map((m) => (
                <button key={m.value} onClick={() => { set({ model: m.value }); close(); }} className={optionItem(params.model === m.value)}>
                  <span className="flex-1">{m.label}</span>
                  {params.model === m.value && <Check className="size-4 text-[#ff5e1a]" />}
                </button>
              ))}
            </div>
          )}
        </Chip>

        <Chip icon={Radio} label={`${params.sampleRate} Hz`}>
          {(close) => (
            <div className="w-56">
              <div className="px-2.5 pb-1 pt-0.5 text-xs font-bold uppercase tracking-wide text-[#6a6b7b]">Sample Rate</div>
              <div className="max-h-60 overflow-auto">
              {SAMPLE_RATES.map((r) => (
                <button key={r.value} onClick={() => { set({ sampleRate: r.value }); close(); }} className={optionItem(params.sampleRate === r.value)}>
                  <span className="flex-1">
                    <span className="block">{r.label}</span>
                    <span className="block text-xs font-normal text-[#6a6b7b]">{r.desc}</span>
                  </span>
                  {params.sampleRate === r.value && <Check className="size-4 shrink-0 text-[#ff5e1a]" />}
                </button>
              ))}
              </div>
            </div>
          )}
        </Chip>

        <Chip icon={Gauge} label={`${params.speechRate.toFixed(1)}x`}>
          {() => <SliderPopover label="Speed" info="How fast the voice talks (0.5x–2.0x). 1.0 is normal — below slows down, above speeds up." value={params.speechRate} min={0.5} max={2} step={0.1} format={(n) => `${n.toFixed(1)}x`} onChange={(n) => set({ speechRate: n })} />}
        </Chip>

        <Chip icon={Volume2} label={params.loudnessRate.toFixed(1)}>
          {() => <SliderPopover label="Volume" info="Loudness of the output (0.5–2.0). 1.0 is the normal level." value={params.loudnessRate} min={0.5} max={2} step={0.1} format={(n) => n.toFixed(1)} onChange={(n) => set({ loudnessRate: n })} />}
        </Chip>

        <Chip icon={Music2} label={params.pitchRate > 0 ? `+${params.pitchRate}` : `${params.pitchRate}`}>
          {() => <SliderPopover label="Pitch" info="Voice height in semitones (−12 to +12). Minus = deeper, plus = higher. 0 = unchanged, speed stays the same." value={params.pitchRate} min={-12} max={12} format={(n) => (n > 0 ? `+${n}` : `${n}`)} onChange={(n) => set({ pitchRate: n })} />}
        </Chip>

        <Chip icon={FileAudio} label={params.format.toUpperCase()}>
          {(close) => (
            <div className="w-40">
              <div className="px-2.5 pb-1 pt-0.5 text-xs font-bold uppercase tracking-wide text-[#6a6b7b]">Output Format</div>
              {(["mp3", "wav"] as const).map((f) => (
                <button key={f} onClick={() => { set({ format: f }); close(); }} className={optionItem(params.format === f)}>
                  <span className="flex-1 uppercase">{f}</span>
                  {params.format === f && <Check className="size-4 text-[#ff5e1a]" />}
                </button>
              ))}
            </div>
          )}
        </Chip>

        {/* divider + clone voice entry */}
        <div className="mx-0.5 h-5 w-px shrink-0 bg-[#ececf1]" />
        <button onClick={() => setCloneOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:bg-[#faf8f6]">
          <Mic className="size-3.5 text-[#6a6b7b]" /> Clone voice
        </button>
        {cloneOpen && <VoiceModal value={voice} onChange={setVoice} onClose={() => setCloneOpen(false)} initialTab="mine" />}

        {/* generate */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button aria-label="Generate" className={`grid size-9 shrink-0 place-items-center rounded-xl ${ctaGrad} text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105`}>
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentScene() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-53px)] max-w-5xl flex-col px-4 py-8">
      <div className="flex-1 space-y-6">
        {/* user message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-md border border-[#ececf1] bg-white px-4 py-2.5 text-sm text-[#1a1a2e]">
            {PROMPT}
          </div>
        </div>

        {/* agent result */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-[#1a1a2e]">{PROMPT}</span>
            <span className="text-xs text-[#9a9aa8]">{META}</span>
          </div>
          <div className="flex gap-3">
            {TAKES.map((t) => (
              <ResultCard key={t.label} duration={t.duration} />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button className="flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2 text-sm font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]">
              <Pencil className="size-3.5" /> Edit
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2 text-sm font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]">
              <RotateCcw className="size-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>

      <Composer />
    </div>
  );
}
