"use client";

/* 模型加工类工具页(Motion Control / Character Swap / Relight / 3D to Video / Lip Sync / Talking Avatar / Voice Clone)。
   2026-11-05 从 Video Gen 的模式里拆出来;版式同 Upscale Image(ToolLayout)。
   2026-11-05 UI 评审后:
   - 左栏顺序 = 模型卡(多个时)→ 素材 →「What should they say?」这类问题标签 → 跟着它的素材 / 台词 / 音色 → 其余选项(开关做成开关行)→ 提示词;
   - 结果卡 = 卡头(输入缩略图 + 写结果的标题 + 人话摘要)+「Result / 原素材」对比 + Download / Save to Assets / Try other settings,API request 收成一行链接;
   - Voice Clone:单个素材用大拖放区、必勾「This is my voice.」;结果卡可改名、波形试听、Use in Lip Sync。
   原型不真跑模型：用样例素材时播 specs 里的演示成片，用自己的文件时回放原素材并标「Demo」。 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  AudioLines,
  Check,
  ChevronRight,
  CircleAlert,
  Download,
  Film,
  Heart,
  ImageIcon,
  Mic,
  Minus,
  Pause,
  Pencil,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { RESULT_MAX_H } from "../components/ResultCard";
import { MAX_MB, SourceUpload, sizeProblem } from "../components/SourceUpload";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { createPortal } from "react-dom";
import { VoiceModal, type Voice } from "@/app/prototypes/(v1.5)/audio-generation/shared";

/** 上传卡标题和格式(和文件框 accept 一致) */
const UPLOAD_TITLE: Record<MediaKind, (max: number) => string> = {
  image: (max) => (max > 1 ? "Upload images" : "Upload an image"),
  video: () => "Upload a video",
  audio: () => "Upload audio",
};
const FORMATS: Record<MediaKind, string> = { image: "JPG, PNG or WEBP", video: "MP4, MOV, WEBM or M4V", audio: "MP3, WAV, M4A, AAC or OGG" };
import type { ToolsApi } from "../tools/api";
import { jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import type { Notify } from "../components/TopToast";
import { ShareButton } from "../components/TeamSharing";
import { unshareResult } from "../components/sharing";
import { UploadedCard } from "../components/UploadedCard";
import { ExpandButton, useMediaPreview } from "../components/MediaPreview";
import type { ToolKey } from "../sidebarMenus";
import {
  ConfirmDeleteDialog,
  FieldLabel,
  InfoTip,
  ToolEmptyDemo,
  DemoVideo,
  DemoVideoCompare,
  DemoAudio,
  useRememberedSettings,
  RunningTile,
  Segmented,
  ToolLayout,
  ctaBtn,
  fileDropProps,
  ghostBtn,
  CtaCost,
} from "../components/ToolKit";
import {
  FLAT_CREDITS,
  modelToolSpec,
  type MediaKind,
  type ModelVariant,
  type SpecInput,
  type SpecOption,
} from "./specs";
import {
  MY_VOICE,
  blockerInfo,
  secsProblem,
  cost as costOf,
  initialState,
  optValue,
  promptRequired,
  promptVisible,
  requestBody,
  summaryOf,
  switchModel,
  variantOf,
  visibleInputs,
  visibleOptions,
  type Media,
  type ModelRequest,
  type MyVoice,
  type ToolState,
} from "./logic";

const ACCEPT: Record<MediaKind, string> = {
  image: ".jpg,.jpeg,.png,.webp",
  video: ".mp4,.mov,.webm,.m4v",
  audio: ".mp3,.wav,.m4a,.aac,.ogg",
};
const KIND_ICON = { image: ImageIcon, video: Film, audio: AudioLines } as const;
/** 预置音色试听用的演示音频(原型) */
const VOICE_DEMO = "/prototypes/ai-tools/voice-sample.mp3";
const PREVIEW_LINE =
  "Hi! This is my new voice. From now on, I'll read your scripts.";
const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/45";
/** 占位文字：对白底 4.6:1(原来的 #b4b5c3 只有 2:1) */
const PLACEHOLDER = "placeholder:text-[#74758a]";

const newId = () =>
  `mt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const plural = (n: number) => `${n} ${n === 1 ? "credit" : "credits"}`;

type Input = { state: ToolState; summary: string; request: ModelRequest };
type Job = ToolJob<Input>;

/** 读视频 / 音频时长 */
function readSecs(url: string, kind: MediaKind): Promise<number | undefined> {
  if (kind === "image") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () =>
      resolve(Number.isFinite(el.duration) ? el.duration : undefined);
    el.onerror = () => resolve(undefined);
    el.src = url;
  });
}


/** 一个页面同一时间只放一段试听 */
function usePlayer() {
  const el = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => el.current?.pause(), []);
  const toggle = (key: string, url: string) => {
    if (!el.current) {
      el.current = new Audio();
      el.current.onended = () => setPlaying(null);
    }
    if (playing === key) {
      el.current.pause();
      return setPlaying(null);
    }
    el.current.src = url;
    el.current.currentTime = 0;
    void el.current.play().catch(() => setPlaying(null));
    setPlaying(key);
  };
  return { playing, toggle };
}

/** 模型下拉里的厂商 logo(按模型 key 认厂商) */
function ModelLogo({ modelKey }: { modelKey: string }) {
  const src = modelKey.startsWith("kling")
    ? "/prototypes/starter-guide/icons/kling-color.svg"
    : modelKey.startsWith("h3") || modelKey.startsWith("minimax")
      ? "/prototypes/video-gen-modes/icons/hailuo-color.svg"
      : null;
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" className="size-4 shrink-0 object-contain" /> : null;
}

function MediaTile({ m, onRemove }: { m: Media; onRemove: () => void }) {
  const Icon = KIND_ICON[m.kind];
  return (
    <div
      className="group relative size-[72px] shrink-0 rounded-xl bg-[#f3f4f6] ring-1 ring-black/5"
      title={m.name}
    >
      <div className="size-full overflow-hidden rounded-xl">
        {m.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={m.name} className="size-full object-cover" />
        ) : m.kind === "video" ? (
          <video
            src={`${m.url}#t=0.5`}
            muted
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 bg-[#fff3ec] px-1 text-[#ff5e1a]">
            <Icon className="size-5" />
            <span className="w-full truncate text-center text-[9.5px] font-semibold">
              {m.name}
            </span>
          </div>
        )}
      </div>
      {/* 触屏没有悬停：× 常显;点击区 32px(视觉 24px,白描边在任何素材上都看得见) */}
      <button
        type="button"
        aria-label={`Remove ${m.name}`}
        onClick={onRemove}
        className="absolute -right-2 -top-2 grid size-8 place-items-center opacity-0 outline-none transition group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 [&:focus-visible>span]:ring-[#ff5e1a]"
      >
        <span className="grid size-6 place-items-center rounded-full bg-[#1a1a2e]/75 text-white ring-[1.5px] ring-white">
          <X className="size-3.5" />
        </span>
      </button>
    </div>
  );
}

/** 开关行:标签 + 一句说明 + 开关 */
function SwitchRow({
  o,
  on,
  onChange,
}: {
  o: SpecOption;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="relative flex items-center justify-between gap-4">
      <p className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-[#1a1a2e]">
        {o.label}
        {o.hint && <InfoTip label={o.label} text={o.hint} />}
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={o.label}
        onClick={() => onChange(!on)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition ${FOCUS} ${on ? "bg-[#ff5e1a]" : "bg-[#d9dae2]"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

/** 开关类选项：两个取值且是 On/Off 或 Yes/No */
const switchOn = (o: SpecOption) =>
  o.values.length === 2
    ? o.values.find((x) => x === "On" || x === "Yes")
    : undefined;

/** 音色选择(2026-11-06 Monica 定)：点了打开产品的「Select a voice」弹窗(同 Audio 生成的音色弹窗)。
    Kling Lip Sync 只认 fal 枚举里的固定音色、不能用克隆音色，所以弹窗只有 Preset Voice,没有 Clone voice / My Voice。 */
function VoicePicker({ o, value, onChange }: { o: SpecOption; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const presets: Voice[] = o.values.map((x, k) => {
    const [language = "English", style = ""] = (o.meta?.[k] ?? "").split(" · ");
    return { id: x, speakerId: String(o.apiValues?.[k] ?? x), name: x, gender: o.gender?.[k] ?? "Female", language, style };
  });
  const cur = presets.find((x) => x.id === value);
  return (
    <div>
      <FieldLabel>{o.label}</FieldLabel>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-left transition hover:border-[#d4d3df] ${FOCUS}`}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#fff3ec] text-[#ff5e1a]">
          <Mic className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]">{value}</span>
          <span className="block truncate text-[11.5px] text-[#6a6b7b]">{cur ? [cur.gender, cur.language, cur.style].filter(Boolean).join(" · ") : ""}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#6a6b7b]" />
      </button>
      {/* 挂到 body:否则会被左栏的滚动区和层级困住 */}
      {open &&
        createPortal(
          <VoiceModal value={cur ?? null} presets={presets} allowClone={false} filters onChange={(x) => onChange(x.id)} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </div>
  );
}

/** 小步进器(− 1x +),右侧对齐 */
function Stepper({
  o,
  value,
  onChange,
}: {
  o: SpecOption;
  value: string;
  onChange: (v: string) => void;
}) {
  const i = Math.max(0, o.values.indexOf(value));
  const btn = `grid size-7 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-white disabled:opacity-30 ${FOCUS}`;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-semibold text-[#1a1a2e]">
        {o.label}
      </span>
      <div className="flex items-center gap-1 rounded-xl bg-[#f4f4f6] p-0.5">
        <button
          type="button"
          aria-label={`Slower than ${value}`}
          disabled={i === 0}
          onClick={() => onChange(o.values[i - 1])}
          className={btn}
        >
          <Minus className="size-3.5" />
        </button>
        <span
          className="w-10 text-center text-[13px] font-semibold tabular-nums text-[#1a1a2e]"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Faster than ${value}`}
          disabled={i === o.values.length - 1}
          onClick={() => onChange(o.values[i + 1])}
          className={btn}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/** 静态波形(按 id 生成，每个音色样子不同) */
function Waveform({ seed, playing }: { seed: string; playing: boolean }) {
  const bars = useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const out: number[] = [];
    for (let i = 0; i < 48; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      const env = Math.sin((i / 47) * Math.PI) * 0.6 + 0.4;
      out.push(Math.max(0.15, ((h % 1000) / 1000) * env));
    }
    return out;
  }, [seed]);
  return (
    <div className="flex h-9 min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
      {bars.map((b, i) => (
        <span
          key={i}
          className={`w-full rounded-full ${playing ? "animate-[mt-wave_0.9s_ease-in-out_infinite_alternate] bg-[#ff5e1a]" : "bg-[#ffc3a6]"}`}
          style={{
            height: `${b * 100}%`,
            animationDelay: `${(i % 8) * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ModelTool({
  tool,
  api,
  wallet,
  notify: say,
  onMenu,
  onInvite,
  myVoices = [],
  onVoiceSaved,
  onRenameVoice,
  onUseVoice,
  voicePick,
}: {
  tool: string;
  api: ToolsApi;
  wallet: Wallet;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
  /** Voice Clone 做出来的音色(外壳保存，Lip Sync 的音色下拉里能选) */
  myVoices?: MyVoice[];
  onVoiceSaved?: (v: MyVoice) => void;
  onRenameVoice?: (id: string, name: string) => void;
  /** Voice Clone 结果卡「Use in Lip Sync」 */
  onUseVoice?: (id: string) => void;
  /** 从 Voice Clone 跳过来时预选的音色(n 变了就重新选) */
  voicePick?: { id: string; n: number };
}) {
  const spec = modelToolSpec(tool);
  const [s, setS] = useState<ToolState>(() => initialState(spec));
  const [confirmDel, setConfirmDel] = useState<Job | null>(null);
  /* 记住上次的模型和选项(不含素材和提示词);没有记录就用默认值 */
  const remembered = useMemo(() => ({ model: s.model, opts: s.opts }), [s.model, s.opts]);
  useRememberedSettings(`model-tool:${spec.key}`, remembered, (r) =>
    setS((x) => (spec.models.some((m) => m.key === r.model) ? { ...x, model: r.model, opts: r.opts ?? {} } : x)),
  );
  const [consent, setConsent] = useState(false);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [dragging, setDragging] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const toggleFav = (id: string) => setFavorites((f) => (f.has(id) ? new Set([...f].filter((x) => x !== id)) : new Set(f).add(id)));
  const [lineFor, setLineFor] = useState<Record<string, string | undefined>>(
    {},
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<SpecInput | null>(null);
  /** Replace:新选的文件替换掉这个素材位里原来的 */
  const replaceFor = useRef(false);
  const preview = useMediaPreview();
  const panelRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(new Set<string>());
  const player = usePlayer();

  const v = variantOf(spec, s.model);
  const inputs = visibleInputs(v, s);
  const options = visibleOptions(v, s);
  const block = blockerInfo(v, s);
  /* 素材有问题(不是没传齐):红字说明 + 那张素材卡标红 */
  const problem = block && !block.missing ? block : null;
  const why =
    block?.message ??
    (spec.consent && !consent
      ? "Tick the box to confirm it's your voice."
      : null);
  const price = costOf(spec, v, s);
  const running = jobs.some((j) => j.status === "running");

  useJobRunner({
    jobs,
    api,
    task: () => (spec.result === "voice" ? "voice-clone" : "model-video"),
    onDone: (j) => {
      if (cancelled.current.has(j.id)) return;
      dispatch({ type: "done", id: j.id });
      if (spec.result === "voice") {
        const sample =
          j.input.state.files[
            variantOf(spec, j.input.state.model).inputs[0].id
          ]?.[0];
        onVoiceSaved?.({
          id: j.id,
          name: `My voice ${j.id.slice(-3).toUpperCase()}`,
          model: j.input.state.model,
          sample: sample?.url ?? VOICE_DEMO,
        });
      }
      say(
        spec.result === "voice"
          ? "Your voice is ready"
          : `${spec.title} is done`,
        "success",
      );
    },
    onFail: (j) => {
      if (cancelled.current.has(j.id)) return;
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say("Generation failed. Your credits have been refunded.", "error");
    },
  });

  /* 网址带 ?model=<key> 时预选模型(思维导图「看 UI」打开 H3 Max 的 Talking Avatar 用) */
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("model");
    if (!want || !spec.models.some((m) => m.key === want)) return;
    const raf = requestAnimationFrame(() =>
      setS((x) => (x.model === want ? x : switchModel(spec, x, want))),
    );
    return () => cancelAnimationFrame(raf);
  }, [spec]);

  /* 从 Voice Clone「Use in Lip Sync」过来：切到打字台词并选上这个音色 */
  useEffect(() => {
    if (
      !voicePick ||
      !spec.models[0].options.some((o) => o.control === "voice")
    )
      return;
    const raf = requestAnimationFrame(() =>
      setS((x) => ({
        ...x,
        opts: {
          ...x.opts,
          from: "Type a script",
          voice: MY_VOICE + voicePick.id,
        },
      })),
    );
    return () => cancelAnimationFrame(raf);
  }, [voicePick, spec]);

  /** 只认白名单扩展名(MIME 前缀太宽，GIF / HEIC / SVG 也会混进来) */
  const fits = (f: File, kind: MediaKind) =>
    ACCEPT[kind].split(",").some((ext) => f.name.toLowerCase().endsWith(ext));

  const addFiles = async (inp: SpecInput, fileList: File[], replace = false) => {
    const typed = fileList.filter((f) => fits(f, inp.kind));
    if (!typed.length)
      return say(
        `Use ${ACCEPT[inp.kind].replaceAll(".", "").toUpperCase().split(",").join(", ")} here.`,
        "error",
      );
    /* 2026-11-06 Monica 定：选文件时就挡掉超过大小 / 时长的，不放进去，顶部提示原因 */
    const problems: string[] = [];
    const files = typed.filter((f) => {
      const p = sizeProblem(f, inp.kind);
      if (p) problems.push(p);
      return !p;
    });
    const read = await Promise.all(
      files.slice(0, inp.max).map(async (f) => {
        const url = URL.createObjectURL(f);
        return {
          id: newId(),
          name: f.name,
          kind: inp.kind,
          url,
          secs: await readSecs(url, inp.kind),
        } satisfies Media;
      }),
    );
    const media = read.filter((m) => {
      const p = secsProblem(inp, m);
      if (p) {
        problems.push(p);
        URL.revokeObjectURL(m.url);
      }
      return !p;
    });
    if (problems.length) say(problems.length > 1 ? `${problems[0]} (and ${problems.length - 1} more)` : problems[0], "error");
    if (!media.length) return;
    /* 空位按最新状态算(读时长要等一会儿，连续添加时不能用旧的 s) */
    let dropped = 0;
    setS((x) => {
      const have = replace ? [] : (x.files[inp.id] ?? []);
      const keep = media.slice(0, Math.max(0, inp.max - have.length));
      dropped = media.length - keep.length;
      return { ...x, files: { ...x.files, [inp.id]: [...have, ...keep] } };
    });
    if (dropped > 0 || files.length > inp.max)
      say(`${inp.label} takes up to ${inp.max}.`, "info");
  };


  const pick = (inp: SpecInput, room: number, replace = false) => {
    pickFor.current = inp;
    replaceFor.current = replace;
    if (!fileRef.current) return;
    fileRef.current.accept = ACCEPT[inp.kind];
    fileRef.current.multiple = room > 1;
    fileRef.current.click();
  };

  const setOpt = (id: string, val: string) =>
    setS((x) => ({ ...x, opts: { ...x.opts, [id]: val } }));
  const removeMedia = (inpId: string, id: string) =>
    setS((x) => ({
      ...x,
      files: {
        ...x.files,
        [inpId]: (x.files[inpId] ?? []).filter((m) => m.id !== id),
      },
    }));

  const generate = () => {
    if (why || price === null || running) return;
    if (!wallet.charge(price)) return;
    dispatch({
      type: "start",
      now: nowMs(),
      jobs: [
        {
          id: newId(),
          batch: newId(),
          cost: price,
          input: {
            state: s,
            summary: summaryOf(spec, v, s, myVoices),
            request: requestBody(v, s, myVoices),
          },
        },
      ],
    });
    /* 和 Upscale Image 一样：提交后清掉已传的素材(左栏回到上传位);选项和提示词保留，「Try other settings」能把这次的素材放回来 */
    setS((x) => ({ ...x, files: {} }));
    /* 单列(手机 / 窄屏)时结果在屏幕外：滚过去 */
    if (window.innerWidth < 1024)
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
  };
  const retry = (j: Job) =>
    wallet.charge(j.cost) &&
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  /** 「Try other settings」:把这次的素材和选项放回左栏 */
  const reuse = (j: Job) => {
    setS(j.input.state);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    say(
      "Your files and settings are back. Change anything and generate again.",
      "info",
    );
  };

  /* ---------- 左栏 ---------- */
  const renderInput = (inp: SpecInput) => {
    const list = s.files[inp.id] ?? [];
    const Icon = KIND_ICON[inp.kind];
    /* 素材位空着：一律用共用的上传框(和 Upscale Image 同高，2026-11-05 Monica 定);
       拖文件进来时只高亮第一个还空着的框(拖进来的文件按顺序先补它) */
    if (!list.length) {
      const firstEmpty = v.inputs.find((i) => !(s.files[i.id] ?? []).length)?.id;
      /* 上传卡：本地 / Assets / Avatars 三个来源。素材名放在卡片上方，说明收进 ⓘ(2026-11-06 Monica 定，和传完之后的样子一致) */
      return (
        <div key={inp.id}>
          <FieldLabel hint={inp.min === 0 ? "Optional" : undefined} info={inp.hint}>
            {inp.label}
          </FieldLabel>
          <SourceUpload
            notify={say}
            kinds={[inp.kind]}
            icon={<Icon className="size-4" />}
            title={UPLOAD_TITLE[inp.kind](inp.max)}
            hint={`Click or drop ${inp.max > 1 ? `up to ${inp.max} files` : "a file"} here. ${FORMATS[inp.kind]}, up to ${MAX_MB[inp.kind]} MB${inp.max > 1 ? " each" : ""}.`}
            multiple={inp.max > 1}
            dragging={dragging && inp.id === firstEmpty}
            onFiles={(fs) => void addFiles(inp, fs)}
          />
        </div>
      );
    }
    return (
      <div key={inp.id}>
        <FieldLabel hint={inp.min === 0 ? "Optional" : undefined} info={inp.hint}>
          {inp.label}
        </FieldLabel>
        {inp.max === 1 && list[0] ? (
          <UploadedCard kind={list[0].kind} url={list[0].url} name={list[0].name} tone={problem?.input === inp.id ? "error" : "default"} onReplace={() => pick(inp, 1, true)} onRemove={() => removeMedia(inp.id, list[0].id)} />
        ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((m) => (
            <MediaTile
              key={m.id}
              m={m}
              onRemove={() => removeMedia(inp.id, m.id)}
            />
          ))}
          {list.length < inp.max && (
            <button
              type="button"
              onClick={() => pick(inp, inp.max - list.length)}
              aria-label={`Add ${inp.label.toLowerCase()}`}
              className={`flex size-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#e1e3e9] bg-[#fafafb] text-[#9a9bb0] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] hover:text-[#ff5e1a] ${FOCUS}`}
            >
              {list.length ? (
                <Plus className="size-4" />
              ) : (
                <Icon className="size-4" />
              )}
              <span className="text-[10.5px] font-medium">
                {list.length
                  ? "Add"
                  : inp.kind === "audio"
                    ? "Audio"
                    : inp.kind === "video"
                      ? "Video"
                      : "Image"}
              </span>
            </button>
          )}
        </div>
        )}
      </div>
    );
  };

  const renderOption = (o: SpecOption) => {
    const val = optValue(v, s, o.id);
    if (o.control === "voice")
      return (
        <VoicePicker key={o.id} o={o} value={val} onChange={(x) => setOpt(o.id, x)} />
      );
    if (o.control === "stepper")
      return (
        <Stepper
          key={o.id}
          o={o}
          value={val}
          onChange={(x) => setOpt(o.id, x)}
        />
      );
    const on = switchOn(o);
    if (on)
      return (
        <SwitchRow
          key={o.id}
          o={o}
          on={val === on}
          onChange={(x) =>
            setOpt(o.id, x ? on : o.values.find((y) => y !== on)!)
          }
        />
      );
    return (
      <div key={o.id}>
        <FieldLabel info={o.hint}>{o.ask ?? o.label}</FieldLabel>
        {o.values.length <= 3 ? (
          <Segmented
            label={o.ask ?? o.label}
            value={val}
            options={o.values.map((x) => ({ value: x, label: x }))}
            onChange={(x: string) => setOpt(o.id, x)}
          />
        ) : (
          /* 5 个以内排一行，更多就每行 4 个(不留单独一个在第二行) */
          <div
            role="radiogroup"
            aria-label={o.label}
            className="grid gap-1 rounded-xl bg-[#f4f4f6] p-1"
            style={{
              gridTemplateColumns: `repeat(${o.values.length <= 5 ? o.values.length : 4}, minmax(0, 1fr))`,
            }}
          >
            {o.values.map((x) => (
              <button
                key={x}
                type="button"
                role="radio"
                aria-checked={x === val}
                onClick={() => setOpt(o.id, x)}
                className={`rounded-lg px-1.5 py-2 text-[12.5px] font-medium transition ${FOCUS} ${x === val ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : "text-[#8d8e9d] hover:text-[#4a4b5c]"}`}
              >
                {x}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const promptBox = promptVisible(v, s) && (
    <div key="prompt">
      <FieldLabel
        hint={
          /* 2026-11-06 Monica 定:Script 不显示字数 */
          promptRequired(v, s) ? undefined : "Optional"
        }
      >
        {v.prompt.label ?? "Prompt"}
      </FieldLabel>
      {/* 手机上 16px,iOS 点进去不会自动放大页面 */}
      <textarea
        value={s.prompt}
        onChange={(e) => setS((x) => ({ ...x, prompt: e.target.value }))}
        placeholder={v.prompt.placeholder}
        aria-label={v.prompt.label ?? "Prompt"}
        rows={3}
        className={`w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-[16px] leading-relaxed outline-none ${PLACEHOLDER} focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15 sm:text-[13px]`}
      />
    </div>
  );

  /* 顺序：常驻素材 → 问题标签 → 它带出来的素材 / 台词 / 选项 → 其余选项 → 提示词 */
  const asks = options.filter((o) => o.ask);
  const baseInputs = inputs.filter((i) => !i.showIf);
  const condInputs = inputs.filter((i) => i.showIf);
  const condOptions = options.filter((o) => !o.ask && o.showIf);
  const restOptions = options.filter((o) => !o.ask && !o.showIf);
  const promptIsCond = !!v.prompt.showIf;

  /* 2026-11-06 Monica 定：多个模型时用下拉选(和 Video Gen 的模型下拉同一种样子),不再用两张模型卡;
     选项下面一行写模型特点 */
  const modelCards = spec.models.length > 1 && (
    <div>
      <FieldLabel>Model</FieldLabel>
      <DropdownSelect
        label="Model"
        value={s.model}
        onChange={(k) => setS((x) => switchModel(spec, x, k))}
        icon={(k) => <ModelLogo modelKey={k} />}
        /* 2026-11-06 Monica 定：下拉里只写模型特点，积分放到 Generate 按钮上 */
        options={spec.models.map((m: ModelVariant) => ({ value: m.key, label: m.label, hint: m.blurb }))}
      />
    </div>
  );

  /* 连着的几个空素材位并排(两列,2026-11-05 Monica 定，照「Reference Video / Character Image」);放了素材的照常一行一个 */
  const renderInputs = (list: SpecInput[]) => {
    const out: React.ReactNode[] = [];
    let row: SpecInput[] = [];
    const flush = () => {
      if (!row.length) return;
      out.push(
        row.length === 1 ? (
          renderInput(row[0])
        ) : (
          /* 2026-11-06 Monica 定：多个上传卡上下排，不再左右并排 */
          <div key={row.map((i) => i.id).join("+")} className="space-y-5">
            {row.map(renderInput)}
          </div>
        ),
      );
      row = [];
    };
    for (const inp of list) {
      if (!(s.files[inp.id] ?? []).length) {
        row.push(inp);
        if (row.length === 2) flush();
      } else {
        flush();
        out.push(renderInput(inp));
      }
    }
    flush();
    return out;
  };

  const settings = (
    <>
      {modelCards}
      {renderInputs(baseInputs)}
      {asks.map(renderOption)}
      {renderInputs(condInputs)}
      {promptIsCond && promptBox}
      {condOptions.map(renderOption)}
      {restOptions.map(renderOption)}
      {!promptIsCond && promptBox}
      {spec.consent && (
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#f7f8fa] px-3 py-2.5 text-[13px] font-medium text-[#1a1a2e]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="size-4 shrink-0 accent-[#ff5e1a]"
          />
          {spec.consent}
        </label>
      )}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (pickFor.current && fs.length) void addFiles(pickFor.current, fs, replaceFor.current);
        }}
      />
    </>
  );

  const action = (
    <>
      {problem && (
        <p role="alert" className="flex items-start gap-1.5 text-[12.5px] leading-snug text-[#C22F32]">
          <CircleAlert className="mt-px size-3.5 shrink-0" /> {problem.message}
        </p>
      )}
      <span title={why ?? undefined} className="block">
        <button
          type="button"
          onClick={generate}
          disabled={!!why || running || price === null}
          className={ctaBtn}
          aria-label={why ? `${spec.cta}. ${why}` : undefined}
        >
          {running ? `${spec.running}…` : spec.cta}
          <CtaCost cost={price} rate={FLAT_CREDITS[spec.key]?.[v.key] === undefined ? v.credits.perSecond : undefined} />
        </button>
      </span>
    </>
  );

  /* ---------- 右侧 ---------- */
  /** 这次用的是不是样例素材(是的话播演示成片) */
  const usedSample = (st: ToolState) => {
    const inp = spec.previewFrom
      ? variantOf(spec, st.model).inputs.find((i) => i.id === spec.previewFrom)
      : undefined;
    const m = spec.previewFrom ? st.files[spec.previewFrom]?.[0] : undefined;
    return !!(inp && m && m.url === inp.sample.url);
  };

  const media = (j: Job) => {
    const st = j.input.state;
    const src = spec.previewFrom ? st.files[spec.previewFrom]?.[0] : undefined;
    const demo =
      spec.demoResult && usedSample(st) ? spec.demoResult : undefined;
    const box = `block max-h-[${RESULT_MAX_H}px] max-w-full rounded-2xl bg-black object-contain`;
    if (demo)
      return (
        <div className="relative inline-block max-w-full">
          <video key="demo" src={demo} controls playsInline className={box} />
          <ExpandButton onClick={() => preview.open({ kind: "video", url: demo, alt: spec.resultTitle ?? spec.title })} />
        </div>
      );
    /* 自己的文件：原型不真跑模型，回放原素材并说清楚 */
    return (
      <div className="relative inline-block max-w-full">
        {src?.kind === "video" ? (
          <>
            <video key="own" src={src.url} controls playsInline className={box} />
            <ExpandButton onClick={() => preview.open({ kind: "video", url: src.url, alt: src.name })} />
          </>
        ) : src ? (
          <div className="inline-block overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src.url}
              alt=""
              className="block max-h-[260px] max-w-full animate-[mt-push_8s_ease-in-out_infinite_alternate] object-contain"
            />
          </div>
        ) : null}
      </div>
    );
  };

  const downloadUrl = (j: Job) => {
    const st = j.input.state;
    if (spec.demoResult && usedSample(st)) return spec.demoResult;
    const m = spec.previewFrom ? st.files[spec.previewFrom]?.[0] : undefined;
    return m?.kind === "video" ? m.url : (spec.demoResult ?? "");
  };

  const thumbs = (st: ToolState) =>
    variantOf(spec, st.model)
      .inputs.flatMap((i) => st.files[i.id] ?? [])
      .slice(0, 3);

  const voiceCard = (j: Job) => {
    const saved = myVoices.find((x) => x.id === j.id);
    const fallback = `My voice ${j.id.slice(-3).toUpperCase()}`;
    const name = saved?.name ?? fallback;
    const sample = saved?.sample ?? VOICE_DEMO;
    const line = lineFor[j.id];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="group/name flex min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 focus-within:ring-2 focus-within:ring-[#ff5e1a]/45 hover:bg-[#f7f8fa]">
            <input
              value={name}
              onChange={(e) => onRenameVoice?.(j.id, e.target.value)}
              onBlur={(e) =>
                !e.target.value.trim() && onRenameVoice?.(j.id, fallback)
              }
              aria-label="Voice name"
              maxLength={40}
              size={Math.max(8, name.length)}
              className="min-w-0 bg-transparent text-[16px] font-bold text-[#1a1a2e] outline-none"
            />
            <Pencil className="size-3.5 shrink-0 text-[#9a9bb0] group-hover/name:text-[#6a6b7b]" />
          </label>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f8ef] px-2 py-0.5 text-[11.5px] font-semibold text-[#1b7a44]">
            <Check className="size-3" /> Saved to My Voices
          </span>
        </div>
        <div className="rounded-xl bg-[#fff7f1] p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={player.playing === j.id ? "Pause" : `Play ${name}`}
              onClick={() => player.toggle(j.id, sample)}
              className={`grid size-10 shrink-0 place-items-center rounded-full bg-[#ff5e1a] text-white shadow-[0_6px_16px_rgba(255,94,26,0.3)] ${FOCUS}`}
            >
              {player.playing === j.id ? (
                <Pause className="size-4" />
              ) : (
                <Play className="ml-0.5 size-4" />
              )}
            </button>
            <Waveform
              seed={j.id}
              playing={
                player.playing === j.id || player.playing === `${j.id}:line`
              }
            />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-[#4a4b5c]">
            “{PREVIEW_LINE}”
          </p>
          {line !== undefined && (
            <form
              className="mt-2.5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (line.trim()) player.toggle(`${j.id}:line`, sample);
              }}
            >
              <input
                value={line}
                onChange={(e) =>
                  setLineFor((x) => ({ ...x, [j.id]: e.target.value }))
                }
                placeholder="Type a line to hear"
                aria-label="Line to hear"
                autoFocus
                className={`h-9 min-w-0 flex-1 rounded-lg border border-[#ececf1] bg-white px-3 text-[16px] outline-none ${PLACEHOLDER} focus:border-[#ff5e1a] sm:text-[13px]`}
              />
              <button
                type="submit"
                disabled={!line.trim()}
                className={`${ghostBtn} h-9`}
              >
                <Play className="size-3.5" /> Play
              </button>
            </form>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUseVoice?.(j.id)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5e1a] px-3 text-[13px] font-semibold text-white transition hover:bg-[#f0520f] ${FOCUS}`}
          >
            Use in Lip Sync
          </button>
          <button
            type="button"
            onClick={() =>
              say(
                "AI Voiceover is coming soon. Your voice will be there.",
                "info",
              )
            }
            className={`${ghostBtn} h-8`}
          >
            Use in AI Voiceover
          </button>
          <button
            type="button"
            onClick={() => setLineFor((x) => ({ ...x, [j.id]: x[j.id] ?? "" }))}
            className={`${ghostBtn} h-8`}
          >
            Hear another line
          </button>
        </div>
      </div>
    );
  };

  /* ---------- 右侧：生成历史(2026-11-05 照 Upscale Image):参考素材缩略图在上，一行「模型 · 参数」,右上角删除;
     生成中 Generating 占位(和结果同高);成功直接放结果 + Download / Favorites / Try other settings;失败红框 + Retry ---------- */
  const cardHeader = (j: Job) => (
    <header className="relative mb-3 pr-10">
      <div className="flex gap-1.5">
        {thumbs(j.input.state).map((m) =>
          m.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.id} src={m.url} alt="Reference" className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]" />
          ) : m.kind === "video" ? (
            <video key={m.id} src={`${m.url}#t=0.5`} muted playsInline preload="metadata" className="size-11 rounded-lg bg-[#f3f4f6] object-cover ring-1 ring-[#ececf1]" />
          ) : (
            <span key={m.id} className="grid size-11 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a] ring-1 ring-[#ececf1]">
              <AudioLines className="size-4" />
            </span>
          ),
        )}
      </div>
      <p className="mt-2 truncate text-[12.5px] tabular-nums text-[#6a6b7b]">
        <span className="font-semibold text-[#1a1a2e]">{variantOf(spec, j.input.state.model).label}</span> · {j.input.summary}
      </p>
      <button
        type="button"
        aria-label="Delete"
        title={j.status === "running" ? "You can delete it once it's done" : "Delete"}
        disabled={j.status === "running"}
        onClick={() => setConfirmDel(j)}
        className={`absolute right-0 top-0 grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#fff1f0] hover:text-[#e5484d] ${FOCUS} disabled:cursor-not-allowed disabled:text-[#d4d5de] disabled:hover:bg-transparent disabled:hover:text-[#d4d5de]`}
      >
        <Trash2 className="size-4" />
      </button>
    </header>
  );

  const videoBody = (j: Job) => (
    <>
      {media(j)}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={downloadUrl(j)} download={`${spec.key}-${j.id.slice(-4)}.mp4`} className={`${ghostBtn} h-9`}>
          <Download className="size-4" /> Download
        </a>
        <button type="button" aria-pressed={favorites.has(j.id)} onClick={() => toggleFav(j.id)} className={`${ghostBtn} h-9`}>
          <Heart className={`size-4 ${favorites.has(j.id) ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`} /> Favorites
        </button>
        <button type="button" onClick={() => reuse(j)} className={`${ghostBtn} h-9`}>
          <SlidersHorizontal className="size-4" /> Try other settings
        </button>
        <ShareButton
          tool={tool as ToolKey}
          id={j.id}
          title={spec.title}
          build={() => ({ kind: "video", url: downloadUrl(j), summary: `${variantOf(spec, j.input.state.model).label} · ${j.input.summary}` })}
          notify={say}
          small
        />
      </div>
    </>
  );

  const results = jobs.length ? (
    <div className="w-full space-y-4 pb-6">
      <style>{`@keyframes mt-push{from{transform:scale(1)}to{transform:scale(1.08)}}@keyframes mt-wave{from{transform:scaleY(.55)}to{transform:scaleY(1)}}@media (prefers-reduced-motion: reduce){[class*="animate-[mt-"]{animation:none!important}}`}</style>
      {[...jobs].reverse().map((j) => (
        <article key={j.id} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          {cardHeader(j)}
          {j.status === "running" && (
            <div
              role="status"
              aria-label="Generating"
              className="relative w-full overflow-hidden rounded-2xl"
              style={spec.result === "voice" ? { height: 88 } : { aspectRatio: "16 / 9", maxWidth: `min(100%, ${Math.round((RESULT_MAX_H * 16) / 9)}px)` }}
            >
              <RunningTile label="Generating" />
            </div>
          )}
          {j.status === "done" && (spec.result === "voice" ? voiceCard(j) : videoBody(j))}
          {j.status === "failed" && (
            <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-[#fff7f5] px-4 py-3.5 text-[13.5px] text-[#e5484d]">
              <CircleAlert className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">Generation failed. Your credits have been refunded.</span>
              <button type="button" onClick={() => retry(j)} className="inline-flex items-center gap-1 rounded-lg border border-[#ffd2c8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#ff5e1a] transition hover:bg-[#fffaf7]">
                Retry · {plural(j.cost)}
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  ) : (
    <ModelEmptyDemo spec={spec} variant={v} />
  );

  /* 拖文件进左栏(可以一次拖多个):每个文件放进第一个类型对得上、还有空位的输入，放不下的提示一次 */
  const onDropMany = (fs: File[]) => {
    const used: Record<string, number> = {};
    const plan = new Map<SpecInput, File[]>();
    let skipped = 0;
    for (const f of fs) {
      const inp = inputs.find(
        (i) =>
          fits(f, i.kind) &&
          (s.files[i.id]?.length ?? 0) + (used[i.id] ?? 0) < i.max,
      );
      if (!inp) {
        skipped++;
        continue;
      }
      used[inp.id] = (used[inp.id] ?? 0) + 1;
      plan.set(inp, [...(plan.get(inp) ?? []), f]);
    }
    plan.forEach((files, inp) => void addFiles(inp, files));
    if (skipped)
      say(
        plan.size
          ? `Added ${fs.length - skipped} of ${fs.length} files. There's no spot for the rest.`
          : "There's no spot for this file here.",
        plan.size ? "info" : "error",
      );
  };

  return (
    <ToolLayout
      tool={spec.result === "voice" ? undefined : (tool as ToolKey)}
      notify={say}
      title={spec.title}
      badge={spec.models.length > 1 ? undefined : v.badge}
      subtitle={spec.subtitle}
      settingsLabel={`${spec.title} settings`}
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      panelRef={panelRef}
      dragging={dragging}
      dropProps={fileDropProps(
        setDragging,
        (f) => f && onDropMany([f]),
        onDropMany,
      )}
      settings={settings}
      action={action}
      results={results}
      resultsRef={resultsRef}
      resultsLabel="Results"
    >
      {confirmDel && (
        <ConfirmDeleteDialog
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            const j = confirmDel;
            setConfirmDel(null);
            dispatch({ type: "remove", id: j.id });
            unshareResult(j.id);
            say("Deleted from your results and Assets");
          }}
        />
      )}
      {preview.preview}
    </ToolLayout>
  );
}

/* 空状态(2026-11-05 照 Upscale Image):功能标题 → 一句描述 → 效果演示(样例素材 → 结果),整体在结果区居中。
   素材用 specs 里的样例;结果视频用 demoResult(没有就放样例视频),Voice Clone 放样例录音试听 */
function ModelEmptyDemo({ spec, variant }: { spec: ReturnType<typeof modelToolSpec>; variant: ModelVariant }) {
  const preview = spec.previewFrom ? variant.inputs.find((i) => i.id === spec.previewFrom)?.sample.url : undefined;
  const resultUrl = spec.emptyDemo ?? spec.demoResult ?? preview;
  return (
    <ToolEmptyDemo title={spec.emptyTitle} body={spec.emptyBody}>
      {spec.result === "voice" ? (
        <DemoAudio title="My voice" note="Ready for voiceovers, Lip Sync and avatars." url={VOICE_DEMO} />
      ) : spec.emptyCompare ? (
        <DemoVideoCompare {...spec.emptyCompare} />
      ) : resultUrl ? (
        <DemoVideo url={resultUrl} sound={!(spec.emptyDemo && spec.emptyDemoSilent)} />
      ) : null}
    </ToolEmptyDemo>
  );
}
