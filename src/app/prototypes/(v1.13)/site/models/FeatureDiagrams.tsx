"use client";

/* 落地页功能示意图。
   2026-11-26 第一版(SVG 卡通瓶子 + 小人)被 Monica 否了:「意思有表达到，但是 UI、样式有点丑啊！现代设计风，你现在这样跟落地页有不匹配了」。
   她在三个方向里选了 A「真实画面 + 玻璃界面」:画面主角是真实广告镜头，外面套一层很薄的玻璃质感界面(时间轴、参考图格子、勾选)。
   配图是专门为示意图生成的一套虚构品牌 LUMEA 精华的广告图(GPT Image 2.5 Sunburst,工程在 ~/Desktop/官网素材工程/14-示意图配图/),
   所有模型页共用这一套;同一页里每张图只出现一次(每张示意图用自己的那几张，互不重叠)。
   字号用容器单位(cqw),卡片多宽字就跟着多大。文字只放在画面空白处，不压产品和人脸。 */

import type { ReactNode } from "react";
import { AudioLines, Check, Download, Film, Image as ImageIcon, Play, VolumeX } from "lucide-react";
import type { ModelEntry } from "../../site-nav/models-catalog";
import type { ModelFacts } from "./model-facts";

export type DiagramKind =
  | "duration"
  | "refs"
  | "res"
  | "quality"
  | "sound"
  | "longTake"
  | "consistent"
  | "bigScreen"
  | "soundBuilt"
  | "soundEditor"
  | "drafts"
  | "placements"
  | "ownRefs"
  | "agent"
  | "text"
  | "cutout"
  | "alpha"
  | "compose"
  | "variations"
  | "print"
  | "result";

/** Key features 的 key / Best uses 的标题 → 对应的示意图(音频模型返回 undefined,继续用能播放的声波卡) */
export function diagramFor(keyOrTitle: string, m: ModelEntry, f?: ModelFacts): DiagramKind | undefined {
  if (m.type === "audio") return undefined;
  const quality = /Low|Medium|High/i.test((f?.resolutions ?? []).join());
  const map: Record<string, DiagramKind> = {
    duration: "duration",
    refs: "refs",
    transparent: "alpha",
    res: quality ? "quality" : "res",
    sound: "sound",
    "Long single takes": "longTake",
    "Consistent products and characters": "consistent",
    "Big-screen hero shots": "bigScreen",
    "Clips with sound built in": "soundBuilt",
    "Sound on or off": "soundEditor",
    "Fast, cheap drafts": "drafts",
    "Ads and social videos": "placements",
    "Ads and product visuals": "placements",
    "Work from your own references": "ownRefs",
    "Inside the Marketing Agent": "agent",
    "Ads with readable text": "text",
    "Product shots that stay on model": "ownRefs",
    "Cutouts and transparent assets": "cutout",
    "Logos, stickers and design elements": "compose",
    "Every placement from one prompt": "placements",
    "High-volume variations": "variations",
    "Detail for print and hero visuals": "print",
  };
  return map[keyOrTitle] ?? "result";
}

/* ── 基础件 ── */
const IMG = (n: string) => `/prototypes/site/diagrams/${n}.webp`;
const fmtRes = (r: string) => r.replace(/^(\d+)P$/, "$1p");

/** 一张真实画面。pos = object-position,zoom 用来模拟推镜头 / 放大看细节 */
function Shot({ n, className = "", pos = "50% 50%", blur, zoom = 1, alt = "", ratio }: { n: string; className?: string; pos?: string; blur?: number; zoom?: number; alt?: string; ratio?: string }) {
  return (
    <div style={ratio ? { aspectRatio: ratio } : undefined} className={`${/\babsolute\b/.test(className) ? "" : "relative "}overflow-hidden ${className}`}>
      <img
        src={IMG(n)}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: pos, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: pos, filter: blur ? `blur(${blur}cqw)` : undefined }}
      />
    </div>
  );
}

/** 玻璃面板 */
const glass = "border border-white/15 bg-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl";

function Pill({ children, solid, light, className = "" }: { children: ReactNode; solid?: boolean; light?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.6cqw] whitespace-nowrap rounded-full px-[2cqw] py-[0.95cqw] text-[2.36cqw] font-bold leading-none ${
        solid ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white" : light ? "bg-white text-[#240A03]" : `${glass} text-white`
      } ${className}`}
    >
      {children}
    </span>
  );
}

function Tick({ className = "" }: { className?: string }) {
  return (
    <span className={`grid size-[4.16cqw] place-items-center rounded-full bg-[#FF744D] text-[#240A03] shadow-[0_0_0_0.5cqw_rgba(255,116,77,0.25)] ${className}`}>
      <Check className="size-[2.6cqw]" strokeWidth={3.5} />
    </span>
  );
}

function Bars({ n = 40, seed = 1, className = "", color = "bg-[#FF744D]" }: { n?: number; seed?: number; className?: string; color?: string }) {
  return (
    <span className={`flex items-center gap-[0.3cqw] ${className}`}>
      {Array.from({ length: n }).map((_, i) => {
        const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 * seed + seed) * Math.cos(i * 0.37 + seed * 2));
        return <span key={i} className={`flex-1 rounded-full ${color}`} style={{ height: `${Math.round(v * 100)}%` }} />;
      })}
    </span>
  );
}

/** 外框：16:9,深色底 + 左上角一点橙光;container-type 让里面的 cqw 跟着卡片宽度走 */
function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="relative size-full overflow-hidden bg-[#0E0E0E] text-white [container-type:inline-size]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_0%,rgba(255,116,77,0.28),transparent_60%)]" />
      {children}
    </div>
  );
}

const cap = "text-[2.16cqw] font-bold uppercase tracking-[0.12em] text-white/60";
const link = "h-[0.3cqw] bg-gradient-to-r from-white/10 to-[#FF744D]";

/* ── 各主题 ── */
export function FeatureDiagram({ kind, m, f }: { kind: DiagramKind; m: ModelEntry; f?: ModelFacts; from?: number }) {
  const res = f?.resolutions ?? [];
  const top = res.length ? fmtRes(res[res.length - 1]) : "HD";
  const low = res.length ? fmtRes(res[0]) : "Draft";
  const [lo, hi] = f?.durations ?? [4, 15];
  const refs = f?.refs ?? {};

  switch (kind) {
    /* 一条连续镜头：同一个画面切成 4 格当胶片，下面一条时间轴标出钩子 / 产品亮相 / 台词 */
    case "duration":
      return (
        <Frame label={`One continuous ${hi}-second shot`}>
          <div className="absolute inset-x-[6%] top-[11%] flex h-[50%] gap-[0.5cqw] overflow-hidden rounded-[2.2cqw] outline outline-[0.35cqw] outline-offset-[0.6cqw] outline-[#FF744D]">
            {["0%", "33%", "66%", "100%"].map((p, i) => (
              <Shot key={p} n="dur-wide" pos={`${p} 50%`} zoom={1 + i * 0.06} className="flex-1" />
            ))}
          </div>
          <Pill light className="absolute right-[7.5%] top-[5%]">{hi} s · one take</Pill>
          <div className={`absolute inset-x-[6%] bottom-[8%] rounded-[2cqw] px-[2.4cqw] py-[2cqw] ${glass}`}>
            <div className="grid grid-cols-3 gap-[1cqw] text-[2.43cqw] font-bold">
              {["Hook", "Product reveal", "Line of dialogue"].map((t) => (
                <span key={t} className="border-t-[0.45cqw] border-[#FF744D] pt-[1cqw]">{t}</span>
              ))}
            </div>
            <div className="mt-[1.6cqw] flex items-center gap-[1.4cqw] text-[2.16cqw] font-semibold text-white/70">
              <span>Draft at {lo} s</span>
              <span className="relative h-[0.7cqw] flex-1 rounded-full bg-white/15">
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
                <span className="absolute -right-[0.4cqw] top-1/2 size-[3.12cqw] -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_0.6cqw_rgba(255,116,77,0.35)]" />
              </span>
              <span className="text-white">Final at {hi} s</span>
            </div>
          </div>
        </Frame>
      );

    /* 参考图：产品 / 人脸 / 风格(+动作视频、音频)→ 模型 → 每条成片同一支瓶子、同一个人 */
    case "refs":
      return (
        <Frame label={`${refs.images} reference images keep one consistent look`}>
          <div className={`absolute left-[5%] top-1/2 w-[35%] -translate-y-1/2 rounded-[2.4cqw] p-[2cqw] ${glass}`}>
            <div className={cap}>Up to {refs.images} images</div>
            <div className="mt-[1.4cqw] grid grid-cols-3 gap-[1cqw]">
              {[
                ["ref-product", "Product"],
                ["face", "Face"],
                ["ref-style", "Style"],
              ].map(([n, t]) => (
                <div key={n}>
                  <Shot n={n} className="aspect-square rounded-[1.4cqw]" />
                  <div className="mt-[0.7cqw] text-[2.16cqw] font-semibold text-white/80">{t}</div>
                </div>
              ))}
            </div>
            {(refs.videos || refs.audios) && (
              <div className="mt-[1.4cqw] flex flex-wrap gap-[0.8cqw]">
                {refs.videos ? <Pill><Film className="size-[2.47cqw] text-[#FF744D]" /> {refs.videos} motion refs</Pill> : null}
                {refs.audios ? <Pill><AudioLines className="size-[2.47cqw] text-[#FF744D]" /> {refs.audios} audio clips</Pill> : null}
              </div>
            )}
          </div>
          <div className="absolute left-[41.5%] top-1/2 flex w-[18%] -translate-y-1/2 flex-col items-center gap-[1.2cqw]">
            <span className={`w-full rounded-full ${link}`} />
            <Pill light>{m.name}</Pill>
          </div>
          <div className="absolute bottom-[7%] right-[5%] top-[7%] grid w-[34%] grid-rows-3 gap-[1.2cqw]">
            {["ref-out-1", "ref-out-2", "ref-out-3"].map((n) => (
              <div key={n} className="relative">
                <Shot n={n} className="size-full rounded-[1.6cqw]" />
                <Tick className="absolute right-[1cqw] top-[1cqw]" />
              </div>
            ))}
          </div>
        </Frame>
      );

    /* 低分辨率试 → 最高分辨率出片：同一张图左糊右清，放大镜看瓶身字 */
    case "res": {
      /* 2026-11-27 审图：图片模型页这张图下面也写着 TikTok / Reels / Shorts · 1080p(竖视频规格),对图片模型不成立 → 只有视频模型显示 */
      const social = m.type === "video" && /1080|2K|4K/i.test(top);
      return (
        <Frame label={`Draft at ${low}, finish at ${top}`}>
          {[0, 1].map((k) => (
            <div key={k} className={`absolute top-[7%] h-[58%] w-[42%] ${k ? "right-[5%]" : "left-[5%]"}`}>
              <Shot n="res-macro" blur={k ? 0 : 0.5} className="size-full rounded-[2cqw]" />
              <Pill solid={!!k} className="absolute left-[3%] top-[5%]">{k ? `${top} · Final` : `${low} · Draft`}</Pill>
              {/* 放大镜：放大瓶身标签，放在画面左下的空白处 */}
              <div className="absolute bottom-[6%] left-[5%] size-[12cqw] overflow-hidden rounded-full border-[0.4cqw] border-white shadow-[0_1cqw_3cqw_rgba(0,0,0,0.5)]">
                <Shot n="res-macro" pos="70% 55%" zoom={3} blur={k ? 0 : 0.35} className="size-full" />
              </div>
              <div className="absolute left-0 top-[106%] text-[2.56cqw] font-bold">{k ? "Render the keeper" : "Fewer credits"}</div>
              <div className="absolute left-0 top-[118%] text-[2.09cqw] text-white/60">{k ? "Fine detail on the label holds up" : "Test the prompt, motion and framing"}</div>
            </div>
          ))}
          <span className={`absolute left-1/2 top-[36%] w-[6%] -translate-x-1/2 ${link}`} />
          {social && (
            <div className="absolute bottom-[5%] right-[5%] flex gap-[0.8cqw]">
              {["TikTok", "Reels", "Shorts"].map((p) => <Pill key={p}>{p} · 1080p</Pill>)}
            </div>
          )}
        </Frame>
      );
    }

    /* 图片模型的质量档：同一张图从低到高越来越清楚 */
    case "quality": {
      const levels = res.slice(0, 3);
      return (
        <Frame label={`${res.length} quality levels`}>
          <div className="absolute inset-x-[5%] top-[8%] grid h-[68%] gap-[1.6cqw]" style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
            {levels.map((l, i) => (
              <div key={l} className="relative">
                <Shot n="res-macro" pos="72% 50%" blur={(levels.length - 1 - i) * 0.35} className="size-full rounded-[1.8cqw]" />
                <Pill solid={i === levels.length - 1} className="absolute left-[5%] top-[4%]">{l}</Pill>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-[5%] bottom-[8%] grid text-[2.29cqw] font-semibold text-white/70" style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
            {levels.map((l, i) => <span key={l}>{i === 0 ? "Explore ideas" : i === levels.length - 1 ? "Publish this one" : "Refine"}</span>)}
          </div>
        </Frame>
      );
    }

    /* 原生声音开 / 关：上面一条画面，下面玻璃面板两种用法 */
    case "sound": {
      const canOff = !!f?.soundOff;
      return (
        <Frame label={canOff ? "Native audio, on or off" : "Sound generated with the picture"}>
          <div className="absolute inset-x-[5%] top-[7%] flex h-[34%] gap-[0.5cqw] overflow-hidden rounded-[1.8cqw]">
            {["0%", "25%", "50%", "75%", "100%"].map((p) => <Shot key={p} n="sound-beach" pos={`${p} 50%`} className="flex-1" />)}
          </div>
          <div className={`absolute inset-x-[5%] bottom-[7%] top-[47%] rounded-[2cqw] p-[2cqw] ${glass}`}>
            {canOff ? (
              <div className="grid h-full grid-rows-2 gap-[1.4cqw]">
                <div className="flex items-center gap-[1.6cqw]">
                  <Toggle on /><span className="w-[14cqw] shrink-0 text-[2.56cqw] font-bold">Audio on</span>
                  <Bars n={46} seed={1.3} className="h-[4.4cqw] flex-1" />
                </div>
                <div className="flex items-center gap-[1.6cqw]">
                  <Toggle /><span className="w-[14cqw] shrink-0 text-[2.56cqw] font-bold">Audio off</span>
                  <span className="flex flex-1 gap-[1cqw]">
                    <span className="flex-[3] rounded-[1cqw] border border-[#FF744D] bg-[#FF744D]/20 px-[1.4cqw] py-[1cqw] text-[2.16cqw] font-semibold">Your voiceover</span>
                    <span className="flex-[2] rounded-[1cqw] border border-white/25 bg-white/10 px-[1.4cqw] py-[1cqw] text-[2.16cqw] font-semibold text-white/80">Licensed music</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid h-full grid-rows-3 gap-[1cqw]">
                {[
                  ["Dialogue", 1, "bg-[#FF744D]"],
                  ["Ambience", 3, "bg-[#FFB089]"],
                  ["Effects", 5, "bg-[#FFD3BF]"],
                ].map(([t, s, c]) => (
                  <div key={t as string} className="flex items-center gap-[1.6cqw]">
                    <span className="w-[13cqw] shrink-0 text-[2.43cqw] font-bold">{t as string}</span>
                    <Bars n={50} seed={s as number} color={c as string} className="h-full flex-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Frame>
      );
    }

    /* 用途「Clips with sound built in」:竖屏口播一条，右边三种声音 */
    case "soundBuilt":
      return (
        <Frame label="Clips that come out with sound">
          <div className="absolute bottom-[6%] left-[7%] top-[6%] aspect-[9/16]">
            <Shot n="sound-talk" pos="50% 30%" className="size-full rounded-[2.4cqw]" />
            <div className={`absolute inset-x-[6%] bottom-[5%] rounded-[1.4cqw] px-[1.4cqw] py-[1.2cqw] ${glass}`}>
              <Bars n={22} seed={1.7} color="bg-white" className="h-[3.4cqw]" />
            </div>
          </div>
          <div className="absolute left-[44%] right-[6%] top-1/2 -translate-y-1/2 space-y-[2.4cqw]">
            <div className={cap}>Comes out with sound</div>
            {[
              ["Dialogue", "Lips match the words"],
              ["Ambience", "The room or street around them"],
              ["Effects", "Pours, clicks and footsteps on cue"],
            ].map(([t, s]) => (
              <div key={t} className="flex items-start gap-[1.6cqw]">
                <Tick className="mt-[0.3cqw] shrink-0" />
                <div>
                  <div className="text-[3.1cqw] font-bold leading-tight">{t}</div>
                  <div className="text-[2.29cqw] text-white/60">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </Frame>
      );

    /* 用途「Sound on or off」:关掉原生声音导出无声片 → 剪辑里铺自己的配音和音乐 */
    case "soundEditor":
      return (
        <Frame label="Export a silent clip and add your own audio">
          <div className="absolute left-[5%] top-[10%] h-[58%] w-[40%]">
            <Shot n="sound-silent" className="size-full rounded-[2cqw]" />
            <span className={`absolute right-[4%] top-[5%] grid size-[5.98cqw] place-items-center rounded-full ${glass}`}><VolumeX className="size-[3.12cqw]" /></span>
            <div className="absolute left-0 top-[106%] text-[2.56cqw] font-bold">Silent clip from {m.name}</div>
            <div className="absolute left-0 top-[120%] text-[2.09cqw] text-white/60">Native audio switched off</div>
          </div>
          <div className={`absolute bottom-[8%] right-[5%] top-[8%] w-[46%] rounded-[2.2cqw] p-[2.2cqw] ${glass}`}>
            <div className={cap}>Your editor</div>
            <div className="mt-[2cqw] space-y-[1.6cqw]">
              <Lane label="Video"><span className="flex h-full gap-[0.4cqw]">{["0%", "33%", "66%", "100%"].map((p) => <Shot key={p} n="sound-silent" pos={`${p} 50%`} className="flex-1 rounded-[0.6cqw]" />)}</span></Lane>
              <Lane label="Voiceover"><span className="flex h-full items-center rounded-[0.8cqw] border border-[#FF744D] bg-[#FF744D]/20 px-[1cqw]"><Bars n={26} seed={2.2} className="h-[70%] flex-1" /></span></Lane>
              <Lane label="Music"><span className="flex h-full items-center rounded-[0.8cqw] border border-white/25 bg-white/10 px-[1cqw]"><Bars n={26} seed={3.7} color="bg-[#FFD3BF]" className="h-[70%] flex-1" /></span></Lane>
              <Lane label="Brand sting"><span className="flex h-full justify-end"><span className="flex h-full w-[30%] items-center rounded-[0.8cqw] border border-white/25 bg-white/10 px-[1cqw]"><Bars n={8} seed={1.1} color="bg-[#FFD3BF]" className="h-[70%] flex-1" /></span></span></Lane>
            </div>
          </div>
        </Frame>
      );

    /* 长镜头：竖屏 UGC 口播 + 一条不断的时间线 */
    case "longTake":
      return (
        <Frame label={`One continuous take up to ${hi} seconds`}>
          <div className="absolute bottom-[6%] left-[7%] top-[6%] aspect-[9/16]">
            <Shot n="long-ugc" pos="50% 35%" className="size-full rounded-[2.4cqw]" />
            <Pill className="absolute left-[6%] top-[4%]"><Play className="size-[2.08cqw] fill-current" /> {hi} s</Pill>
          </div>
          <div className="absolute left-[42%] right-[6%] top-[14%]">
            <div className={cap}>One take · no cuts</div>
            <div className="mt-[1.6cqw] flex h-[7cqw] gap-[0.5cqw] rounded-[1.6cqw] p-[0.5cqw] outline outline-[0.3cqw] outline-[#FF744D]">
              {([["Intro", 1], ["Demo", 2.4], ["Call to action", 1.3]] as [string, number][]).map(([t, w]) => (
                <span key={t} className={`flex items-center rounded-[1.1cqw] px-[1.2cqw] text-[2.29cqw] font-bold ${t === "Demo" ? "bg-[#FF744D]/30" : "bg-white/10"}`} style={{ flex: w }}>{t}</span>
              ))}
            </div>
            <div className="mt-[0.8cqw] flex justify-between text-[2.03cqw] font-semibold text-white/60"><span>0 s</span><span>{hi} s</span></div>
            <div className="mt-[3cqw] space-y-[1.8cqw]">
              {["Same face from start to end", "Same voice, same product", lo < hi ? `Short hooks from ${lo} s too` : "One continuous shot"].map((t) => (
                <div key={t} className="flex items-center gap-[1.4cqw] text-[2.7cqw] font-semibold"><Tick className="shrink-0" />{t}</div>
              ))}
            </div>
          </div>
        </Frame>
      );

    /* 一致性：一套广告的 4 个镜头，同一支瓶子、同一个人 */
    case "consistent":
      return (
        <Frame label="Same product and character in every shot">
          <div className="absolute inset-x-[5%] top-[8%] grid h-[66%] grid-cols-4 gap-[1.4cqw]">
            {[
              ["cons-wide", "Wide"],
              ["cons-close", "Close-up"],
              ["cons-hand", "In hand"],
              ["cons-life", "Lifestyle"],
            ].map(([n, t], i) => (
              <div key={n} className="relative">
                <Shot n={n} className="size-full rounded-[1.8cqw]" />
                <Pill className="absolute bottom-[4%] left-[5%]">{i + 1} · {t}</Pill>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-[5%] bottom-[8%] flex justify-center gap-[1.2cqw]">
            {["Same bottle", "Same label", "Same face"].map((t) => <Pill key={t}><Check className="size-[2.34cqw] text-[#FF744D]" strokeWidth={3} />{t}</Pill>)}
          </div>
        </Frame>
      );

    /* 大屏：同一套片子放在官网头图、播放器、电视上 */
    case "bigScreen":
      return (
        <Frame label={`Hero shots at ${top}`}>
          <div className={`absolute left-[5%] top-[8%] w-[54%] rounded-[2cqw] p-[1cqw] ${glass}`}>
            <div className="flex gap-[0.7cqw] px-[0.6cqw] pb-[0.8cqw]">{[0, 1, 2].map((i) => <span key={i} className="size-[1.3cqw] rounded-full bg-white/30" />)}</div>
            <div className="relative aspect-[16/9]">
              <Shot n="big-hero" className="size-full rounded-[1.2cqw]" />
              <div className="absolute left-[6%] top-1/2 -translate-y-1/2 text-[#240A03]">
                <div className="text-[4.86cqw] font-extrabold leading-none tracking-[-0.03em]">Glow, bottled.</div>
                <span className="mt-[1.4cqw] inline-block rounded-full bg-[#240A03] px-[1.6cqw] py-[0.8cqw] text-[2.03cqw] font-bold text-white">Shop now</span>
              </div>
            </div>
            <div className="px-[0.6cqw] pt-[1cqw] text-[2.16cqw] font-semibold text-white/80">Landing page header</div>
          </div>
          <div className="absolute right-[5%] top-[8%] w-[34%]">
            <div className="relative aspect-video">
              <Shot n="big-player" className="size-full rounded-[1.6cqw]" />
              <span className="absolute inset-x-[5%] bottom-[7%] h-[0.5cqw] rounded-full bg-white/30"><span className="block h-full w-[40%] rounded-full bg-[#FF744D]" /></span>
            </div>
            <div className="mt-[0.8cqw] text-[2.16cqw] font-semibold text-white/80">Video platforms</div>
          </div>
          <div className="absolute bottom-[8%] right-[5%] w-[34%]">
            <div className="rounded-[1.2cqw] border-[0.5cqw] border-[#1d1d1d] bg-black shadow-[0_1cqw_3cqw_rgba(0,0,0,0.5)]">
              <Shot n="big-tv" className="aspect-video rounded-[0.6cqw]" />
            </div>
            <div className="mt-[0.8cqw] text-[2.16cqw] font-semibold text-white/80">Connected TV</div>
          </div>
          <Pill solid className="absolute bottom-[9%] left-[5%]">Final render at {top}</Pill>
        </Frame>
      );

    /* 便宜试稿：三个开头试过，挑中的那个放大成正片 */
    case "drafts":
      return (
        <Frame label="Test several drafts, then finish the winner">
          <div className="absolute bottom-[8%] left-[5%] top-[8%] grid w-[40%] grid-cols-2 grid-rows-2 gap-[1.2cqw]">
            {["draft-1", "draft-2", "draft-3"].map((n, i) => (
              <div key={n} className="relative opacity-70">
                <Shot n={n} className="size-full rounded-[1.4cqw]" />
                <Pill className="absolute bottom-[5%] left-[5%]">Hook {"ABC"[i]}</Pill>
              </div>
            ))}
            <div className="grid place-items-center rounded-[1.4cqw] border-[0.3cqw] border-[#FF744D] bg-[#FF744D]/10 text-center text-[2.29cqw] font-bold text-[#FFD7C9]">Hook D<br />picked</div>
          </div>
          <span className={`absolute left-[48%] top-1/2 w-[5%] ${link}`} />
          <div className="absolute bottom-[8%] right-[5%] top-[8%] w-[40%]">
            <Shot n="draft-4" className="size-full rounded-[2cqw] ring-[0.4cqw] ring-[#FF744D]" />
            <Pill solid className="absolute left-[4%] top-[4%]">Final version</Pill>
            <Tick className="absolute right-[4%] top-[4%]" />
          </div>
        </Frame>
      );

    /* 投放位：同一个创意裁成各种比例。按比例真实尺寸拼成一块(卡片高 = 56.25cqw),比例名做成角标放在画面里 */
    case "placements": {
      const ratios = (f?.ratios ?? []).filter((r) => /^\d+:\d+$/.test(r));
      const has = (r: string) => !ratios.length || ratios.includes(r);
      const slots: { r: string; name: string; l: number; t: number; w: number; h: number }[] = [
        { r: "9:16", name: "Stories & Reels", l: 5, t: 5, w: 25.9, h: 46 },
        { r: "4:5", name: "Feed post", l: 33, t: 5, w: 19.2, h: 24 },
        { r: "1:1", name: "Square post", l: 33, t: 31.5, w: 19.5, h: 19.5 },
        { r: "16:9", name: "YouTube & web", l: 55.5, t: 5, w: 39.5, h: 22.2 },
      ];
      return (
        <Frame label="One concept in every placement">
          {slots.filter((x) => has(x.r)).map((x) => (
            <div key={x.r} className="absolute" style={{ left: `${x.l}cqw`, top: `${x.t}cqw`, width: `${x.w}cqw`, height: `${x.h}cqw` }}>
              <Shot n="place" pos="50% 38%" className="size-full rounded-[1.6cqw]" />
              <Pill className="absolute left-[1.2cqw] top-[1.2cqw]"><b>{x.r}</b><span className="font-semibold text-white/75">{x.name}</span></Pill>
            </div>
          ))}
          <div className="absolute" style={{ left: "55.5cqw", top: "31.5cqw" }}>
            <div className={cap}>One prompt</div>
            <div className="mt-[0.8cqw] text-[3.4cqw] font-extrabold leading-tight tracking-[-0.02em]">Every placement,<br />same look</div>
          </div>
        </Frame>
      );
    }

    /* 用你自己的产品照：随手拍的一张 → 换成精修场景 */
    case "ownRefs":
      return (
        <Frame label="Your product photo placed in new scenes">
          <div className="absolute left-[5%] top-1/2 w-[24%] -translate-y-1/2 rotate-[-4deg] rounded-[1.2cqw] bg-white p-[1cqw] pb-[3.6cqw] shadow-[0_1.4cqw_3cqw_rgba(0,0,0,0.5)]">
            <Shot n="own-photo" className="aspect-square rounded-[0.6cqw]" />
            <div className="absolute bottom-[1.1cqw] left-[1.2cqw] text-[2.03cqw] font-bold text-[#240A03]">Your product photo</div>
          </div>
          <span className={`absolute left-[32%] top-1/2 w-[5%] ${link}`} />
          <Shot n="own-out-1" className="absolute bottom-[20%] left-[39%] top-[8%] w-[34%] rounded-[2cqw]" />
          <Shot n="own-out-2" className="absolute right-[5%] top-[8%] h-[34%] w-[19%] rounded-[1.6cqw]" />
          <Shot n="own-out-3" className="absolute bottom-[20%] right-[5%] h-[34%] w-[19%] rounded-[1.6cqw]" />
          <div className="absolute bottom-[5%] left-[39%] right-[5%] flex justify-between">
            {["Same shape", "Same color", "Same label"].map((t) => <Pill key={t}><Check className="size-[2.34cqw] text-[#FF744D]" strokeWidth={3} />{t}</Pill>)}
          </div>
        </Frame>
      );

    /* Marketing Agent:方案里的一步就是这个模型 */
    case "agent": {
      const steps: [string, string][] = [
        ["Product shots", m.type === "image" ? m.name : "Image model"],
        ["Hero video", m.type === "video" ? m.name : "Video model"],
        ["Voiceover and music", "Audio model"],
      ];
      return (
        <Frame label={`${m.name} as one step of a Marketing Agent plan`}>
          <div className={`absolute inset-x-[14%] inset-y-[9%] rounded-[2.4cqw] p-[2.6cqw] ${glass}`}>
            <div className={cap}>Campaign plan</div>
            <div className="mt-[0.6cqw] text-[4.05cqw] font-extrabold tracking-[-0.02em]">LUMEA serum launch</div>
            <div className="mt-[2cqw] space-y-[1.2cqw]">
              {steps.map(([t, model], i) => {
                const me = model === m.name;
                return (
                  <div key={t} className={`flex items-center gap-[1.6cqw] rounded-[1.4cqw] border px-[1.8cqw] py-[1.4cqw] ${me ? "border-[#FF744D] bg-[#FF744D]/15" : "border-white/10 bg-white/[0.04]"}`}>
                    <span className={`grid size-[4.42cqw] place-items-center rounded-full text-[2.16cqw] font-extrabold ${me ? "bg-[#FF744D] text-[#240A03]" : "bg-white/10"}`}>{i + 1}</span>
                    <span className="text-[2.7cqw] font-bold">{t}</span>
                    <span className="ml-auto text-[2.16cqw] font-semibold text-white/70">{model}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Frame>
      );
    }

    /* 图上文字：提示词里加引号 → 海报上一字不差 */
    case "text":
      return (
        <Frame label="Text rendered exactly as typed">
          <div className={`absolute left-[5%] top-1/2 w-[42%] -translate-y-1/2 rounded-[2.2cqw] p-[2.4cqw] ${glass}`}>
            <div className={cap}>Prompt</div>
            <p className="mt-[1.2cqw] text-[2.7cqw] leading-[1.5] text-white/80">
              Summer sale poster for the serum. Headline <span className="rounded-[0.6cqw] bg-[#FF744D]/25 px-[0.6cqw] font-bold text-white">“SUMMER GLOW”</span>, tag <span className="rounded-[0.6cqw] bg-[#FF744D]/25 px-[0.6cqw] font-bold text-white">“30% OFF”</span>
            </p>
          </div>
          <span className={`absolute left-[50%] top-1/2 w-[5%] ${link}`} />
          <div className="absolute bottom-[7%] right-[6%] top-[7%] aspect-[4/5]">
            <Shot n="text-poster" className="size-full rounded-[2cqw]" />
            <Pill light className="absolute -left-[6%] bottom-[6%]"><Check className="size-[2.34cqw] text-[#FF744D]" strokeWidth={3} />Spelled as typed</Pill>
          </div>
        </Frame>
      );

    /* 透明底：抠好的瓶子直接放到电商卡片、贴纸、深色横幅上 */
    case "cutout":
      return (
        <Frame label="Transparent background, ready to place anywhere">
          <div className="absolute bottom-[8%] left-[5%] top-[8%] w-[34%] overflow-hidden rounded-[2cqw] bg-[conic-gradient(#e6e6e6_25%,#fafafa_0_50%,#e6e6e6_0_75%,#fafafa_0)] bg-[length:3cqw_3cqw]">
            <img src={IMG("cutout")} alt="" loading="lazy" className="absolute inset-[8%] size-[84%] object-contain" />
            <span className="absolute left-[5%] top-[4%] rounded-full bg-[#240A03] px-[1.4cqw] py-[0.7cqw] text-[2.03cqw] font-bold">PNG · transparent</span>
          </div>
          <span className={`absolute left-[41%] top-1/2 w-[5%] ${link}`} />
          <div className="absolute right-[5%] top-[8%] flex h-[46%] w-[46%] gap-[1.4cqw]">
            <div className="flex-1 rounded-[1.6cqw] bg-white p-[1.2cqw] text-[#240A03]">
              <img src={IMG("cutout")} alt="" loading="lazy" className="h-[66%] w-full object-contain" />
              <div className="mt-[0.8cqw] h-[1cqw] w-[70%] rounded-full bg-black/10" />
              <div className="mt-[0.6cqw] text-[2.16cqw] font-extrabold">$29.00</div>
            </div>
            <div className="grid aspect-square h-full place-items-center rounded-full bg-[#FFE1CC]">
              <img src={IMG("cutout")} alt="" loading="lazy" className="h-[70%] object-contain" />
            </div>
          </div>
          <div className="absolute bottom-[8%] right-[5%] flex h-[30%] w-[46%] items-center justify-between overflow-hidden rounded-[1.6cqw] bg-gradient-to-r from-[#2A1410] to-[#5a2418] pl-[2.4cqw]">
            <span className="text-[3cqw] font-extrabold leading-tight tracking-[-0.02em]">New<br />LUMEA serum</span>
            <img src={IMG("cutout")} alt="" loading="lazy" className="h-[120%] translate-y-[8%] object-contain" />
          </div>
        </Frame>
      );

    /* 透明 PNG(功能段):半透明玻璃瓶放在棋盘格上 → 同一张直接叠到深色和浅色背景上，玻璃透出背景色、边缘没有白边 */
    case "alpha":
      return (
        <Frame label="A transparent PNG with a real alpha channel">
          <div className="absolute bottom-[8%] left-[5%] top-[8%] w-[40%] overflow-hidden rounded-[2cqw] bg-[conic-gradient(#e6e6e6_25%,#fafafa_0_50%,#e6e6e6_0_75%,#fafafa_0)] bg-[length:3cqw_3cqw]">
            <img src={IMG("el-perfume")} alt="" loading="lazy" className="absolute inset-[6%] size-[88%] object-contain" />
            <span className="absolute left-[5%] top-[4%] rounded-full bg-[#240A03] px-[1.8cqw] py-[0.9cqw] text-[2.03cqw] font-bold">PNG · alpha channel</span>
          </div>
          <span className={`absolute left-[47%] top-1/2 w-[5%] ${link}`} />
          <div className="absolute right-[5%] top-[8%] flex h-[56%] w-[42%] gap-[1.4cqw]">
            <div className="relative flex-1 overflow-hidden rounded-[1.6cqw] bg-gradient-to-b from-[#1b2a4a] to-[#0d1424]">
              <img src={IMG("el-perfume")} alt="" loading="lazy" className="absolute inset-[6%] size-[88%] object-contain" />
            </div>
            <div className="relative flex-1 overflow-hidden rounded-[1.6cqw] bg-gradient-to-b from-[#FFD9C2] to-[#FF9A6B]">
              <img src={IMG("el-perfume")} alt="" loading="lazy" className="absolute inset-[6%] size-[88%] object-contain" />
            </div>
          </div>
          <div className="absolute bottom-[8%] right-[5%] w-[42%] space-y-[1.2cqw]">
            {["See-through glass keeps the backdrop color", "No white halo, no cutout step"].map((t) => (
              <div key={t} className="flex items-center gap-[1.4cqw] text-[2.2cqw] font-semibold"><Tick className="shrink-0" />{t}</div>
            ))}
          </div>
        </Frame>
      );

    /* 设计元素拼合(用途段):Logo、贴纸、产品抠图、装饰各是一张透明 PNG → 拼到一张空背景上就是一张广告 */
    case "compose":
      return (
        <Frame label="Separate transparent elements combined into one ad">
          <div className="absolute bottom-[8%] left-[5%] top-[8%] grid w-[26%] grid-cols-2 grid-rows-2 gap-[1.2cqw]">
            {[["el-logo", "Logo"], ["el-badge", "Sticker"], ["cutout", "Product"], ["el-citrus", "Element"]].map(([n, t]) => (
              <div key={n} className="relative overflow-hidden rounded-[1.4cqw] bg-[conic-gradient(#e6e6e6_25%,#fafafa_0_50%,#e6e6e6_0_75%,#fafafa_0)] bg-[length:2cqw_2cqw]">
                <img src={IMG(n)} alt="" loading="lazy" className="absolute inset-[10%] size-[80%] object-contain" />
                <span className="absolute bottom-[5%] left-[6%] rounded-full bg-[#240A03]/85 px-[1cqw] py-[0.4cqw] text-[1.5cqw] font-bold">{t}</span>
              </div>
            ))}
          </div>
          <span className={`absolute left-[33.5%] top-1/2 w-[5%] ${link}`} />
          <div className="absolute bottom-[8%] right-[5%] top-[8%] w-[54%] overflow-hidden rounded-[2cqw]">
            <Shot n="comp-bg" className="absolute inset-0" />
            <img src={IMG("el-logo")} alt="" loading="lazy" className="absolute left-[5%] top-[6%] w-[24%]" />
            <img src={IMG("cutout")} alt="" loading="lazy" className="absolute bottom-[23%] right-[10%] h-[56%] object-contain" />
            <img src={IMG("el-citrus")} alt="" loading="lazy" className="absolute bottom-[6%] left-[40%] w-[17%]" />
            <img src={IMG("el-badge")} alt="" loading="lazy" className="absolute right-[4%] top-[6%] w-[22%] rotate-[8deg]" />
            <div className="absolute left-[5%] top-[44%] text-[#240A03]">
              <div className="text-[3.4cqw] font-extrabold leading-none tracking-[-0.03em]">Glow, bottled.</div>
              <div className="mt-[0.8cqw] text-[1.9cqw] font-semibold">Summer sale · this week only</div>
            </div>
          </div>
        </Frame>
      );

    /* 批量变体：同一支广告换底色和标题 */
    case "variations":
      return (
        <Frame label="Dozens of variations of one ad">
          <div className="absolute bottom-[8%] left-[30%] right-[5%] top-[8%] grid grid-cols-3 grid-rows-2 gap-[1.2cqw]">
            {["Glow up", "New in", "Daily glow", "Best seller", "Last call", "Night repair"].map((h, i) => (
              <div key={h} className="relative">
                <Shot n={`var-${i + 1}`} className="size-full rounded-[1.4cqw]" />
                <span className="absolute left-[6%] top-[6%] rounded-full bg-black/45 px-[1.1cqw] py-[0.5cqw] text-[1.89cqw] font-bold backdrop-blur">{h}</span>
              </div>
            ))}
          </div>
          <div className="absolute left-[5%] top-1/2 -translate-y-1/2">
            <div className="text-[9.45cqw] font-extrabold leading-none tracking-[-0.05em]">×6</div>
            <div className="mt-[1cqw] text-[2.43cqw] leading-snug text-white/70">One prompt,<br />new color<br />and headline</div>
          </div>
        </Frame>
      );

    /* 印刷 / 大图细节：包装图 + 放大镜看细字 */
    case "print":
      return (
        <Frame label={`Detail up to ${top}`}>
          <Shot n="print" className="absolute bottom-[8%] left-[6%] top-[8%] aspect-[3/4] rounded-[2cqw]" />
          <div className="absolute right-[8%] top-1/2 size-[30cqw] -translate-y-1/2 overflow-hidden rounded-full border-[0.5cqw] border-white shadow-[0_2cqw_5cqw_rgba(0,0,0,0.55)]">
            <Shot n="print" pos="62% 58%" zoom={3.2} className="size-full" />
          </div>
          <span className={`absolute left-[42%] top-1/2 w-[10%] ${link}`} />
          <Pill solid className="absolute bottom-[8%] right-[8%]">Up to {top}</Pill>
        </Frame>
      );

    /* 使用步骤第 3 步没有成片时：一条出好的成片 + 下载 */
    case "result":
    default:
      return (
        <Frame label={`A finished ${m.type === "image" ? "image" : "clip"}`}>
          <Shot n="result" className="absolute inset-[6%] rounded-[2cqw]" />
          <div className={`absolute inset-x-[10%] bottom-[10%] flex items-center gap-[1.4cqw] rounded-[1.6cqw] px-[1.8cqw] py-[1.2cqw] ${glass}`}>
            {m.type === "image" ? <ImageIcon className="size-[2.86cqw]" /> : <Play className="size-[2.86cqw] fill-current" />}
            <span className="text-[2.43cqw] font-bold">{m.name} · {top}</span>
            <Pill solid className="ml-auto"><Download className="size-[2.34cqw]" />Download</Pill>
          </div>
        </Frame>
      );
  }
}

function Toggle({ on }: { on?: boolean }) {
  return (
    <span className={`relative inline-block h-[3cqw] w-[5.4cqw] shrink-0 rounded-full ${on ? "bg-[#FF744D]" : "bg-white/20"}`}>
      <span className={`absolute top-1/2 size-[2.99cqw] -translate-y-1/2 rounded-full bg-white ${on ? "right-[0.35cqw]" : "left-[0.35cqw]"}`} />
    </span>
  );
}

function Lane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-[1.4cqw]">
      <span className="w-[10cqw] shrink-0 text-[2.16cqw] font-semibold text-white/70">{label}</span>
      <span className="h-[5cqw] flex-1">{children}</span>
    </div>
  );
}
