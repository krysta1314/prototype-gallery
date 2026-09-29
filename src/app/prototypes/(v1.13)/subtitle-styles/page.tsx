"use client";

/* 字幕样式(评审用):剪辑器里现在的全部样式,一张大卡片一套。
   样式直接读 Hybrid Reel 的 SUBTITLE_PRESETS(hybrid-reel/canvas/subtitles.tsx),和剪辑器预览区弹窗、全屏编辑的字幕面板是同一份,
   改了那边这里跟着变,不会对不上。
   2026-09-28 从调研候选库(catalog.tsx)里加选的 5 种排在原来 13 种后面(最初选了 12 种,去掉 7 种重复的);候选库只作为这几种的样式来源保留,不在页面上展示。 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SUBTITLE_PRESETS, SubtitleText, type SubtitlePreset } from "../hybrid-reel/canvas/subtitles";
import { describePreset, presetCss } from "./spec";
import { APPLE_FONT } from "../hybrid-reel/agent/chat/shell";

/* 示例台词 */
const SAMPLE = { zh: "软雾感谁看了都爱", en: "This mist is unreal" } as const;

/* 卡片背景统一用深灰纯底(黑底框、白底框都看得清):只看字幕本身,不让画面干扰判断。一行两张大卡,字够大,评审时看得清细节 */
const BACKDROP = "#4b4e57";

export default function SubtitleStylesPrototype() {
  const [lang, setLang] = useState<"zh" | "en">("en");

  return (
    <div className="min-h-dvh bg-[#f7f7f9] pb-16 text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1180px] px-6 pt-8">
        <header className="mb-5">
          <h1 className="text-[22px] font-bold">字幕样式 · {SUBTITLE_PRESETS.length} 套</h1>
          <p className="mt-1 text-[13.5px] text-[#6a6b7b]">
            Hybrid Reel 剪辑器里现在的全部字幕样式,都是静态样式(不含逐词高亮等动态效果)。和剪辑器预览区的「Subtitle styles」弹窗、全屏编辑的字幕面板是同一份数据,顺序也一样。每张卡下面是开发要的全部参数和可复制的 CSS,直接从样式数据里读出来,不是手抄的。
          </p>
        </header>

        {/* 示例设置:演示控件,不是产品界面 */}
        <div className="sticky top-0 z-20 -mx-6 mb-5 flex flex-wrap items-center gap-2 bg-[#f7f7f9]/95 px-6 py-3 backdrop-blur">
          <span className="text-[13px] text-[#6a6b7b]">示例</span>
          <Seg value={lang} onChange={setLang} options={[{ v: "zh", l: "中文" }, { v: "en", l: "English" }]} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SUBTITLE_PRESETS.map((p) => (
            <Card key={p.id} preset={p}>
              <SubtitleText text={SAMPLE[lang]} preset={p} progress={0} className="text-[clamp(15px,4.6cqw,30px)]" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 一套样式一张卡:上面是效果,下面是开发要的全部参数(从样式数据里读出来的,和剪辑器同一份)+ 可复制的 CSS */
function Card({ preset, children }: { preset: SubtitlePreset; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const css = presetCss(preset);
  const copy = () => {
    navigator.clipboard?.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#e7e8ee]">
      <div className="relative aspect-[2/1] w-full overflow-hidden" style={{ containerType: "inline-size", background: BACKDROP }}>
        <span className="absolute inset-x-[7%] top-1/2 -translate-y-1/2 text-center">{children}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
        <p className="text-[14px] font-semibold">{preset.name}</p>
        <code className="text-[11.5px] text-[#9a9bb0]">id: {preset.id}</code>
      </div>
      <dl className="grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 px-4 py-3 text-[12.5px] leading-snug">
        {describePreset(preset).map((r, i) => (
          <div key={i} className="contents">
            <dt className="text-[#9a9bb0]">{r.k}</dt>
            <dd className="min-w-0 break-words text-[#2a2b3d]">{r.v}</dd>
          </div>
        ))}
      </dl>
      <div className="relative mx-4 mb-4 mt-auto rounded-lg bg-[#f6f6f9] ring-1 ring-inset ring-[#ececf1]">
        <button
          type="button"
          onClick={copy}
          className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-[#4a4b5c] ring-1 ring-[#e1e3e9] transition hover:bg-[#f3f4f6]"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "已复制" : "复制 CSS"}
        </button>
        <pre className="overflow-x-auto px-3 py-2.5 pr-24 font-mono text-[11.5px] leading-relaxed text-[#3a3b4d] [scrollbar-width:thin]">{css}</pre>
      </div>
    </div>
  );
}

function Seg<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <span className="flex items-center gap-0.5 rounded-lg bg-white p-1 ring-1 ring-[#e1e3e9]">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition ${value === o.v ? "bg-[#1a1a2e] text-white" : "text-[#4a4b5c] hover:bg-[#f3f4f6]"}`}
        >
          {o.l}
        </button>
      ))}
    </span>
  );
}
