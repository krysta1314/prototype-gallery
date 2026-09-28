"use client";

/* 自动生成字幕:时间线没有字幕时,字幕轨上出现空状态入口,点开这个弹窗。
   有未生成的 AI 镜头先提示(它们还没有声音,识别不到);点 Auto-generate 走语音识别(STT):
   浏览器按片段的裁剪范围把视频原声抽成 16kHz 单声道 wav → /api/hybrid-reel/stt(BytePlus Seed Speech ASR 快速模式)
   → 返回的每句话起止时间换算到时间线上(变速的片段按速度折算)。 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { clipLen, type Clip, type Project } from "./project";
import { FOCUS } from "./ui";
import { DropdownSelect } from "@/components/ui/dropdown-select";

/* 识别语言:按投放市场常用的 10 种;接口代码见 src/lib/hybrid-reel/stt.ts */
const LANGS = [
  { id: "en", label: "English" },
  { id: "zh", label: "Mandarin Chinese" },
  { id: "yue", label: "Cantonese" },
  { id: "es", label: "Spanish" },
  { id: "pt", label: "Portuguese" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" },
  { id: "ar", label: "Arabic" },
] as const;

/** 写回时间线的一条字幕:文本 + 在片段内的起止(秒,时间线时间) */
export type AutoSub = { text: string; subIn: number; subOut: number };

export function AutoSubDialog({
  project,
  defaultLang = "en",
  onApply,
  onGenerateAll,
  onClose,
  replacing = false,
}: {
  project: Project;
  defaultLang?: string;
  /** 时间线上已经有字幕:这次是重新识别,会整批替换 */
  replacing?: boolean;
  /** 写回字幕:片段 id → 字幕 */
  onApply: (subs: Record<string, AutoSub>) => void;
  onGenerateAll: () => void;
  onClose: () => void;
}) {
  const [lang, setLang] = useState(defaultLang);
  const [stage, setStage] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ added: number; silent: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  /* 按镜头分段、已经生成好的配音:这个镜头识别配音,不识别原声 */
  const voiceOf = (c: Clip) => (project.voice ?? []).find((v) => v.clipId === c.id && v.url);
  /* 有声音可识别的片段:有配音的镜头,或者已就绪的视频(图片没有声音) */
  const withFootage = project.clips.filter((c) => {
    if (voiceOf(c)) return true;
    const a = project.assets.find((x) => x.id === c.assetId);
    return a?.status === "ready" && a.url && a.kind === "video";
  });
  const pendingAi = project.assets.filter((a) => a.origin === "ai" && a.kind === "video" && a.status !== "ready");
  const pendingClips = project.clips.filter((c) => !voiceOf(c) && pendingAi.some((a) => a.id === c.assetId)).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stage !== "running" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, stage]);

  const run = async () => {
    setStage("running");
    setError("");
    setProgress({ done: 0, total: withFootage.length });
    const subs: Record<string, AutoSub> = {};
    let silent = 0;
    let failed = 0;
    let lastError = "";
    /* 同一个素材被切成几段时只解码一次 */
    const decoded = new Map<string, Promise<AudioBuffer | null>>();
    for (const [i, c] of withFootage.entries()) {
      const vo = voiceOf(c);
      const url = vo?.url ?? project.assets.find((x) => x.id === c.assetId)!.url!;
      try {
        if (!decoded.has(url)) decoded.set(url, decodeAudio(url));
        const buf = await decoded.get(url)!;
        if (!buf) {
          silent++;
        } else {
          /* 配音从镜头开头念起,整句都要;原声按片段的裁剪范围截 */
          const wav = vo ? await sliceWav(buf, 0, buf.duration) : await sliceWav(buf, c.inSec, c.outSec);
          const res = await fetch("/api/hybrid-reel/stt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: wav, language: lang }),
          });
          const data = (await res.json()) as { utterances?: { start: number; end: number; text: string }[]; error?: string };
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          /* 配音的时间已经是时间线秒数;toSub 会按片段速度折算,先乘回去 */
          const utt = (data.utterances ?? []).map((u) => (vo ? { ...u, start: u.start * c.speed, end: u.end * c.speed } : u));
          const sub = toSub(c, utt);
          if (sub) subs[c.id] = sub;
          else silent++;
        }
      } catch (e) {
        failed++;
        lastError = e instanceof Error ? e.message : String(e);
      }
      setProgress({ done: i + 1, total: withFootage.length });
    }
    if (failed > 0 && failed === withFootage.length) {
      setError(lastError);
      setStage("error");
      return;
    }
    onApply(subs);
    setResult({ added: Object.keys(subs).length, silent, failed });
    setStage("done");
  };

  return createPortal(
    <div className="fixed inset-0 z-[260] grid place-items-center bg-[rgba(26,26,46,0.45)] px-4" onPointerDown={() => stage !== "running" && onClose()}>
      <div
        role="dialog"
        aria-label="Auto-generate subtitles"
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.28)]"
      >
        {/* 标题 + 一句说明,不加图标方块:和剪辑器里其他弹窗同一个样子 */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold">{replacing ? "Regenerate subtitles" : "Auto-generate subtitles"}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6a6b7b]">
              Subtitles come from the voiceover, or from the clip&apos;s own audio where there&apos;s no voiceover. You can edit every line afterwards.
              {replacing && " Your current subtitles will be replaced."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={stage === "running"}
            className={`-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] disabled:opacity-30 ${FOCUS}`}
          >
            <X className="size-4" />
          </button>
        </div>

        {stage === "error" ? (
          <>
            <div className="mt-5 flex gap-2.5 rounded-xl bg-[#fff5f4] p-3 text-[13px] leading-snug ring-1 ring-inset ring-[#f3c4c0]">
              <AlertTriangle className="mt-px size-4 shrink-0 text-[#d0342c]" />
              <div className="min-w-0">
                <p className="font-semibold text-[#1a1a2e]">Couldn&apos;t transcribe your clips</p>
                <p className="mt-0.5 break-words text-[#6a6b7b]">{error}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg px-4 py-2 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void run()}
                className={`rounded-lg bg-[#1a1a2e] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2c2c44] ${FOCUS} focus-visible:ring-offset-2`}
              >
                Try again
              </button>
            </div>
          </>
        ) : stage !== "done" ? (
          <>
            <div className="mt-5">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#4a4b5c]">Spoken language</span>
              <DropdownSelect
                label="Spoken language"
                size="sm"
                value={lang}
                onChange={setLang}
                disabled={stage === "running"}
                options={LANGS.map((l) => ({ value: l.id as string, label: l.label }))}
              />
            </div>

            {/* 还有没生成的 AI 镜头:一行说明 + 文字按钮,不做成彩色提示框 */}
            {pendingClips > 0 && (
              <p className="mt-4 flex gap-2 text-[13px] leading-relaxed text-[#4a4b5c]">
                <AlertTriangle className="mt-[3px] size-3.5 shrink-0 text-[#b45309]" />
                <span>
                  {pendingClips} AI {pendingClips === 1 ? "shot isn't" : "shots aren't"} generated yet and will be skipped.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      onGenerateAll();
                      onClose();
                    }}
                    disabled={stage === "running"}
                    className="font-semibold text-[#1a1a2e] underline decoration-[#c9cad4] underline-offset-2 transition hover:decoration-[#1a1a2e] disabled:opacity-40"
                  >
                    Generate {pendingAi.length === 1 ? "it" : "them"} first ({pendingAi.length * project.creditsPerShot} credits)
                  </button>
                </span>
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={stage === "running"}
                className={`rounded-lg px-4 py-2 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] disabled:opacity-40 ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void run()}
                disabled={stage === "running" || withFootage.length === 0}
                className={`flex min-w-[148px] items-center justify-center gap-1.5 rounded-lg bg-[#1a1a2e] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2c2c44] disabled:opacity-60 ${FOCUS} focus-visible:ring-offset-2`}
              >
                {stage === "running" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Transcribing {Math.min(progress.done + 1, progress.total)} of {progress.total}
                  </>
                ) : replacing ? (
                  "Regenerate"
                ) : (
                  "Generate subtitles"
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 flex gap-2 text-[13px] leading-relaxed">
              <CheckCircle2 className="mt-[3px] size-3.5 shrink-0 text-[#1f9d6b]" />
              <div>
                <p className="font-semibold text-[#1a1a2e]">
                  {result?.added
                    ? `Added subtitles to ${result.added} ${result.added === 1 ? "clip" : "clips"}`
                    : "No speech found in your clips"}
                </p>
                <p className="mt-0.5 text-[#6a6b7b]">
                  {[
                    result?.silent ? `${result.silent} ${result.silent === 1 ? "clip has" : "clips have"} no speech` : "",
                    result?.failed ? `${result.failed} couldn't be transcribed` : "",
                    pendingClips ? `${pendingClips} not generated yet` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Click a subtitle on the timeline to edit it."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg bg-[#1a1a2e] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2c2c44] ${FOCUS} focus-visible:ring-offset-2`}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── 抽原声 ── */

/** 整段素材解码成音频;没有音轨的视频返回 null(当作没有人声) */
async function decodeAudio(url: string): Promise<AudioBuffer | null> {
  const data = await (await fetch(url)).arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(data);
  } catch {
    return null;
  } finally {
    void ctx.close();
  }
}

/** 截出片段用到的那一段原声 [inSec, outSec],重采样成 16kHz 单声道 16bit wav,返回 base64 */
async function sliceWav(buf: AudioBuffer, inSec: number, outSec: number): Promise<string> {
  const RATE = 16000;
  const start = Math.max(0, Math.min(inSec, buf.duration));
  const dur = Math.max(0.1, Math.min(outSec, buf.duration) - start);
  const off = new OfflineAudioContext(1, Math.ceil(dur * RATE), RATE);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0, start, dur);
  const pcm = (await off.startRendering()).getChannelData(0);

  const bytes = new Uint8Array(44 + pcm.length * 2);
  const v = new DataView(bytes.buffer);
  const str = (o: number, t: string) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.length * 2, true);
  pcm.forEach((x, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 0x7fff, true));

  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** 识别出的句子 → 这个片段的字幕:文本拼起来,起止按片段速度换算到时间线,首尾各留一点余量 */
function toSub(c: Clip, utterances: { start: number; end: number; text: string }[]): AutoSub | null {
  if (!utterances.length) return null;
  const cjk = utterances.some((u) => /[぀-ヿ一-鿿가-힯]/.test(u.text));
  const text = utterances.map((u) => u.text).join(cjk ? "" : " ");
  const len = clipLen(c);
  const subIn = Math.max(0, utterances[0].start / c.speed - 0.05);
  const subOut = Math.min(len, utterances[utterances.length - 1].end / c.speed + 0.15);
  return { text, subIn, subOut: Math.max(subOut, Math.min(len, subIn + 0.5)) };
}
