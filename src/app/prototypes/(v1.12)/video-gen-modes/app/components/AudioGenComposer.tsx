"use client";

/* 首页 Audio Gen 输入框(2026-11-06 Monica 定，照真实产品截图):
   左上「+」上传参考音频 / 图片，提示词，底栏 [Audio Gen][模型][第三个选项][条数] … [积分][Create]。
   - 模型下拉按 Voice / Music / Sound Effects 分组，列 v1.12 上新清单里的音频模型(Notion「v1.12 上新模型清单与定价」);
   - 第三个选项跟着类型变:Voice → 音色;Music → 时长(Lyria 固定整首约 2 分钟);Sound Effects → 时长(含 Auto);
   - 侧边栏 Audio 菜单的 4 项(AI Voiceover、Background Music、Voice Clone、Sound Effects;Voice Enhancer 2026-11-06 删除)都进这里，预选模型并预填提示词，选中第一个 [占位]。
   积分是示意数，不是定价;点 Create 之后的交互不在本需求范围，只弹提示。 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AudioLines, Clock3, Plus, X } from "lucide-react";
import { firstPlaceholder } from "@/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import type { Asset } from "../assets";
import { AssetPicker, AssetThumb } from "./AssetPicker";
import { CountMenu } from "./BarMenus";
import { MenuItem, Pill, menuHeading } from "./Popover";

const homeCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

export type AudioKind = "voice" | "music" | "sfx";
const KIND_LABEL: Record<AudioKind, string> = { voice: "Voice", music: "Music", sfx: "Sound Effects" };

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
  { key: "seed-audio-1.0", label: "Seed Audio 1.0", kind: "voice", icon: `${SG}/bytedance.svg`, perSec: 0.5, accept: ["audio", "image"], tags: ["Voice Clone"], hint: "Multi-speaker voiceovers with ambience, 21 languages. Up to 3 reference voices." },
  { key: "eleven-v4", label: "ElevenLabs Eleven v4", kind: "voice", perSec: 0.6, accept: [], hint: "Most natural voiceovers, 70+ languages." },
  { key: "eleven-v4-turbo", label: "ElevenLabs Eleven v4 Turbo", kind: "voice", perSec: 0.3, accept: [], hint: "Half the price of v4, slightly less expressive." },
  { key: "minimax-speech-2.8-hd", label: "MiniMax Speech 2.8 HD", kind: "voice", icon: `${VG}/hailuo-color.svg`, perSec: 0.6, accept: ["audio"], tags: ["Voice Clone"], hint: "17 preset voices or a voice cloned from 10s+ of audio, with emotion control, 40+ languages." },
  { key: "gemini-3.8-flash-tts", label: "Gemini 3.8 Flash TTS", kind: "voice", icon: `${SG}/gemini.svg`, perSec: 0.1, accept: [], hint: "Low-cost multilingual voiceovers." },
  { key: "eleven-music-v2.5", label: "ElevenLabs Music v2.5", kind: "music", perSec: 0.2, accept: ["audio"], lengths: [15, 30, 60, 120], hint: "Background music you can time to your ad, with or without vocals." },
  { key: "lyria-3.5", label: "Lyria 3.5", kind: "music", icon: `${SG}/gemini.svg`, perSong: 8, accept: [], hint: "A full song (about 2 min) with vocals and lyrics." },
  { key: "eleven-sfx-v3", label: "ElevenLabs Sound Effects V3", kind: "sfx", perSec: 0.1, accept: [], lengths: [0, 2, 5, 10, 30], hint: "Sound effects from 0.5 to 30s, can loop." },
];

const VOICES = [
  { key: "auto", label: "Auto", hint: "Picks a voice that fits your script" },
  { key: "ava", label: "Ava", hint: "Warm, conversational" },
  { key: "noah", label: "Noah", hint: "Calm, confident" },
  { key: "ivy", label: "Ivy", hint: "Bright, upbeat" },
  { key: "leo", label: "Leo", hint: "Deep, steady" },
];

const PLACEHOLDER: Record<AudioKind, string> = {
  voice: "Describe the sound you imagine, or paste the script to turn into a voiceover.",
  music: "Describe the music: mood, genre and tempo, such as upbeat lo-fi for a skincare ad.",
  sfx: "Describe the sound effect, such as a soft whoosh for a product reveal.",
};

const fmtLen = (s: number) => (s === 0 ? "Auto" : s >= 60 ? `${s / 60} min` : `${s}s`);

function Logo({ m }: { m: AudioModel }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (m.icon) return <img src={m.icon} alt="" className="size-4 object-contain" />;
  return <span className="grid size-4 place-items-center rounded-[4px] bg-[#1a1a2e] text-[9px] font-bold text-white">{m.label[0]}</span>;
}

export function AudioGenComposer({
  prompt,
  onPrompt,
  modelKey,
  selectKey,
  leading,
  notify,
}: {
  prompt: string;
  onPrompt: (p: string) => void;
  /** 从侧边栏进来时预选的模型 */
  modelKey?: string;
  /** 变了就聚焦并选中第一个 [占位] */
  selectKey?: string;
  leading: ReactNode;
  notify: (t: string) => void;
}) {
  const [files, setFiles] = useState<Asset[]>([]);
  const [model, setModelState] = useState<AudioModel>(() => AUDIO_MODELS.find((m) => m.key === modelKey) ?? AUDIO_MODELS[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [length, setLength] = useState<number>(model.lengths?.[1] ?? 0);
  const [count, setCount] = useState(1);
  const area = useRef<HTMLTextAreaElement>(null);

  const setModel = (m: AudioModel) => {
    setModelState(m);
    setLength(m.lengths?.[1] ?? 0);
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
    const m = AUDIO_MODELS.find((x) => x.key === modelKey);
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
        : `${model.perSec} cr/s`;

  const groups: AudioKind[] = ["voice", "music", "sfx"];
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
          placeholder={PLACEHOLDER[model.kind]}
          className="min-w-0 flex-1 resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {leading}
        <Pill ariaLabel="Audio model" placement="down" width={300} icon={<Logo m={model} />} label={model.label}>
          {(close) => (
            <>
              {groups.map((g) => (
                <div key={g}>
                  <p className={menuHeading}>{KIND_LABEL[g]}</p>
                  {AUDIO_MODELS.filter((m) => m.kind === g).map((m) => (
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
        {model.kind === "voice" ? (
          <Pill ariaLabel="Voice" placement="down" width={240} icon={<AudioLines className="size-4" />} label={voice.label === "Auto" ? "Voice" : voice.label}>
            {(close) => (
              <>
                {VOICES.map((v) => (
                  <MenuItem key={v.key} selected={v.key === voice.key} onClick={() => (setVoice(v), close())} label={v.label} hint={v.hint} />
                ))}
              </>
            )}
          </Pill>
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
          <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ececf1] px-2.5 text-[13px] font-semibold text-[#6a6b7b]" title="Lyria always makes a full song">
            <Clock3 className="size-4" /> Full song · ~2 min
          </span>
        )}
        <CountMenu value={count} onChange={setCount} placement="down" />
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]">
            <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
            {cost}
          </span>
          <button
            type="button"
            disabled={!prompt.trim()}
            onClick={() => notify(count > 1 ? `${count} audio clips are generating` : "Your audio is generating")}
            className={homeCta}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
