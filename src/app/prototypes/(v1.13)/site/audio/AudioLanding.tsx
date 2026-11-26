"use client";

/* 音频落地页的首屏 + 声音板块(2026-11-25,Monica:「音频的落地页你去学一下竞品是怎么做的，比如 elevenlabs」)。
   三种版式，样例数据在 audio-samples.ts(按竞品调研定的样例位):
     voice — 首屏一排竖版人物声音卡(场景 · 声音名 · 播放键)→ 标题 + 一句答案 + 两个按钮 → 语气 bento(脚本 + 设置面板)→ 声音库(按场景切换)→ 对话 / 克隆 / 多语言三小卡;
     music — 左标题右说明 → 大提示词框(Instrumental / Lyrics + 风格 chips)→ 专辑封面 3D 轮播(中间那张可播，按段落分段的进度条)→ 一段音乐三种用法;
     sfx   — 居中标题 → 提示词框(Loop 开关 + 时长)→ 可点播的音效方格(最后一格 Create your own)→ 配到视频时间轴。
   视觉用自家品牌(#FF744D + design.md 官方色板),不照搬 ElevenLabs 的配色、文案和图。
   模型页 / 工具页只在「音频类」时用这里替换首屏和示例区，下面的 SEO 段(prompt 写法、规格价格、三步、用途、对比、FAQ、JSON-LD)不变。 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUp, AudioLines, Bell, ChevronLeft, ChevronRight, Footprints, Languages, Mic, Pause, Play, Plus, Repeat, Rocket, Sparkles, SlidersHorizontal, TrendingUp, Users, Wind, CloudRain, Wine, Zap, Keyboard, Camera, Music2, type LucideIcon } from "lucide-react";
import { OA_CTA, OA_H2, OA_WRAP, OAPromptBox, type LinkProps } from "../oa/kit";
import { AudioProvider, Bars, fmt, PlayButton, usePlay, usePlayThis, Wave } from "./player";
import { ALL_IN_ONE, CLONED_AS, CLONE_DEMO, DIALOGUE_DEMO, LANG_LINES, MUSIC_CHIPS, MUSIC_SLOTS, MUSIC_USES, PORTRAITS, SFX_PROMPTS, SFX_SLOTS, srcOf, TAG_SCRIPT, VOICE_FOCUS, VOICE_SLOTS, type AudioKind, type MusicSlot, type SfxSlot, type VoiceSlot } from "./audio-samples";

export type AudioLandingProps = {
  /** 页面 slug(取样例用) */
  slug: string;
  kind: AudioKind;
  /** H1(模型页 = 模型名;工具页 = 搜索词) */
  title: string;
  lead: string;
  chip?: ReactNode;
  cta: { label: string; onClick: () => void };
  /** 生成框右下角的价格提示 */
  price?: string;
  /** 默认模型名(设置面板 / 生成框里显示) */
  model: string;
  /** 这个模型支持 [softly] 这类音频标签 */
  tags?: boolean;
  /** 页面的提示词(工具页带 [占位]) */
  prompt?: string;
  onPrompt?: (p: string) => void;
};

/* ElevenLabs v3 / v4 系列认 [softly] [laughs] 这类标签;其他模型用文字描述语气 */
const TAG_MODELS = /eleven-v3|eleven-v4/;
export const supportsTags = (slug: string) => TAG_MODELS.test(slug);

const H2 = ({ children, sub, center = true }: { children: ReactNode; sub?: string; center?: boolean }) => (
  <div className={center ? "mx-auto max-w-[46rem] text-center" : "max-w-[40rem]"}>
    <h2 className={OA_H2}>{children}</h2>
    {sub && <p className="mt-4 text-[16px] leading-relaxed text-[#CACACA] [text-wrap:pretty]">{sub}</p>}
  </div>
);
const SECTION = "py-20 md:py-24";
const CARD = "rounded-[24px] bg-white/[0.05] ring-1 ring-white/[0.08]";

/* 只展示这一页真的有音频的样例位:没生成的位不拿别的模型的声音顶替 */
const has = (slug: string, slot: string, kind: AudioKind | "dialogue") => !srcOf(slug, slot, kind).placeholder;
const musicOf = (slug: string) => {
  const own = MUSIC_SLOTS.filter((m) => has(slug, m.id, "music"));
  return own.length ? own : MUSIC_SLOTS;
};
/* 声音复刻页：每张卡是复刻的另一个人的声音，名字按原声那个人写(CLONED_AS) */
/* 2026-11-26 Monica:「音频怎么每一页人放的都一样」—— 每个模型页的 FILLED 可以给自己的人像(cover)和名字(voice) */
const voiceOf = (slug: string, v: VoiceSlot): VoiceSlot => {
  const own = srcOf(slug, v.id, "voice");
  const named = !own.placeholder && own.voice ? { ...v, voice: own.voice } : v;
  const c = CLONED_AS[slug];
  return c ? { ...named, tone: c.tone, accent: c.accent, voice: c.names[v.id] ?? named.voice } : named;
};

export function AudioLanding(p: AudioLandingProps) {
  return (
    <AudioProvider>
      {p.kind === "voice" ? <VoiceLanding {...p} /> : p.kind === "music" ? <MusicLanding {...p} /> : <SfxLanding {...p} />}
    </AudioProvider>
  );
}

/* ───────────────────────── 语音 ───────────────────────── */

function VoiceLanding(p: AudioLandingProps) {
  const focus = VOICE_FOCUS[p.slug];
  const hero = VOICE_SLOTS.slice(0, 5);
  return (
    <>
      <section className="relative isolate overflow-hidden pb-16 pt-10 md:pb-20 md:pt-16">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
        <VoiceCards slug={p.slug} slots={hero} onTry={p.cta.onClick} />
        <div className={`${OA_WRAP} mt-12 text-center md:mt-14`}>
          {p.chip && <div className="mb-6 flex justify-center">{p.chip}</div>}
          <h1 className="mx-auto max-w-[min(1100px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(42px,calc(30px+3.4vw),88px)]">{p.title}</h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[15px] leading-[24px] text-white/75 [text-wrap:pretty]">{p.lead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={p.cta.onClick} className={OA_CTA}>
              {p.cta.label} <ArrowRight className="size-4" />
            </button>
            <a href="#voices" className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-[15px] font-bold text-white ring-1 ring-white/10 transition hover:bg-white/[0.14]">
              <AudioLines className="size-4" /> Hear more voices
            </a>
          </div>
        </div>
      </section>

      {focus === "clone" && <CloneFeature slug={p.slug} />}
      {focus === "dialogue" && <DialogueFeature slug={p.slug} />}
      {has(p.slug, "tags", "voice") && <TagBento {...p} />}
      <VoiceLibrary slug={p.slug} />
      <VoiceTrio slug={p.slug} focus={focus} />
      {ALL_IN_ONE.has(p.slug) && <AllInOne slug={p.slug} />}
    </>
  );
}

/* 首屏人物卡：竖版人像;选中那张在正中并出现「Try this voice」。
   2026-11-26 Monica:先说「选中的自动滑动到中间」,看过后又贴了音乐页的唱片轮播:「我感觉做成图 1 这样」——
   和音乐页同一种立体轮播：选中的正对着你，两边的卡片向后转、互相叠压、逐渐变暗;点两边的卡或左右箭头切换，手机上可左右滑 */
/** 首屏人物卡默认居中的那张。2026-11-26 Monica 先后在 Gemini 3.8 Flash TTS 和 Seed Audio 1.0 页画箭头:Social Media 那张「默认居中」——
    连着两页都是它，改成所有页面默认都居中 Social Media(id = social);哪页要别的在这里单独指定，没有这张卡的页面仍是中间那张 */
const VOICE_DEFAULT: Record<string, string> = {};
function VoiceCards({ slug, slots, onTry }: { slug: string; slots: VoiceSlot[]; onTry: () => void }) {
  const n = slots.length;
  /* 默认正中放哪张:Social Media 那张;个别页面可在 VOICE_DEFAULT 里另外指定 */
  const [sel, setSel] = useState(() => { const k = slots.findIndex((x) => x.id === (VOICE_DEFAULT[slug] ?? "social")); return k >= 0 ? k : Math.floor(n / 2); });
  const touch = useRef<number | null>(null);
  const go = (k: number) => setSel(((k % n) + n) % n);
  return (
    <div
      className="relative mx-auto h-[310px] max-w-[1400px] [perspective:1600px] md:h-[395px]"
      aria-roledescription="carousel"
      aria-label="Example voices"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 40) go(sel + (dx < 0 ? 1 : -1));
      }}
    >
      {slots.map((s, i) => {
        let d = i - sel;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        return <VoiceCard key={s.id} slug={slug} s={s} selected={d === 0} d={d} onSelect={() => go(i)} onTry={onTry} />;
      })}
      {/* 箭头放在整排最外侧(不像音乐页压在第二张上):这里卡片是人像，箭头不能压到脸 */}
      <button type="button" onClick={() => go(sel - 1)} aria-label="Previous voice" className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/20">
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" onClick={() => go(sel + 1)} aria-label="Next voice" className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/20">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function VoiceCard({ slug, s: raw, selected, onSelect, onTry, d }: { slug: string; s: VoiceSlot; selected: boolean; onSelect: () => void; onTry: () => void; /** 离正中几格(负 = 左边) */ d: number }) {
  const s = voiceOf(slug, raw);
  const f = srcOf(slug, s.id, "voice");
  const pl = usePlay(`${slug}:${s.id}`, f.src);
  const cover = f.cover ?? PORTRAITS[s.id];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelect();
        if (!pl.playing) pl.toggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
          pl.toggle();
        }
      }}
      aria-label={`${s.voice}, ${s.scene} voice`}
      style={{
        /* 2026-11-26 Monica:「放宽」—— 卡片间距 78% → 96%,后退和转角都减小，两边的人脸不再被前一张挡住，整排铺到两个箭头之间 */
        transform: `translateX(calc(-50% + ${d * 96}%)) translateZ(${-Math.abs(d) * 110}px) rotateY(${d * -16}deg)`,
        opacity: Math.abs(d) > 2 ? 0 : 1 - Math.abs(d) * 0.18,
        zIndex: 10 - Math.abs(d),
        pointerEvents: Math.abs(d) > 2 ? "none" : undefined,
      }}
      className={`group absolute left-1/2 top-0 aspect-[3/4] w-[220px] cursor-pointer overflow-hidden rounded-[22px] bg-[#1C1C1C] text-left shadow-[0_30px_70px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] motion-reduce:transition-none md:w-[280px] ${
        selected ? "shadow-[0_24px_60px_rgba(255,116,77,0.28)] ring-2 ring-[#FF744D]" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85" />
      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">{s.scene}</span>
      <span className="absolute right-3 top-3">
        <PlayButton playing={pl.playing} onClick={() => (onSelect(), pl.toggle())} label={`${s.voice} voice sample`} size="sm" tone={pl.playing ? "brand" : "glass"} />
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-bold text-white">{s.voice}</p>
          {pl.playing && <Bars on className="text-[#FF744D]" n={4} />}
        </div>
        <p className="mt-0.5 text-[12.5px] text-white/70">
          {s.tone} · {s.accent}
        </p>
        <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-[#FF744D] transition-[width] duration-200" style={{ width: `${pl.progress * 100}%` }} />
        </div>
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTry();
            }}
            className="mt-3 w-full rounded-xl bg-white py-2 text-[13px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]"
          >
            Try this voice
          </button>
        )}
      </div>
    </div>
  );
}

/* 语气 bento:左边带标签的脚本(标签高亮)+ 播放;右边设置面板 */
function TagBento(p: AudioLandingProps) {
  const tags = p.tags;
  const f = srcOf(p.slug, "tags", "voice");
  const pl = usePlay(`${p.slug}:tags`, f.src);
  const [speed, setSpeed] = useState(1);
  const [style, setStyle] = useState(55);
  const [stab, setStab] = useState(40);
  const parts = TAG_SCRIPT.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <section className={SECTION}>
      <div className={OA_WRAP}>
        <H2 sub={tags ? `Type a tag like [softly] or [laughs] where the line should change. ${p.model} reads it as direction, not words.` : `Describe the tone in plain words, mark where the mood should change, then set speed and style before you generate.`}>
          {tags ? "Direct every line with audio tags" : "Set the tone before you generate"}
        </H2>
        <div className="mt-12 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className={`${CARD} flex flex-col p-6 md:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-semibold text-[#9F9F9F]">Script</span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] font-semibold text-[#CACACA]">{TAG_SCRIPT.replace(/\[[^\]]+\]\s*/g, "").length} characters</span>
            </div>
            <p className="mt-5 flex-1 text-[19px] leading-[1.75] text-[#E8E8E8] md:text-[21px]">
              {parts.map((x, i) =>
                x.startsWith("[") ? (
                  <span key={i} className="mx-0.5 inline-block rounded-md bg-[#FF744D]/15 px-1.5 py-0.5 align-[1px] font-mono text-[0.78em] font-semibold text-[#FF9C7F] ring-1 ring-[#FF744D]/40">
                    {tags ? x : x.slice(1, -1)}
                  </span>
                ) : (
                  <span key={i}>{x}</span>
                ),
              )}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <PlayButton playing={pl.playing} onClick={pl.toggle} label="tagged script" tone="brand" />
              <Wave seed="tags" progress={pl.progress} onSeek={pl.seek} />
              <span className="w-10 shrink-0 text-right text-[12.5px] tabular-nums text-[#9F9F9F]">{pl.duration ? fmt(pl.time) : "0:18"}</span>
            </div>
          </div>
          <div className={`${CARD} p-6 md:p-8`}>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#9F9F9F]">
              <SlidersHorizontal className="size-4" /> Settings
            </div>
            <dl className="mt-5 space-y-3">
              <Row k="Voice">
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={srcOf(p.slug, "ad", "voice").cover ?? PORTRAITS.ad} alt="" className="size-6 rounded-full object-cover" /> {CLONED_AS[p.slug] ? `${voiceOf(p.slug, VOICE_SLOTS[0]).voice} · cloned` : `${voiceOf(p.slug, VOICE_SLOTS[0]).voice} · American`}
                </span>
              </Row>
              <Row k="Model">{p.model}</Row>
            </dl>
            <div className="mt-6 space-y-5">
              <Slider label="Speed" value={speed} min={0.7} max={1.3} step={0.05} onChange={setSpeed} show={`${speed.toFixed(2)}×`} />
              <Slider label="Style" value={style} min={0} max={100} step={1} onChange={setStyle} show={style < 35 ? "Calm" : style > 70 ? "Expressive" : "Natural"} />
              <Slider label="Stability" value={stab} min={0} max={100} step={1} onChange={setStab} show={`${stab}%`} />
            </div>
            <button type="button" onClick={p.cta.onClick} className={`${OA_CTA} mt-8 w-full`}>
              Generate speech <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const Row = ({ k, children }: { k: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl bg-black/40 px-4 py-3 ring-1 ring-white/[0.06]">
    <dt className="text-[13.5px] text-[#9F9F9F]">{k}</dt>
    <dd className="text-[14px] font-semibold text-white">{children}</dd>
  </div>
);

function Slider({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex justify-between text-[13.5px]">
        <span className="font-semibold text-[#E8E8E8]">{label}</span>
        <span className="tabular-nums text-[#9F9F9F]">{show}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,116,77,0.35)]"
        style={{ background: `linear-gradient(to right, #FF744D ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}
      />
    </label>
  );
}

/* 声音库：按场景切换，每条可播 */
const SCENES = ["All", "Advertisement", "Social Media", "Narration", "Conversational", "Educational", "Character"] as const;
function VoiceLibrary({ slug }: { slug: string }) {
  const [tab, setTab] = useState<(typeof SCENES)[number]>("All");
  const list = VOICE_SLOTS.filter((v) => tab === "All" || v.scene === tab);
  return (
    <section id="voices" className={`${SECTION} scroll-mt-20 bg-[#0B0B0B]`}>
      <div className={OA_WRAP}>
        <H2 sub="Pick a voice for the job. Every sample below is a script read in the voice and style you see on the card.">Voices for every kind of video</H2>
        <div role="tablist" aria-label="Voice categories" className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 mt-9 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:justify-center md:px-0">
          {SCENES.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold transition ${tab === s ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-[#CACACA] hover:bg-white/[0.12]"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <VoiceRow key={v.id} slug={slug} v={v} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VoiceRow({ slug, v: raw }: { slug: string; v: VoiceSlot }) {
  const v = voiceOf(slug, raw);
  const f = srcOf(slug, v.id, "voice");
  const pl = usePlay(`${slug}:${v.id}`, f.src);
  return (
    <article className={`${CARD} flex flex-col p-5 transition ${pl.active ? "ring-[#FF744D]/60" : "hover:bg-white/[0.07]"}`}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.cover ?? PORTRAITS[v.id]} alt="" loading="lazy" className="size-12 rounded-full object-cover ring-1 ring-white/15" />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-[16px] font-bold">
            {v.voice} {pl.playing && <Bars on className="text-[#FF744D]" n={3} />}
          </h3>
          <p className="truncate text-[13px] text-[#9F9F9F]">
            {v.tone} · {v.accent}
          </p>
        </div>
        <PlayButton playing={pl.playing} onClick={pl.toggle} label={`${v.voice} sample`} />
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-[14px] leading-relaxed text-[#CACACA]">“{(f.placeholder ? undefined : f.text) ?? v.script.replace(/\[[^\]]+\]\s*/g, "")}”</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-semibold text-[#CACACA]">{v.scene}</span>
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[#FF744D] transition-[width] duration-200" style={{ width: `${pl.progress * 100}%` }} />
        </div>
      </div>
    </article>
  );
}

/* 三小卡：多人对话 / 克隆 / 多语言 */
function VoiceTrio({ slug, focus }: { slug: string; focus?: "clone" | "dialogue" }) {
  const showDialogue = focus !== "dialogue" && has(slug, DIALOGUE_DEMO.id, "dialogue");
  const showClone = focus !== "clone" && has(slug, CLONE_DEMO.output.id, "voice");
  const showLang = LANG_LINES.some((l) => has(slug, `lang-${l.id}`, "voice"));
  const count = [showDialogue, showClone, showLang].filter(Boolean).length;
  const showVideo = count < 3;
  const cols = count + 1 >= 3 || !showVideo ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <section className={SECTION}>
      <div className={OA_WRAP}>
        <H2 sub="Scenes with two speakers, a voice that sounds like you, and the same line in another language, all from one script box.">More than one voice per project</H2>
        <div className={`mt-12 grid gap-4 ${cols}`}>
          {showDialogue && <DialogueCard slug={slug} />}
          {showClone && <CloneCard slug={slug} />}
          {showLang && <LangCard slug={slug} />}
          {showVideo && <ScriptToVideoCard slug={slug} />}
        </div>
      </div>
    </section>
  );
}

function DialogueCard({ slug, big = false }: { slug: string; big?: boolean }) {
  const f = srcOf(slug, DIALOGUE_DEMO.id, "dialogue");
  const pl = usePlay(`${slug}:${DIALOGUE_DEMO.id}`, f.src);
  return (
    <article className={`${CARD} flex flex-col p-6 ${big ? "md:p-8" : ""}`}>
      <Head icon={Users} title={f.placeholder || !f.title ? "Two-speaker dialogue" : f.title} body={f.placeholder || !f.text ? "Write the lines, name the speakers, and get one natural conversation." : f.text} />
      <ol className="mt-5 flex-1 space-y-2.5">
        {(f.lines ?? DIALOGUE_DEMO.lines).map((l, i) => {
          const [who, line] = l.split(/:\s(.*)/);
          return (
            <li key={i} className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[14px] leading-snug ${i % 2 ? "ml-auto rounded-br-md bg-[#FF744D]/15 text-[#FFD9CC]" : "rounded-bl-md bg-white/[0.07] text-[#E8E8E8]"}`}>
              <span className="block text-[11.5px] font-bold opacity-70">{who}</span>
              {line.replace(/\[[^\]]+\]\s*/g, "")}
            </li>
          );
        })}
      </ol>
      <Player pl={pl} label="dialogue sample" seed="dialogue" />
    </article>
  );
}

function CloneCard({ slug }: { slug: string }) {
  const r = srcOf(slug, CLONE_DEMO.reference.id, "voice");
  const o = srcOf(slug, CLONE_DEMO.output.id, "voice");
  const a = usePlay(`${slug}:${CLONE_DEMO.reference.id}`, r.src);
  const b = usePlay(`${slug}:${CLONE_DEMO.output.id}`, o.src);
  return (
    <article className={`${CARD} flex flex-col p-6`}>
      <Head icon={Mic} title="Clone your voice" body="Upload a short clean recording, then make the clone read any new script." />
      <div className="mt-5 flex-1 space-y-3">
        {[
          { x: CLONE_DEMO.reference, pl: a },
          { x: CLONE_DEMO.output, pl: b },
        ].map(({ x, pl }, i) => (
          <div key={x.id} className={`rounded-2xl p-4 ${i ? "bg-[#FF744D]/10 ring-1 ring-[#FF744D]/30" : "bg-black/40 ring-1 ring-white/[0.06]"}`}>
            <div className="flex items-center gap-3">
              <PlayButton playing={pl.playing} onClick={pl.toggle} label={x.label} size="sm" tone={i ? "brand" : "light"} />
              <div className="min-w-0">
                <p className="text-[13px] font-bold">{x.label}</p>
                <p className="line-clamp-1 text-[12.5px] text-[#9F9F9F]">“{x.script}”</p>
              </div>
            </div>
            <Wave seed={x.id} progress={pl.progress} onSeek={pl.seek} bars={44} className="mt-3 h-6" />
          </div>
        ))}
      </div>
    </article>
  );
}

function LangCard({ slug }: { slug: string }) {
  const [i, setI] = useState(0);
  const langs = LANG_LINES.filter((x) => has(slug, `lang-${x.id}`, "voice"));
  const l = langs[i] ?? LANG_LINES[0];
  const f = srcOf(slug, `lang-${l.id}`, "voice");
  const pl = usePlay(`${slug}:lang-${l.id}`, f.src);
  return (
    <article className={`${CARD} flex flex-col p-6`}>
      <Head icon={Languages} title="Same line, another language" body="Keep one voice across markets. Pick a language and hear the line." />
      <div className="mt-5 flex flex-wrap gap-2">
        {langs.map((x, k) => (
          <button key={x.id} type="button" onClick={() => setI(k)} aria-pressed={k === i} className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${k === i ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-[#CACACA] hover:bg-white/[0.12]"}`}>
            {x.lang}
          </button>
        ))}
      </div>
      <p lang={l.id} className="mt-6 flex-1 text-[24px] font-bold leading-snug tracking-[-0.01em] [text-wrap:balance]">
        {l.line}
      </p>
      <Player pl={pl} label={`${l.lang} sample`} seed={l.id} />
    </article>
  );
}

/* 2026-11-26 Monica:「这里要配一张图」—— 画一个迷你剪辑界面：竖版预览放 LUMEA 精华成片(静音循环),
   下面三条轨道 Video / Voiceover / Music;点播放就用本页 Advertisement 那条配音(念的正是 LUMEA 广告词)盖在画面上，播放头跟着走 */
const LUMEA = { src: "/prototypes/site/models/wan-3-0-prime/lp-lumea-ad.mp4", poster: "/prototypes/site/models/wan-3-0-prime/lp-lumea-ad.webp" };
const LUMEA_CAPS = ["Your skin called.", "Meet LUMEA Glow Serum", "One drop.", "Try it for 30 days"];
function ScriptToVideoCard({ slug }: { slug: string }) {
  const f = srcOf(slug, "ad", "voice");
  const pl = usePlay(`${slug}:ad`, f.src);
  const vRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    if (pl.playing) v.play().catch(() => {});
    else v.pause();
  }, [pl.playing]);
  const cap = LUMEA_CAPS[Math.min(LUMEA_CAPS.length - 1, Math.floor(pl.progress * LUMEA_CAPS.length))];
  const head = `${Math.max(0, Math.min(1, pl.progress)) * 100}%`;
  return (
    <article className={`${CARD} flex flex-col p-6`}>
      <Head icon={Camera} title="Drop it on your video" body="Send the voiceover straight to Canvas and line it up with your clips, captions and music." />
      <div className="mt-5 flex flex-1 flex-col rounded-2xl bg-black/40 p-3 ring-1 ring-white/[0.06]">
        <div className="relative mx-auto aspect-[9/16] w-[38%] min-w-[96px] overflow-hidden rounded-xl bg-[#1C1C1C] ring-1 ring-white/10">
          <video ref={vRef} src={LUMEA.src} poster={LUMEA.poster} muted loop playsInline preload="metadata" aria-hidden className="size-full object-cover" />
          <span className="absolute inset-x-2 bottom-3 rounded-md bg-black/70 px-1.5 py-1 text-center text-[10.5px] font-bold leading-tight text-white">{cap}</span>
        </div>
        <div className="relative mt-3 space-y-1.5">
          {/* 视频轨：成片封面切成几格 */}
          <div className="flex h-7 gap-[2px] overflow-hidden rounded-md">
            {[20, 45, 70, 35, 60, 85].map((y, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={LUMEA.poster} alt="" className="h-full flex-1 object-cover" style={{ objectPosition: `50% ${y}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[#FF744D]/15 px-2 ring-1 ring-[#FF744D]/40">
            <span className="w-[62px] shrink-0 text-[10.5px] font-bold text-[#FFB59E]">Voiceover</span>
            <Wave seed={`${slug}-vo`} progress={pl.progress} onSeek={pl.seek} bars={36} className="h-6" />
          </div>
          {/* 2026-11-26 Monica 划掉了 Music 轨(这里只演示配音，没有真的音乐) */}
          <span aria-hidden className="pointer-events-none absolute -bottom-1 -top-1 w-[2px] rounded-full bg-white transition-[left] duration-200" style={{ left: head }} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <PlayButton playing={pl.playing} onClick={pl.toggle} label="voiceover on the video" size="sm" tone="brand" />
        <span className="text-[13px] font-semibold text-[#CACACA]">Play the voiceover on the video</span>
      </div>
    </article>
  );
}

/* 克隆页 / 播客页：首屏下方先放主打能力的大卡 */
function CloneFeature({ slug }: { slug: string }) {
  return (
    <section className="pb-4 pt-4">
      <div className={`${OA_WRAP} grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
        <H2 center={false} sub="Record or upload about 10 seconds of clean speech. The clone keeps your tone and accent, and reads any script you give it.">
          Ten seconds in. Your voice out.
        </H2>
        <CloneCard slug={slug} />
      </div>
    </section>
  );
}
function DialogueFeature({ slug }: { slug: string }) {
  return (
    <section className="pb-4 pt-4">
      <div className={`${OA_WRAP} grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
        <H2 center={false} sub="Write the episode as lines for each host. Every speaker keeps their own voice, and the back-and-forth sounds like a real conversation.">
          Two hosts, one script
        </H2>
        <DialogueCard slug={slug} big />
      </div>
    </section>
  );
}

const Head = ({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) => (
  <div>
    <span className="grid size-10 place-items-center rounded-xl bg-[#FF744D]/15 text-[#FF744D]">
      <Icon className="size-5" />
    </span>
    <h3 className="mt-4 text-[19px] font-bold tracking-[-0.01em]">{title}</h3>
    <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#9F9F9F]">{body}</p>
  </div>
);

function Player({ pl, label, seed }: { pl: ReturnType<typeof usePlay>; label: string; seed: string }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <PlayButton playing={pl.playing} onClick={pl.toggle} label={label} size="sm" tone="brand" />
      <Wave seed={seed} progress={pl.progress} onSeek={pl.seek} bars={44} className="h-7" />
    </div>
  );
}

/* Seed Audio 1.0:语音之外还能做音乐和音效 */
function AllInOne({ slug }: { slug: string }) {
  return (
    <section className={`${SECTION} bg-[#0B0B0B]`}>
      <div className={OA_WRAP}>
        <H2 sub="The same model makes background music and sound effects, so one prompt can return a finished track.">Music and sound effects, too</H2>
        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            {musicOf(slug).slice(0, 3).map((m) => (
              <TrackRow key={m.id} slug={slug} m={m} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SFX_SLOTS.slice(0, 6).map((s) => (
              <SfxTile key={s.id} slug={slug} s={s} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 音乐 ───────────────────────── */

function MusicLanding(p: AudioLandingProps) {
  const first = MUSIC_CHIPS.find((c) => c.label === MUSIC_DEFAULT[p.slug]) ?? MUSIC_CHIPS[0];
  const [mode, setMode] = useState<"Instrumental" | "Lyrics">((p.prompt ? /vocal|sing|lyric/i.test(p.prompt) : first.vocals) ? "Lyrics" : "Instrumental");
  const [chip, setChip] = useState<string | null>(p.prompt ? null : first.label);
  const [text, setText] = useState(p.prompt ?? first.prompt);
  const set = (t: string) => {
    setText(t);
    p.onPrompt?.(t);
  };
  return (
    <>
      <section className="relative isolate overflow-hidden pb-12 pt-12 md:pt-20">
        <div aria-hidden className="pointer-events-none absolute right-[-200px] top-[-200px] -z-10 h-[520px] w-[820px] rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
        <div className={OA_WRAP}>
          {p.chip && <div className="mb-6">{p.chip}</div>}
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
            <h1 className="font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(42px,calc(28px+3.6vw),92px)]">{p.title}</h1>
            <div>
              <p className="text-[16px] leading-[26px] text-white/75 [text-wrap:pretty]">{p.lead}</p>
              <a href="#tracks" className="mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-white underline decoration-[#FF744D] decoration-2 underline-offset-[6px] hover:text-[#FFD9CC]">
                Listen to tracks <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
          <div className="mt-12">
            <OAPromptBox onSubmit={p.cta.onClick}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="radiogroup" aria-label="Track type" className="inline-flex rounded-full bg-white/[0.07] p-1">
                  {(["Instrumental", "Lyrics"] as const).map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => { setMode(m); if (m === "Lyrics" && !/vocal|sing|lyric/i.test(text)) set(`${text.replace(/\.$/, "")}, with vocals singing about your product.`); }} className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition ${mode === m ? "bg-white text-[#240A03]" : "text-[#CACACA] hover:text-white"}`}>
                      {m}
                    </button>
                  ))}
                </div>
                <span className="text-[12.5px] font-semibold text-[#9F9F9F]">{p.model}</span>
              </div>
              <label htmlFor="music-prompt" className="sr-only">
                Describe your track
              </label>
              <textarea
                id="music-prompt"
                rows={3}
                value={text}
                onChange={(e) => set(e.target.value)}
                className="mt-4 w-full resize-none bg-transparent px-1 text-[17px] leading-relaxed text-white placeholder:text-[#9F9F9F] focus:outline-none md:text-[19px]"
                placeholder="Describe the genre, mood, tempo and length…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-[12.5px] text-[#9F9F9F]">30 s · MP3</span>
                <span className="ml-auto flex items-center gap-3">
                  {p.price && <span className="text-[13px] font-semibold tabular-nums text-[#CACACA]">{p.price}</span>}
                  <button type="submit" className={OA_CTA}>
                    {p.cta.label} <ArrowUp className="size-4" />
                  </button>
                </span>
              </div>
            </OAPromptBox>
            <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
              {MUSIC_CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  aria-pressed={chip === c.label}
                  onClick={() => {
                    setChip(c.label);
                    setMode(c.vocals ? "Lyrics" : "Instrumental");
                    set(c.prompt);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold ring-1 transition ${chip === c.label ? "bg-[#FF744D] text-[#240A03] ring-[#FF744D]" : "bg-transparent text-[#E8E8E8] ring-white/20 hover:bg-white/[0.08]"}`}
                >
                  <Music2 className="mr-1.5 inline size-3.5 align-[-2px]" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* 2026-11-26 Monica:「怎么查看 prompt 和做同款」—— 轮播下方显示当前曲子的 prompt,「Use this prompt」填回上面的输入框并滚回去 */}
      <MusicCarousel
        slug={p.slug}
        onUse={(prompt, vocals) => {
          setChip(MUSIC_CHIPS.find((c) => c.prompt === prompt)?.label ?? null);
          setMode(vocals ? "Lyrics" : "Instrumental");
          set(prompt);
          const box = document.getElementById("music-prompt") as HTMLTextAreaElement | null;
          box?.scrollIntoView({ behavior: "smooth", block: "center" });
          box?.focus({ preventScroll: true });
        }}
      />
      <MusicUses slug={p.slug} />
    </>
  );
}

/* 会唱歌词的模型 / 写歌、jingle 页默认停在对应风格 */
const MUSIC_DEFAULT: Record<string, string> = { "lyria-3-5": "Pop anthem", "mureka-v9-5": "Country ballad", "ai-song-generator": "Pop anthem", "ai-jingle-generator": "Jingle", "minimax-music-3": "Corporate upbeat" };

/* 专辑封面：两色渐变 + 大字歌名(不借别处的图);素材会话给了 cover 就用图 */
function Cover({ m, cover, className = "" }: { m: MusicSlot; cover?: string; className?: string }) {
  if (cover)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover} alt="" className={`size-full object-cover ${className}`} />;
  return (
    <div className={`relative size-full overflow-hidden ${className}`} style={{ background: `linear-gradient(140deg, ${m.hue[0]}, ${m.hue[1]})` }}>
      <div aria-hidden className="absolute -right-1/4 -top-1/4 size-[90%] rounded-full border-[18px] border-white/15" />
      <div aria-hidden className="absolute -bottom-1/3 -left-1/4 size-[80%] rounded-full bg-black/15 blur-xl" />
      <span className="absolute bottom-4 left-4 right-4 text-[clamp(22px,2.6vw,34px)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.25)]">{m.title}</span>
    </div>
  );
}

const CAROUSEL_DEFAULT: Record<string, string> = { "lyria-3-5": "glow-up" };

function MusicCarousel({ slug, onUse }: { slug: string; onUse: (prompt: string, vocals: boolean) => void }) {
  const slots = musicOf(slug);
  const n = slots.length;
  /* 2026-11-26 Monica:默认停在 Slow Mornings,Lyria 页停在 Glow Up(CAROUSEL_DEFAULT);没有这首的页面仍停第 3 张 */
  const [i, setI] = useState(() => { const k = slots.findIndex((m) => m.id === (CAROUSEL_DEFAULT[slug] ?? "slow-mornings")); return k >= 0 ? k : Math.min(2, n - 1); });
  const [tab, setTab] = useState<"Genres" | "Use cases">("Genres");
  const [showLyrics, setShowLyrics] = useState(false);
  const cur = slots[i];
  const f = srcOf(slug, cur.id, "music");
  const pl = usePlay(`${slug}:${cur.id}`, f.src);
  const total = cur.sections.reduce((a, [, s]) => a + s, 0);
  const playThis = usePlayThis();
  /* 2026-11-26 Monica:「我觉得这里的交互是点哪一张就自动播放？」—— 点两边的唱片或左右箭头：转到正中并直接开始播;
     点正中那张：播放 / 暂停 */
  const go = (k: number) => {
    const j = ((k % n) + n) % n;
    setI(j);
    const t = slots[j];
    playThis(`${slug}:${t.id}`, srcOf(slug, t.id, "music").src);
  };
  return (
    <section id="tracks" className={`${SECTION} scroll-mt-20 overflow-hidden`}>
      <div className={OA_WRAP}>
        <H2 sub="Every track below came from a short text prompt. Play one, then make your own in the same style.">Tracks made for ads</H2>
      </div>
      <div className="relative mt-14 h-[300px] [perspective:1400px] md:h-[380px]" aria-roledescription="carousel" aria-label="Example tracks">
        {slots.map((m, k) => {
          let d = k - i;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const far = Math.abs(d) > 2;
          return (
            <div
              key={m.id}
              role={d === 0 ? undefined : "button"}
              tabIndex={d === 0 || far ? -1 : 0}
              aria-label={d === 0 ? undefined : `${m.title}, ${m.genres.join(", ")}`}
              onClick={() => (d === 0 ? pl.toggle() : go(k))}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), d === 0 ? pl.toggle() : go(k))}
              className="absolute left-1/2 top-0 aspect-square w-[240px] cursor-pointer overflow-hidden rounded-[22px] shadow-[0_30px_70px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out md:w-[320px]"
              style={{
                transform: `translateX(calc(-50% + ${d * 78}%)) translateZ(${-Math.abs(d) * 180}px) rotateY(${d * -24}deg)`,
                opacity: far ? 0 : 1 - Math.abs(d) * 0.22,
                zIndex: 10 - Math.abs(d),
                pointerEvents: far ? "none" : undefined,
              }}
            >
              <Cover m={m} cover={srcOf(slug, m.id, "music").cover} />
              {d === 0 && (
                <span className="absolute inset-0 grid place-items-center">
                  <PlayButton playing={pl.playing} onClick={pl.toggle} label={m.title} size="lg" tone="glass" />
                </span>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => go(i - 1)} aria-label="Previous track" className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:left-[calc(50%-330px)]">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" onClick={() => go(i + 1)} aria-label="Next track" className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:right-[calc(50%-330px)]">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className={`${OA_WRAP} mt-10`}>
        <div className="mx-auto max-w-[620px] text-center">
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em]">{!f.placeholder && f.title ? f.title : cur.title}</h3>
          <p className="mt-1 text-[14px] text-[#9F9F9F]">
            {cur.genres.join(" · ")} · {cur.bpm} BPM · {cur.use}
          </p>
          {/* 按段落分段的进度条 */}
          <div className="mt-6 flex gap-1.5" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); pl.seek((e.clientX - r.left) / r.width); }}>
            {(() => {
              let start = 0;
              return cur.sections.map(([name, s]) => {
                const a = start / total;
                const b = (start + s) / total;
                start += s;
                const fill = Math.max(0, Math.min(1, (pl.progress - a) / (b - a)));
                return (
                  <div key={name} className="cursor-pointer" style={{ flex: s }}>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full bg-[#FF744D]" style={{ width: `${fill * 100}%` }} />
                    </div>
                    <span className={`mt-2 block text-left text-[11.5px] font-semibold ${pl.progress >= a && pl.progress < b && pl.active ? "text-[#FF744D]" : "text-[#9F9F9F]"}`}>{name}</span>
                  </div>
                );
              });
            })()}
          </div>
          <p className="mt-2 flex justify-between text-[12px] tabular-nums text-[#9F9F9F]">
            <span>{fmt(pl.time)}</span>
            <span>{fmt(pl.duration || cur.length)}</span>
          </p>
          {!f.placeholder && f.text && <p className="mt-3 text-[13.5px] leading-relaxed text-[#CACACA]">{f.text}</p>}
          <div className="mt-7 rounded-[18px] bg-white/[0.05] p-5 text-left ring-1 ring-white/10">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9F9F9F]">Prompt</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#E8E8E8]">{cur.prompt}</p>
            {cur.lyrics && showLyrics && <p className="mt-3 whitespace-pre-line border-l-2 border-white/15 pl-3 text-[13.5px] leading-relaxed text-[#CACACA]">{cur.lyrics}</p>}
            {/* 2026-11-26 Monica:做同款按钮放在 Prompt 块右下角(不放封面上) */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {cur.lyrics && (
                <button type="button" aria-expanded={showLyrics} onClick={() => setShowLyrics((v) => !v)} className="text-[13.5px] font-semibold text-[#CACACA] underline decoration-white/30 underline-offset-4 hover:text-white">
                  {showLyrics ? "Hide lyrics" : "Show lyrics"}
                </button>
              )}
              <button type="button" onClick={() => onUse(cur.prompt, cur.vocals)} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-bold text-[#240A03] transition hover:bg-[#FFE3D9]">
                Use this prompt <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <div role="tablist" className="inline-flex rounded-full bg-white/[0.07] p-1">
            {(["Genres", "Use cases"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition ${tab === t ? "bg-white text-[#240A03]" : "text-[#CACACA] hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {slots.map((m, k) => (
            <button key={m.id} type="button" onClick={() => go(k)} aria-pressed={k === i} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 transition ${k === i ? "bg-white text-[#240A03] ring-white" : "text-[#CACACA] ring-white/15 hover:bg-white/[0.08]"}`}>
              {tab === "Genres" ? m.genres[0] : m.use}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackRow({ slug, m }: { slug: string; m: MusicSlot }) {
  const f = srcOf(slug, m.id, "music");
  const pl = usePlay(`${slug}:${m.id}`, f.src);
  return (
    <div className={`${CARD} flex items-center gap-4 p-3 pr-5`}>
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
        <Cover m={m} cover={f.cover} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{!f.placeholder && f.title ? f.title : m.title}</p>
        <p className="truncate text-[12.5px] text-[#9F9F9F]">
          {m.genres[0]} · {m.bpm} BPM
        </p>
        <Wave seed={m.id} progress={pl.progress} onSeek={pl.seek} bars={40} className="mt-2 h-4" />
      </div>
      <PlayButton playing={pl.playing} onClick={pl.toggle} label={m.title} size="sm" />
    </div>
  );
}

function MusicUses({ slug }: { slug: string }) {
  return (
    <section className={`${SECTION} bg-[#0B0B0B]`}>
      <div className={OA_WRAP}>
        <H2 sub="Ask for the length you need. Short background tracks for ads, a few seconds for a sound logo, longer loops for podcasts and streams.">One sound, every format</H2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {MUSIC_USES.map((u, k) => (
            <UseCard key={u.id} slug={slug} u={u} m={musicOf(slug)[k % musicOf(slug).length]} />
          ))}
        </div>
      </div>
    </section>
  );
}
/* 这三张卡有自己的音频时，封面写用途而不是借来的曲名 */
const USE_LABEL: Record<string, string> = { "use-ad": "Ad music", "use-sting": "Jingle", "use-pod": "Podcast intro" };

function UseCard({ slug, u, m }: { slug: string; u: (typeof MUSIC_USES)[number]; m: MusicSlot }) {
  /* 没有专门剪的版本时，借上面对应曲目的音频 */
  const own = srcOf(slug, u.id, "music");
  const f = own.placeholder ? srcOf(slug, m.id, "music") : own;
  const pl = usePlay(`${slug}:${u.id}`, f.src);
  return (
    <article className={`${CARD} overflow-hidden`}>
      <div className="relative aspect-[16/9]">
        <Cover m={own.placeholder ? m : { ...m, title: USE_LABEL[u.id] ?? m.title }} />
        {/* 没有按这个时长单独生成时放的是整首样例，不标秒数 */}
        {!own.placeholder && <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">{u.length} s</span>}
        <span className="absolute bottom-4 right-4">
          <PlayButton playing={pl.playing} onClick={pl.toggle} label={u.title} tone="glass" />
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-[19px] font-bold">{u.title}</h3>
        <p className="mt-1.5 text-[14.5px] text-[#9F9F9F]">{u.body}</p>
        {!own.placeholder && own.text && <p className="mt-3 text-[13px] leading-relaxed text-[#CACACA]">{own.text}</p>}
        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[#FF744D]" style={{ width: `${pl.progress * 100}%` }} />
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── 音效 ───────────────────────── */

const SFX_ICON: Record<SfxSlot["icon"], LucideIcon> = { whoosh: Wind, bell: Bell, sparkle: Sparkles, trend: TrendingUp, footprints: Footprints, rain: CloudRain, bottle: Wine, users: Users, rocket: Rocket, zap: Zap, keyboard: Keyboard, camera: Camera };

function SfxLanding(p: AudioLandingProps) {
  const [loop, setLoop] = useState(false);
  const [len, setLen] = useState(5);
  const [text, setText] = useState(p.prompt ?? SFX_PROMPTS[0]);
  return (
    <>
      <section className="relative isolate overflow-hidden pb-6 pt-12 md:pt-20">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.15] blur-[120px]" />
        <div className={`${OA_WRAP} text-center`}>
          {p.chip && <div className="mb-6 flex justify-center">{p.chip}</div>}
          <h1 className="mx-auto max-w-[min(1100px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(42px,calc(30px+3.4vw),92px)]">{p.title}</h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[15px] leading-[24px] text-white/75 [text-wrap:pretty]">{p.lead}</p>
          <div className="mx-auto mt-10 max-w-[860px]">
            <OAPromptBox onSubmit={p.cta.onClick}>
              <label htmlFor="sfx-prompt" className="sr-only">
                Describe the sound
              </label>
              <textarea
                id="sfx-prompt"
                rows={2}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  p.onPrompt?.(e.target.value);
                }}
                placeholder="Describe the sound you want…"
                className="w-full resize-none bg-transparent px-1 text-[17px] leading-relaxed text-white placeholder:text-[#9F9F9F] focus:outline-none md:text-[19px]"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" role="switch" aria-checked={loop} onClick={() => setLoop(!loop)} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-[#E8E8E8]">
                  <span className={`relative h-5 w-9 rounded-full transition ${loop ? "bg-[#FF744D]" : "bg-white/20"}`}>
                    <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${loop ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                  <Repeat className="size-3.5" /> Loop
                </button>
                {/* 2026-11-26 Monica:时长不是固定几档，是 1–30 秒任意选 → 滑杆 */}
                <label className="inline-flex items-center gap-3 rounded-full bg-white/[0.07] py-1.5 pl-3.5 pr-3 text-[13px] font-semibold text-[#CACACA]">
                  Length
                  <input type="range" min={1} max={30} step={1} value={len} onChange={(e) => setLen(Number(e.target.value))} aria-label="Length in seconds" className="h-1 w-28 cursor-pointer accent-[#FF744D] sm:w-36" />
                  <span className="w-8 text-right font-bold tabular-nums text-white">{len}s</span>
                </label>
                <span className="ml-auto flex items-center gap-3">
                  {p.price && <span className="text-[13px] font-semibold tabular-nums text-[#CACACA]">{p.price}</span>}
                  <button type="submit" className={OA_CTA}>
                    {p.cta.label} <ArrowUp className="size-4" />
                  </button>
                </span>
              </div>
            </OAPromptBox>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SFX_PROMPTS.map((s) => (
                <button key={s} type="button" onClick={() => setText(s)} className="rounded-full px-3.5 py-1.5 text-[13px] text-[#CACACA] ring-1 ring-white/15 transition hover:bg-white/[0.08] hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="pb-20 pt-14 md:pb-24">
        <div className={OA_WRAP}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {SFX_SLOTS.map((s) => (
              <SfxTile key={s.id} slug={p.slug} s={s} />
            ))}
            <button type="button" onClick={() => document.getElementById("sfx-prompt")?.focus()} className="group flex min-h-[176px] flex-col justify-between rounded-[22px] bg-[#FF744D] p-5 text-left text-[#240A03] transition hover:bg-[#FF8A66]">
              <span className="grid size-11 place-items-center rounded-full bg-[#240A03]/10">
                <Plus className="size-5" />
              </span>
              <span>
                <span className="block text-[12px] font-bold uppercase tracking-[0.06em] opacity-70">Your idea</span>
                <span className="mt-1 block text-[17px] font-extrabold leading-tight">Create your own sound</span>
              </span>
            </button>
          </div>
        </div>
      </section>
      <SfxTimeline slug={p.slug} />
    </>
  );
}

function SfxTile({ slug, s, compact = false }: { slug: string; s: SfxSlot; compact?: boolean }) {
  const f = srcOf(slug, s.id, "sfx");
  const pl = usePlay(`${slug}:${s.id}`, f.src);
  const Icon = SFX_ICON[s.icon];
  return (
    <button
      type="button"
      onClick={pl.toggle}
      aria-pressed={pl.playing}
      aria-label={`${pl.playing ? "Pause" : "Play"} ${s.name}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[22px] p-5 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] ${compact ? "min-h-[140px]" : "min-h-[176px]"} ${
        pl.active ? "bg-[#FF744D]/[0.12] ring-[#FF744D]/50" : "bg-white/[0.05] ring-white/[0.08] hover:bg-white/[0.08]"
      }`}
    >
      <span className="flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-full transition ${pl.active ? "bg-[#FF744D] text-[#240A03]" : "bg-white/[0.08] text-white group-hover:bg-white/[0.14]"}`}>
          {pl.playing ? <Bars on n={4} /> : <Icon className="size-5" />}
        </span>
        <span className="text-[12px] tabular-nums text-[#9F9F9F]">
          {s.loop && <Repeat className="mr-1 inline size-3 align-[-1px]" />}
          {s.length}s
        </span>
      </span>
      {/* 2026-11-26 Monica:「应该有个播放键？」—— 整格本来就能点播，但看不出来;右下角加一个播放 / 暂停键，文字给它让出位置 */}
      <span className="flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#FF9C7F]">{s.category}</span>
          <span className="mt-1 block text-[15.5px] font-bold leading-snug text-white">{!f.placeholder && f.title ? f.title : s.name}</span>
        </span>
        <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-full transition ${pl.playing ? "bg-[#FF744D] text-[#240A03]" : "bg-white text-[#240A03] group-hover:bg-[#FF744D]"}`}>
          {pl.playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
        </span>
      </span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
        <span className="block h-full bg-[#FF744D] transition-[width] duration-200" style={{ width: `${pl.progress * 100}%` }} />
      </span>
    </button>
  );
}

/* 配到视频上：一段画面 + 三个音效点，点哪个播哪个 */
function SfxTimeline({ slug }: { slug: string }) {
  const marks = useMemo(() => [SFX_SLOTS[0], SFX_SLOTS[4], SFX_SLOTS[2]], []);
  return (
    <section className={`${SECTION} bg-[#0B0B0B]`}>
      <div className={OA_WRAP}>
        <H2 sub="Make the whoosh, the pour and the logo sting in one place, then line them up under your clips in Canvas.">Sound for every cut</H2>
        <div className={`${CARD} mx-auto mt-12 max-w-[980px] p-5 md:p-7`}>
          <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-xl">
            {["/prototypes/site/tools/product-ad.jpg", "/prototypes/site/tools/talking-product.jpg", "/prototypes/site/tools/unboxing-ugc.jpg", "/prototypes/site/tools/3d-product-video.jpg"].map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            ))}
          </div>
          {/* 2026-11-26 Monica:「这块设计的都不知道能播？」—— 原来三个小标签看不出能点。改成：每个音效一个带播放键的大按钮，
              对在画面的切点下面(竖线连到切点),轨道左上角写明「点一下试听」 */}
          <div className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-[#CACACA]">
            <AudioLines className="size-4 text-[#FF744D]" /> Sound effects track · tap a sound to hear it
          </div>
          <div className="relative mt-2 h-[72px] rounded-xl bg-black/50 ring-1 ring-white/[0.06]">
            {marks.map((s, k) => (
              <TimelineMark key={s.id} slug={slug} s={s} left={[25, 50, 75][k]} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function TimelineMark({ slug, s, left }: { slug: string; s: SfxSlot; left: number }) {
  const f = srcOf(slug, s.id, "sfx");
  const pl = usePlay(`${slug}:tl-${s.id}`, f.src);
  return (
    <>
      {/* 连到上面画面切点的竖线 */}
      <span aria-hidden className={`absolute -top-[50px] h-[58px] w-[2px] -translate-x-1/2 rounded-full ${pl.playing ? "bg-[#FF744D]" : "bg-white/30"}`} style={{ left: `${left}%` }} />
      <button
        type="button"
        onClick={pl.toggle}
        aria-pressed={pl.playing}
        aria-label={`${pl.playing ? "Pause" : "Play"} ${s.name}`}
        className={`group absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[12.5px] font-bold transition md:pr-4 ${pl.playing ? "bg-[#FF744D] text-[#240A03]" : "bg-white/[0.12] text-white hover:bg-white/[0.2]"}`}
        style={{ left: `${left}%` }}
      >
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${pl.playing ? "bg-[#240A03] text-white" : "bg-white text-[#240A03] group-hover:bg-[#FF744D]"}`}>
          {pl.playing ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 translate-x-px fill-current" />}
        </span>
        <span className="hidden whitespace-nowrap sm:inline">{s.category}</span>
        <span className="hidden text-[11.5px] font-semibold tabular-nums opacity-70 md:inline">{s.length}s</span>
      </button>
    </>
  );
}
