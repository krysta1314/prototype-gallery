"use client";

/* 首页 Audio Gen 输入框(2026-11-06 Monica 定，照真实产品截图):
   左上「+」上传参考音频 / 图片，提示词，底栏 [Audio Gen][模型][第三个选项][条数] … [积分][Create]。
   - 模型下拉按 Voice / Music / Sound Effects 分组，列 v1.12 上新清单里的音频模型(Notion「v1.13 上新模型清单与定价」);
   - 第三个选项跟着类型变:Voice → 音色;Music → 时长(Lyria 固定整首约 2 分钟);Sound Effects → 时长(含 Auto);
   - 侧边栏 Audio 菜单的 4 项(AI Voiceover、Background Music、Voice Clone、Sound Effects;Voice Enhancer 2026-11-06 删除)都进这里，预选模型并预填提示词，选中第一个 [占位]。
   积分是示意数，不是定价;点 Create 之后的交互不在本需求范围，只弹提示。 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, AudioLines, ChevronDown, Clock3, Plus, X } from "lucide-react";
import { VoiceModal, type CloneModel, type Voice } from "@/app/prototypes/(v1.5)/audio-generation/shared";
import { firstPlaceholder } from "@/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import type { Asset } from "../assets";
import { AssetPicker, AssetThumb } from "./AssetPicker";
import { CountMenu } from "./BarMenus";
import { MenuItem, Pill, pillBase } from "./Popover";
import { companyHeading } from "./BarMenus";

const homeCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

export type AudioKind = "voice" | "music" | "sfx";

const SG = "/prototypes/starter-guide/icons";
const VG = "/prototypes/video-gen-modes/icons";

export type AudioModel = {
  key: string;
  label: string;
  kind: AudioKind;
  /** 厂商 logo;没有就显示首字母 */
  icon?: string;
  /** 示意积分:perSec = 每秒;perSong = 每首(Lyria) */
  perSec?: number;
  perSong?: number;
  /** 公司(模型下拉按公司分组，和视频模型一样;2026-11-18 Monica) */
  company: string;
  /** 能挂的参考素材 */
  accept: ("audio" | "image")[];
  /** 音乐模型的可选时长(秒);没有 = 固定时长 */
  lengths?: number[];
  hint: string;
  /** 能力标签(2026-11-06 Monica 要求：标出哪个支持克隆音色 / 增强声音)。依据各模型 fal / BytePlus 官方 schema:
      Seed Audio 1.0 收最多 3 段参考音频直接仿声;MiniMax Speech 2.8 HD 用 MiniMax Voice Clone 得到的 custom_voice_id 当 voice_id。
      ElevenLabs v4 / v4 Turbo 在 fal 上只收预置音色名，Gemini TTS 也是预置音色;清单里没有任何一个模型做降噪 / 去回声(增强)。 */
  tags?: string[];
};

/** v1.12 的音频模型(名字照 Notion 清单;Seed Audio 1.0 是现网已有、默认) */
export const AUDIO_MODELS: AudioModel[] = [
  { key: "seed-audio-1.0", label: "Seed Audio 1.0", kind: "voice", company: "ByteDance", icon: `${SG}/bytedance.svg`, perSec: 0.5, accept: ["audio", "image"], tags: ["Voice Clone"], hint: "Multi-speaker voiceovers with ambience, 21 languages. Up to 3 reference voices." },
  { key: "eleven-v4", label: "ElevenLabs Eleven v4", kind: "voice", company: "ElevenLabs", perSec: 0.6, accept: [], hint: "Most natural voiceovers, 70+ languages." },
  { key: "eleven-v4-turbo", label: "ElevenLabs Eleven v4 Turbo", kind: "voice", company: "ElevenLabs", perSec: 0.3, accept: [], hint: "Half the price of v4, slightly less expressive." },
  { key: "minimax-speech-2.8-hd", label: "MiniMax Speech 2.8 HD", kind: "voice", company: "MiniMax", icon: `${VG}/hailuo-color.svg`, perSec: 0.6, accept: ["audio"], tags: ["Voice Clone"], hint: "17 preset voices or a voice cloned from 10s+ of audio, with emotion control, 40+ languages." },
  { key: "gemini-3.8-flash-tts", label: "Gemini 3.8 Flash TTS", kind: "voice", company: "Google", icon: `${SG}/gemini.svg`, perSec: 0.1, accept: [], hint: "Low-cost multilingual voiceovers." },
  { key: "eleven-music-v2.5", label: "ElevenLabs Music v2.5", kind: "music", company: "ElevenLabs", perSec: 0.2, accept: ["audio"], lengths: [15, 30, 60, 120], hint: "Background music you can time to your ad, with or without vocals." },
  { key: "lyria-3.5", label: "Lyria 3.5", kind: "music", company: "Google", icon: `${SG}/gemini.svg`, perSong: 8, accept: [], hint: "A full song (about 2 min) with vocals, lyrics written from one line." },
  { key: "eleven-sfx-v3", label: "ElevenLabs Sound Effects V3", kind: "sfx", company: "ElevenLabs", perSec: 0.1, accept: [], lengths: [0, 2, 5, 10, 30], hint: "Sound effects from 0.5 to 30s, can loop." },
  /* 2026-11-26 官网每个模型落地页的按钮都要进生成器并选中这个模型 —— 补上 dev 后台启用、这里还没有的 6 个音频模型。
     名字 / 厂商照 models-catalog,说明照 model-facts;线上定价接口(pricing-live.json)里都没有它们，积分不写(显示 —);
     参考素材只有 model-facts 写了的才开(HeyGen Voice 1 段音频、Voice Replication 2.0 克隆要参考录音),其余不收参考;音乐的可选时长没有依据，不给时长选项 */
  { key: "eleven-v3", label: "ElevenLabs Eleven v3", kind: "voice", company: "ElevenLabs", accept: [], hint: "Natural voiceovers in 70+ languages, word-level timestamps for captions." },
  { key: "minimax-speech-2.6-hd", label: "MiniMax Speech 2.6 HD", kind: "voice", company: "MiniMax", icon: `${VG}/hailuo-color.svg`, accept: [], hint: "Voiceovers with pause markers and a pronunciation dictionary. Includes Cantonese." },
  { key: "heygen-voice", label: "HeyGen Voice", kind: "voice", company: "HeyGen", icon: "/prototypes/site/logos/heygen-color.svg", accept: ["audio"], hint: "24 preset voices in 39 languages, adjustable expressiveness." },
  { key: "voice-replication-2.0", label: "Voice Replication 2.0", kind: "voice", company: "ByteDance", icon: `${SG}/bytedance.svg`, accept: ["audio"], tags: ["Voice Clone"], hint: "Clones a voice from a reference recording, in English, Chinese, Japanese, Spanish and more." },
  { key: "minimax-music-3", label: "MiniMax Music 3", kind: "music", company: "MiniMax", icon: `${VG}/hailuo-color.svg`, accept: [], hint: "Background music, priced by the second." },
  { key: "mureka-v9.5", label: "Mureka V9.5", kind: "music", company: "Kunlun Tech", icon: "/prototypes/site/logos/mureka.webp", accept: [], hint: "Songs from your lyrics or from a description." },
];

/* 音色：点 Voice 打开产品现有的「Select or add a voice」弹窗(Preset Voice / My Voice / Clone voice);
   能克隆音色的模型(Seed Audio 1.0、MiniMax Speech 2.8 HD)在 Clone voice 旁边选用哪个模型克隆，另一家克隆的音色置灰;
   其他模型只能选预置音色。没选 = Auto(按脚本挑音色)。选中后按钮显示音色名，旁边 ✕ 清掉。 */
const CLONE_MODELS: CloneModel[] = [
  { key: "seed-audio", label: "Seed Audio", icon: `${SG}/bytedance.svg`, hint: "For Seed Audio 1.0. Up to 30s of clear speech." },
  { key: "minimax", label: "MiniMax", icon: `${VG}/hailuo-color.svg`, hint: "For MiniMax Speech 2.8 HD. 10s+ of clear speech." },
];
const CLONE_KEY: Record<string, string> = { "seed-audio-1.0": "seed-audio", "minimax-speech-2.8-hd": "minimax" };

const PLACEHOLDER: Record<AudioKind, string> = {
  voice: "Describe the sound you imagine, or paste the script to turn into a voiceover.",
  music: "Describe the music, or what the song is about, such as an upbeat pop song about our new sunscreen. Lyrics are written for you.",
  sfx: "Describe the sound effect, such as a soft whoosh for a product reveal.",
};

const fmtLen = (s: number) => (s === 0 ? "Auto" : s >= 60 ? `${s / 60} min` : `${s}s`);

function Logo({ m }: { m: AudioModel }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (m.icon) return <img src={m.icon} alt="" className="size-4 object-contain" />;
  return <span className="grid size-4 place-items-center rounded-[4px] bg-[#1a1a2e] text-[9px] font-bold text-white">{m.label[0]}</span>;
}

/* 2026-11-18 Monica 定:首页 Audio Gen 拆成 Voiceover / Music / Sound Effects 三个入口，每个入口只列自己那类模型;
   Seed Audio 1.0 一条音轨能同时出人声、音乐、音效，三个入口都放。它没有时长参数(时长跟提示词走，上限 2 分钟),
   所以在 Music / Sound Effects 里第三个选项显示成固定说明。 */
const SEED = "seed-audio-1.0";
const SEED_HINT: Record<AudioKind, string> = {
  voice: "Multi-speaker voiceovers with ambience, 21 languages. Up to 3 reference voices.",
  music: "Instrumental background music, can sit under a voiceover. Can't sing lyrics. Length follows your prompt, up to 2 min.",
  sfx: "Sound effects with voice or music in one track. Length follows your prompt, up to 2 min.",
};
/** 某个入口能选的模型：专门做这一类的 + Seed Audio 1.0(放最后，配音入口里它是默认、放最前)。
    lyrics = 从「Song with Lyrics」进来：Seed Audio 唱不了歌词，不放(2026-11-18 Monica) */
export const modelsFor = (kind: AudioKind, lyrics = false): AudioModel[] => {
  const base = AUDIO_MODELS.find((m) => m.key === SEED)!;
  /* Voice Clone 标签只在配音入口有意义 */
  const seed = { ...base, hint: SEED_HINT[kind], tags: kind === "voice" ? base.tags : undefined };
  const own = AUDIO_MODELS.filter((m) => m.kind === kind && m.key !== SEED);
  if (lyrics) return own;
  return kind === "voice" ? [seed, ...own] : [...own, seed];
};

export function AudioGenComposer({
  kind,
  lyrics = false,
  prompt,
  onPrompt,
  modelKey,
  selectKey,
  leading,
  notify,
  initialFiles,
  referenceOnly = false,
  onCreate,
  variant = "home",
}: {
  /** 画布上拿某个音频节点当参考：一开始就放进素材格 */
  initialFiles?: Asset[];
  /** true = 只列能吃参考音频的模型(画布「拿这段音频当参考继续生成」) */
  referenceOnly?: boolean;
  /** 点生成：传了就交给外层(画布里在承载节点里出结果);不传 = 只弹提示 */
  onCreate?: (model: AudioModel) => void;
  /** canvas = 画布浮层里：生成按钮用圆形箭头(和画布其他浮层一致) */
  variant?: "home" | "canvas";
  /** 哪个入口：Voiceover / Music / Sound Effects */
  kind: AudioKind;
  /** 从 Song with Lyrics 进来(不放 Seed Audio) */
  lyrics?: boolean;
  prompt: string;
  onPrompt: (p: string) => void;
  /** 从侧边栏进来时预选的模型 */
  modelKey?: string;
  /** 变了就聚焦并选中第一个 [占位] */
  selectKey?: string;
  leading: ReactNode;
  notify: (t: string) => void;
}) {
  const [files, setFiles] = useState<Asset[]>(initialFiles ?? []);
  const models = modelsFor(kind, lyrics).filter((m) => !referenceOnly || m.accept.includes("audio"));
  const [model, setModelState] = useState<AudioModel>(() => models.find((m) => m.key === modelKey) ?? models[0]);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [length, setLength] = useState<number>(model.lengths?.[1] ?? 0);
  const [count, setCount] = useState(1);
  const area = useRef<HTMLTextAreaElement>(null);

  const setModel = (m: AudioModel) => {
    setModelState(m);
    setLength(m.lengths?.[1] ?? 0);
    /* 克隆音色只能给克隆它的那家模型用：换到别的模型就清掉，回到 Auto */
    if (voice?.cloneModel && voice.cloneModel !== CLONE_KEY[m.key]) {
      setVoice(null);
      notify(`${voice.name} can't be used with ${m.label}, so the voice is back to Auto`);
    }
    /* 新模型收不了的素材去掉，说一声 */
    const keep = files.filter((f) => (m.accept as string[]).includes(f.kind));
    if (keep.length < files.length) {
      setFiles(keep);
      notify(`${m.label} can't use ${files.length - keep.length > 1 ? "some of your files" : "one of your files"}, so it was removed.`);
    }
  };

  /* 侧边栏换了入口：切到对应模型(渲染时对比，不用 effect) */
  const [seenModel, setSeenModel] = useState(modelKey);
  if (modelKey !== seenModel) {
    setSeenModel(modelKey);
    const m = models.find((x) => x.key === modelKey);
    if (m) {
      setModelState(m);
      setLength(m.lengths?.[1] ?? 0);
    }
  }

  useEffect(() => {
    if (!selectKey || !area.current) return;
    const el = area.current;
    const r = firstPlaceholder(el.value) ?? [el.value.length, el.value.length];
    el.focus();
    el.setSelectionRange(r[0], r[1]);
  }, [selectKey]);

  /* 积分(示意):有时长按秒算;Lyria 按首;配音没定时长显示每秒单价 */
  const cost =
    model.perSong !== undefined
      ? `${model.perSong * count}`
      : model.lengths && length > 0
        ? `${Math.max(1, Math.ceil(model.perSec! * length)) * count}`
        : model.perSec !== undefined
          ? `${model.perSec} cr/s`
          : "—"; /* 还没有定价依据的模型 */

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex max-w-[55%] shrink-0 flex-wrap items-start gap-2">
          {files.map((a) => (
            <div key={a.id} className="group relative size-[56px] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5">
              <AssetThumb asset={a} />
              <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setFiles((f) => f.filter((x) => x.id !== a.id))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          ))}
          {model.accept.length > 0 && (
            <AssetPicker
              accept={model.accept}
              multiple
              placement="down"
              uploadHint={model.accept.includes("image") ? "Support MP3, WAV, M4A, or one image" : "Support MP3, WAV, M4A"}
              onPick={(a) => setFiles((f) => [...f, ...a])}
              trigger={(open, isOpen) => (
                <button type="button" onClick={open} aria-label="Upload reference audio" className={`grid size-[56px] place-items-center rounded-xl border transition ${isOpen ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]" : "border-transparent bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"}`}>
                  <Plus className="size-5" />
                </button>
              )}
            />
          )}
        </div>
        <textarea
          ref={area}
          value={prompt}
          onChange={(e) => onPrompt(e.target.value)}
          aria-label="Prompt"
          rows={4}
          placeholder={PLACEHOLDER[kind]}
          className="min-w-0 flex-1 resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {leading}
        <Pill ariaLabel="Audio model" placement="down" width={300} icon={<Logo m={model} />} label={model.label}>
          {(close) => (
            <>
              {/* 按公司分组，公司按 A–Z 排(组内顺序不变),样式同视频模型下拉 */}
              {[...new Set(models.map((m) => m.company))].sort((a, b) => a.localeCompare(b)).map((c, gi) => (
                <div key={c} role="group" aria-label={c}>
                  <p className={`${companyHeading} ${gi > 0 ? "mt-1.5" : ""}`}>{c}</p>
                  {models.filter((m) => m.company === c).map((m) => (
                <MenuItem
                  key={m.key}
                  selected={m.key === model.key}
                  onClick={() => (setModel(m), close())}
                  icon={<Logo m={m} />}
                  label={
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {m.label}
                      {m.tags?.map((t) => (
                        <span key={t} className="rounded-[5px] bg-[#fff3ec] px-1.5 py-px text-[10.5px] font-semibold leading-4 text-[#c2410c]">
                          {t}
                        </span>
                      ))}
                    </span>
                  }
                  hint={m.hint}
                />
                  ))}
                </div>
              ))}
            </>
          )}
        </Pill>
        {kind === "voice" ? (
          <div className="flex items-center">
            <button
              type="button"
              aria-label={voice ? `Voice: ${voice.name}. Change voice` : "Choose a voice"}
              aria-haspopup="dialog"
              title={voice ? voice.name : "Auto picks a voice that fits your script"}
              onClick={() => setVoiceOpen(true)}
              className={`${pillBase} max-w-[180px] ${voiceOpen ? "border-[#ff5e1a] ring-2 ring-[#ff5e1a]/15" : ""}`}
            >
              <AudioLines className={`size-4 shrink-0 ${voice ? "text-[#ff8a3c]" : ""}`} />
              <span className="truncate">{voice ? voice.name : "Voice"}</span>
              {!voice && <ChevronDown className="size-3.5 shrink-0 text-[#9a9bb0]" />}
            </button>
            {voice && (
              <button
                type="button"
                aria-label={`Remove voice ${voice.name}`}
                title="Remove voice (back to Auto)"
                onClick={() => setVoice(null)}
                className="ml-0.5 grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f3f4f6] hover:text-[#4a4b5c]"
              >
                <X className="size-3.5" />
              </button>
            )}
            {/* 挂到 body:否则会被输入框所在层级困住 */}
            {voiceOpen &&
              createPortal(
                <VoiceModal
                  value={voice}
                  filters
                  allowClone={!!CLONE_KEY[model.key]}
                  cloneModels={CLONE_KEY[model.key] ? CLONE_MODELS : undefined}
                  voiceModel={CLONE_KEY[model.key]}
                  onChange={(v) => (setVoice(v), setVoiceOpen(false))}
                  onClose={() => setVoiceOpen(false)}
                />,
                document.body,
              )}
          </div>
        ) : model.lengths ? (
          <Pill ariaLabel="Length" placement="down" width={180} icon={<Clock3 className="size-4" />} label={fmtLen(length)}>
            {(close) => (
              <>
                {model.lengths!.map((s) => (
                  <MenuItem key={s} selected={s === length} onClick={() => (setLength(s), close())} label={fmtLen(s)} hint={s === 0 ? "Length fits the description" : undefined} />
                ))}
              </>
            )}
          </Pill>
        ) : (
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ececf1] px-2.5 text-[13px] font-semibold text-[#6a6b7b]"
            title={model.key === SEED ? "Seed Audio sets the length from your prompt" : model.perSong !== undefined ? "Lyria always makes a full song" : "The model sets the length"}
          >
            <Clock3 className="size-4" /> {model.key === SEED ? "Fits your prompt · up to 2 min" : model.perSong !== undefined ? "Full song · ~2 min" : "Auto length"}
          </span>
        )}
        <CountMenu value={count} onChange={setCount} placement="down" />
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]">
            <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
            {cost}
          </span>
          {variant === "canvas" ? (
            <button
              type="button"
              aria-label="Generate"
              disabled={!prompt.trim()}
              onClick={() => (onCreate ? onCreate(model) : notify("Your audio is generating"))}
              className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!prompt.trim()}
              onClick={() => (onCreate ? onCreate(model) : notify(count > 1 ? `${count} audio clips are generating` : "Your audio is generating"))}
              className={homeCta}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
