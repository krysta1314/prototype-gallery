"use client";

/* Voice Enhancer 工具页(入口:侧边栏 Audio › Voice Enhancer;spec 2026-11-04 §6)。版式同 Upscale Image(ToolLayout)。
   左栏:上传音频或视频(视频处理它的音轨)→ Noise removal(默认开)/ Echo & reverb removal / Volume leveling + 强度 Low / Medium / High
        → Generate(按时长计积分)。
   右侧:原声卡(波形 + 试听)→ 每次生成一张结果卡:Original / Enhanced A/B 切换播放(切换时接着当前位置放),两条波形对比;
        导出 WAV(真文件,前端编码)/ MP3;上传的是视频时多一个「Video」= 换上处理后音轨的视频(模拟)。
   样例:voice-sample.mp3(仓库里 en-1/2/3 三句英文配音拼成,16s)是干净人声;「原声」= 前端给它加上忽大忽小的音量 + 回声 + 底噪(Web Audio 解码后现算),
        「处理后」按选项把三样各自去掉 / 留一点(见 voice/logic.ts),所以 A/B 对比和强度差别都是真的能听出来的。
   自己上传的:原声 = 文件本身;处理后 = 简化版(噪声门 + 分段响度拉平,回声原型里不处理)。 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AudioWaveform, CircleAlert, Download, FileAudio, Film, Loader2, Pause, Play, X, ArrowRight } from "lucide-react";
import type { ToolsApi } from "../tools/api";
import { jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import { saveBlob } from "../tools/media";
import { downloadWithProgress } from "../files";
import { formatClock } from "../video-resize/logic";
import type { Notify } from "../components/TopToast";
import { DemoTile, ToolEmptyDemo, FieldLabel, RunningTile, Segmented, ToolLayout, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import { SourceUpload } from "../components/SourceUpload";
import {
  AUDIO_TYPES,
  DEFAULT_OPTS,
  MAX_AUDIO_SECONDS,
  VIDEO_TYPES_AV,
  anyOption,
  baseName,
  encodeWav,
  enhanceCredits,
  enhanceUpload,
  fileKind,
  mixEnhanced,
  mixOriginal,
  optsSummary,
  peaks,
  sameOpts,
  sampleParts,
  type EnhanceOpts,
  type SampleParts,
  type Strength,
} from "./logic";

const BARS = 140;

type Source = {
  id: string;
  name: string;
  kind: "audio" | "video";
  /** 原文件(MP3 / 视频导出用) */
  url: string;
  sampleRate: number;
  duration: number;
  original: Float32Array;
  /** 样例才有:拆开的干净人声 / 包络 / 回声 / 底噪 */
  parts: SampleParts | null;
};
type Input = { sourceId: string; opts: EnhanceOpts };
type Job = ToolJob<Input>;
type Which = "original" | "enhanced";

const STRENGTHS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const newId = () => `ve-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

let ctxSingleton: AudioContext | null = null;
const audioCtx = () => (ctxSingleton ??= new AudioContext());

/** 解码成单声道 */
async function decode(buf: ArrayBuffer): Promise<{ data: Float32Array; sampleRate: number } | null> {
  try {
    const ab = await audioCtx().decodeAudioData(buf);
    const n = ab.length;
    const out = new Float32Array(n);
    for (let c = 0; c < ab.numberOfChannels; c++) {
      const ch = ab.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += ch[i] / ab.numberOfChannels;
    }
    return { data: out, sampleRate: ab.sampleRate };
  } catch {
    return null;
  }
}

/** 一个页面同一时间只放一段:key = 哪张卡 + 原声 / 处理后 */
function usePlayer() {
  const src = useRef<AudioBufferSourceNode | null>(null);
  const [state, setState] = useState<{ key: string; which: Which; at: number; startedAt: number } | null>(null);
  const [pos, setPos] = useState(0);
  const raf = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (src.current) {
      src.current.onended = null;
      try {
        src.current.stop();
      } catch {
        /* 已经停了 */
      }
      src.current = null;
    }
    setState(null);
  }, []);

  const play = useCallback(
    (key: string, which: Which, data: Float32Array, sampleRate: number, offset: number) => {
      stop();
      const ctx = audioCtx();
      void ctx.resume();
      const ab = ctx.createBuffer(1, data.length, sampleRate);
      ab.copyToChannel(new Float32Array(data), 0);
      const node = ctx.createBufferSource();
      node.buffer = ab;
      node.connect(ctx.destination);
      const dur = data.length / sampleRate;
      const at = offset >= dur - 0.05 ? 0 : offset;
      node.start(0, at);
      node.onended = () => {
        if (src.current === node) {
          src.current = null;
          cancelAnimationFrame(raf.current);
          setState(null);
          setPos(0);
        }
      };
      src.current = node;
      const startedAt = ctx.currentTime;
      setState({ key, which, at, startedAt });
      const tick = () => {
        setPos(at + (ctx.currentTime - startedAt));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);
  /** 当前播放位置(按音频时钟算,不靠 rAF 刷新的 pos) */
  const now = useCallback(() => (state ? state.at + (audioCtx().currentTime - state.startedAt) : 0), [state]);
  return { state, pos, play, stop, now };
}

function Waveform({
  data,
  label,
  tone,
  active,
  progress,
  onSeek,
}: {
  data: number[];
  label: string;
  tone: "grey" | "orange";
  active: boolean;
  progress: number | null;
  onSeek: (ratio: number) => void;
}) {
  const fill = tone === "orange" ? "#ff5e1a" : "#9a9bb0";
  return (
    <div className={`transition ${active ? "opacity-100" : "opacity-45"}`}>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#9a9bb0]">
        <span className={active ? (tone === "orange" ? "text-[#ff5e1a]" : "text-[#4a4b5c]") : ""}>{label}</span>
      </div>
      <button
        type="button"
        aria-label={`Seek in ${label} waveform`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
        }}
        className="relative block h-14 w-full cursor-pointer rounded-lg bg-[#f7f8fa] outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
      >
        <svg viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none" className="absolute inset-x-1.5 inset-y-1 h-[calc(100%-8px)] w-[calc(100%-12px)]" aria-hidden="true">
          {data.map((p, i) => {
            const h = Math.max(2, p * 96);
            return <rect key={i} x={i + 0.15} y={50 - h / 2} width={0.7} height={h} rx={0.3} fill={fill} />;
          })}
        </svg>
        {progress !== null && <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#1a1a2e]" style={{ left: `calc(6px + (100% - 12px) * ${progress})` }} />}
      </button>
    </div>
  );
}

export function VoiceEnhancerTool({
  api,
  wallet,
  notify: say,
  onMenu,
  onInvite,
}: {
  api: ToolsApi;
  wallet: Wallet;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [opts, setOpts] = useState<EnhanceOpts>(DEFAULT_OPTS);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  /** 结果的处理后音频(job id → 采样) */
  const [enhanced, setEnhanced] = useState<Record<string, { data: Float32Array; peaks: number[] }>>({});
  const [ab, setAb] = useState<Record<string, Which>>({});
  const [exporting, setExporting] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const player = usePlayer();
  const remux = useRef(new Set<AbortController>());
  useEffect(() => {
    const set = remux.current;
    return () => set.forEach((a) => a.abort());
  }, []);

  const results = jobs.filter((j) => j.input.sourceId === source?.id).reverse();
  const running = results.some((j) => j.status === "running");

  useJobRunner({
    jobs,
    api,
    task: () => "voice-enhance",
    onDone: (j) => {
      if (!source || j.input.sourceId !== source.id) return dispatch({ type: "done", id: j.id });
      const out = source.parts ? mixEnhanced(source.parts, j.input.opts) : enhanceUpload(source.original, source.sampleRate, j.input.opts);
      setEnhanced((m) => ({ ...m, [j.id]: { data: out, peaks: peaks(out, BARS) } }));
      setAb((m) => ({ ...m, [j.id]: "enhanced" }));
      dispatch({ type: "done", id: j.id });
      say("Your audio is cleaned up", "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say("Enhancing failed. Your credits have been refunded.", "error");
    },
  });

  const load = async (name: string, kind: "audio" | "video", url: string, getBuf: () => Promise<ArrayBuffer>, isSample: boolean) => {
    player.stop();
    setLoading(name);
    let buf: ArrayBuffer;
    try {
      buf = await getBuf();
    } catch {
      setLoading(null);
      return say("We couldn't read this file. Try another one.", "error");
    }
    const d = await decode(buf);
    setLoading(null);
    if (!d || !d.data.length) return say(kind === "video" ? "We couldn't find an audio track in this video." : "We couldn't read this audio. Try another file.", "error");
    const duration = d.data.length / d.sampleRate;
    if (duration > MAX_AUDIO_SECONDS + 0.5) return say(`Files can be up to ${MAX_AUDIO_SECONDS / 60} minutes for now.`, "error");
    const parts = isSample ? sampleParts(d.data, d.sampleRate) : null;
    setSource({ id: newId(), name, kind, url, sampleRate: d.sampleRate, duration, original: parts ? mixOriginal(parts) : d.data, parts });
    dispatch({ type: "reset" });
    setEnhanced({});
    setAb({});
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const kind = fileKind(file.name);
    if (!kind) return say("Use MP3, WAV, M4A, AAC, OGG, or an MP4, MOV, WEBM or M4V video.", "error");
    void load(file.name, kind, URL.createObjectURL(file), () => file.arrayBuffer(), false);
  };

  const clear = () => {
    player.stop();
    setSource(null);
    dispatch({ type: "reset" });
    setEnhanced({});
    setAb({});
  };

  const cost = source ? enhanceCredits(source.duration) : null;
  const generate = () => {
    if (!source || !anyOption(opts) || cost === null || running) return;
    if (!wallet.charge(cost)) return;
    dispatch({ type: "start", now: nowMs(), jobs: [{ id: newId(), batch: newId(), cost, input: { sourceId: source.id, opts } }] });
  };
  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };

  /* ---------- 导出 ---------- */
  const setBusy = (id: string, v: string | null) =>
    setExporting((m) => {
      const n = { ...m };
      if (v === null) delete n[id];
      else n[id] = v;
      return n;
    });
  const exportWav = (j: Job) => {
    const data = enhanced[j.id]?.data;
    if (!source || !data) return;
    saveBlob(new Blob([encodeWav(data, source.sampleRate)], { type: "audio/wav" }), `${baseName(source.name)}-enhanced.wav`);
  };
  const exportFile = async (j: Job, kind: "mp3" | "video") => {
    if (!source || exporting[j.id]) return;
    const name = `${baseName(source.name)}-enhanced.${kind === "mp3" ? "mp3" : source.name.split(".").pop()?.toLowerCase() || "mp4"}`;
    if (kind === "video") {
      /* 换音轨(模拟):先跑一会儿,再下载原视频文件(按导出名命名) */
      setBusy(j.id, "Preparing video…");
      const ac = new AbortController();
      remux.current.add(ac);
      const ok = await api.run("remux", { signal: ac.signal }).then(
        () => true,
        () => false,
      );
      remux.current.delete(ac);
      if (ac.signal.aborted) return;
      if (!ok) {
        setBusy(j.id, null);
        return say("Couldn't export the video. Try again.", "error", () => void exportFile(j, kind));
      }
    }
    setBusy(j.id, "0%");
    /* 原型:MP3 = 样例的干净人声文件 / 自己上传的原文件;视频 = 原视频文件 */
    const ok = await downloadWithProgress(source.url, name, (p) => setBusy(j.id, `${p}%`));
    setBusy(j.id, null);
    if (!ok) say("Download failed — try again", "error", () => void exportFile(j, kind));
    else if (kind === "video") say("Video exported with the cleaned-up audio", "success");
  };

  /* ---------- 左栏 ---------- */
  const toggle = (key: "noise" | "echo" | "level", label: string, desc: string) => (
    <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ececf1] p-3 transition hover:border-[#c9cad4]">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[#1a1a2e]">{label}</span>
        <span className="block text-[12px] leading-snug text-[#9a9bb0]">{desc}</span>
      </span>
      <input type="checkbox" role="switch" checked={opts[key]} onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-[#dcdde3] transition after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-[#ff5e1a] peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff5e1a]/40"
      />
    </label>
  );

  const uploadSlot = loading ? (
    <div role="status" className="flex h-[88px] items-center justify-center gap-2 rounded-xl bg-[#f7f8fa] text-[13px] text-[#6a6b7b] ring-1 ring-[#ececf1]">
      <Loader2 className="size-4 animate-spin text-[#ff5e1a]" /> Reading {loading}…
    </div>
  ) : source ? (
    <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-2.5 ring-1 ring-[#ececf1]">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]">{source.kind === "video" ? <Film className="size-5" /> : <FileAudio className="size-5" />}</span>
      <div className="min-w-0 flex-1 text-[12px]">
        <p className="truncate font-semibold text-[#1a1a2e]" title={source.name}>
          {source.name}
        </p>
        <p className="tabular-nums text-[#9a9bb0]">
          {formatClock(source.duration)} · {source.kind === "video" ? "Video · we clean its audio" : "Audio"}
        </p>
        <button type="button" onClick={() => fileRef.current?.click()} className="mt-0.5 font-semibold text-[#ff5e1a] hover:underline">
          Replace
        </button>
      </div>
      <button type="button" aria-label="Remove file" onClick={clear} className="grid size-6 shrink-0 place-items-center self-start rounded-full bg-[#1a1a2e]/70 text-white transition hover:bg-[#1a1a2e]">
        <X className="size-3.5" />
      </button>
    </div>
  ) : (
    <SourceUpload
      kinds={["audio", "video"]}
      icon={<AudioWaveform className="size-4" />}
      title="Add audio or video"
      hint={`MP3, WAV, M4A, or a video. Up to ${MAX_AUDIO_SECONDS / 60} minutes.`}
      label="Voice"
      dragging={dragging}
      onFiles={(fs) => pickFile(fs[0])}
    />
  );

  const settings = (
    <>
      {uploadSlot}
      <input
        ref={fileRef}
        type="file"
        accept={[...AUDIO_TYPES, ...VIDEO_TYPES_AV].map((t) => `.${t}`).join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          pickFile(f);
        }}
      />
      <div>
        <FieldLabel>Clean Up</FieldLabel>
        <div className="space-y-2">
          {toggle("noise", "Noise removal", "Background hum, traffic, fans")}
          {toggle("echo", "Echo & reverb removal", "Roomy, hollow sound")}
          {toggle("level", "Volume leveling", "Evens out loud and quiet parts")}
        </div>
      </div>
      <div>
        <FieldLabel hint={opts.strength === "high" ? "May sound less natural" : undefined}>Strength</FieldLabel>
        <Segmented label="Strength" value={opts.strength} options={STRENGTHS} onChange={(strength: Strength) => setOpts((o) => ({ ...o, strength }))} />
      </div>
    </>
  );

  const hint = !source ? "Upload a file first." : !anyOption(opts) ? "Turn on at least one option." : undefined;
  const action = (
    <>
      <span title={hint} className="block">
        <button type="button" onClick={generate} disabled={!!hint || running} className={ctaBtn} aria-label={hint ? `Enhance. ${hint}` : undefined}>{running ? "Enhancing…" : "Enhance"}
          <CtaCost cost={cost} />
        </button>
      </span>
    </>
  );

  /* ---------- 右侧 ---------- */
  const origPeaks = useMemo(() => (source ? peaks(source.original, BARS) : []), [source]);
  const progressOf = (key: string) => (player.state?.key === key && source ? Math.min(1, player.pos / source.duration) : null);

  const results_ = !source ? (
    <ToolEmptyDemo title="Studio-clean voice in one click" body="Upload a voiceover or a video. Remove background noise and echo, even out the volume, then compare before and after.">
      <DemoTile kind="audio" label="Noisy voiceover" />
      <ArrowRight className="size-5 shrink-0 text-[#c9cad4]" aria-hidden="true" />
      <div className="w-[320px] max-w-full rounded-2xl bg-[#fff7f1] p-4 text-left shadow-[0_18px_40px_rgba(26,26,46,0.12)]">
        <p className="mb-2 text-[13px] font-bold text-[#1a1a2e]">Clean voice</p>
        <audio src="/prototypes/ai-tools/voice-sample.mp3" controls className="w-full" />
      </div>
    </ToolEmptyDemo>
  ) : (
    <div className="w-full space-y-4 pb-6">
      {results.map((j) => {
        const data = enhanced[j.id]?.data;
        const which = ab[j.id] ?? "enhanced";
        const playingHere = player.state?.key === j.id;
        const busy = exporting[j.id];
        const playWhich = (w: Which, at: number) => {
          const buf = w === "enhanced" ? data : source.original;
          if (buf) player.play(j.id, w, buf, source.sampleRate, at);
        };
        const changed = !sameOpts(j.input.opts, opts);
        return (
          <article key={j.id} aria-label={`Enhanced: ${optsSummary(j.input.opts)}`} className="rounded-[22px] border border-[#ececf1] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-[180px] flex-1">
                <p className="text-[14px] font-bold text-[#1a1a2e]">{optsSummary(j.input.opts)}</p>
                <p className="text-[12px] text-[#9a9bb0]">
                  {formatClock(source.duration)} · {j.cost} {j.cost === 1 ? "credit" : "credits"}
                  {changed && j === results[0] && j.status === "done" && " · Settings changed — enhance again to apply"}
                </p>
              </div>
              {j.status === "done" && (
                <div className="flex items-center gap-2">
                  <div className="w-[190px]">
                    <Segmented
                      label="Compare"
                      size="sm"
                      value={which}
                      options={[
                        { value: "original", label: "Original" },
                        { value: "enhanced", label: "Enhanced" },
                      ]}
                      onChange={(w) => {
                        setAb((m) => ({ ...m, [j.id]: w }));
                        /* 正在放就接着当前位置换另一条 */
                        if (playingHere) playWhich(w, player.now());
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => (playingHere ? player.stop() : playWhich(which, 0))}
                    aria-label={playingHere ? "Pause" : `Play ${which}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:bg-[#2c2c44]"
                  >
                    {playingHere ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
                  </button>
                </div>
              )}
            </div>
            {j.status === "running" && (
              <div className="relative h-[132px] overflow-hidden rounded-xl">
                <RunningTile label="Generating" />
              </div>
            )}
            {j.status === "failed" && (
              <p role="alert" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#e5484d]">
                <CircleAlert className="size-3.5" /> Enhancing failed. Your credits have been refunded.
                <button type="button" onClick={() => retry(j)} className="font-semibold text-[#ff5e1a] hover:underline">
                  Retry · {j.cost} {j.cost === 1 ? "credit" : "credits"}
                </button>
              </p>
            )}
            {j.status === "done" && data && (
              <>
                <div className="space-y-2.5">
                  <Waveform
                    data={origPeaks}
                    label="Original"
                    tone="grey"
                    active={which === "original"}
                    progress={playingHere && player.state?.which === "original" ? progressOf(j.id) : null}
                    onSeek={(r) => {
                      setAb((m) => ({ ...m, [j.id]: "original" }));
                      playWhich("original", r * source.duration);
                    }}
                  />
                  <Waveform
                    data={enhanced[j.id].peaks}
                    label="Enhanced"
                    tone="orange"
                    active={which === "enhanced"}
                    progress={playingHere && player.state?.which === "enhanced" ? progressOf(j.id) : null}
                    onSeek={(r) => {
                      setAb((m) => ({ ...m, [j.id]: "enhanced" }));
                      playWhich("enhanced", r * source.duration);
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[12px] font-semibold text-[#6a6b7b]">Export</span>
                  {source.kind === "video" && (
                    <button type="button" onClick={() => void exportFile(j, "video")} disabled={!!busy} className={`${ghostBtn} h-8 border-[#ffbd99] text-[#c2410c]`}>
                      <Film className="size-3.5" /> Video with clean audio
                    </button>
                  )}
                  <button type="button" onClick={() => exportWav(j)} className={`${ghostBtn} h-8`}>
                    <Download className="size-3.5" /> WAV
                  </button>
                  <button type="button" onClick={() => void exportFile(j, "mp3")} disabled={!!busy} className={`${ghostBtn} h-8`}>
                    <Download className="size-3.5" /> MP3
                  </button>
                  {busy && (
                    <span role="status" className="text-[12px] tabular-nums text-[#6a6b7b]">
                      {busy}
                    </span>
                  )}
                </div>
              </>
            )}
          </article>
        );
      })}

      {/* 原声 */}
      <section aria-label="Original audio" className="rounded-[22px] border border-[#ececf1] bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#1a1a2e]">Original</p>
            <p className="text-[12px] text-[#9a9bb0]">{results.length ? "What you uploaded" : "Listen first, then hit Enhance"}</p>
          </div>
          <button
            type="button"
            onClick={() => (player.state?.key === "source" ? player.stop() : player.play("source", "original", source.original, source.sampleRate, 0))}
            aria-label={player.state?.key === "source" ? "Pause original" : "Play original"}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:bg-[#2c2c44]"
          >
            {player.state?.key === "source" ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
          </button>
        </div>
        <Waveform
          data={origPeaks}
          label="Original"
          tone="grey"
          active
          progress={progressOf("source")}
          onSeek={(r) => player.play("source", "original", source.original, source.sampleRate, r * source.duration)}
        />
      </section>
    </div>
  );

  return (
    <ToolLayout
      title="Voice Enhancer"
      subtitle="Clean up voiceovers and video audio: less noise, no echo, steady volume."
      settingsLabel="Voice enhancer settings"
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dragging={dragging}
      dropProps={fileDropProps(setDragging, pickFile)}
      settings={settings}
      action={action}
      results={results_}
      resultsLabel={source ? "Compare" : "Preview"}
    />
  );
}
