"use client";

/* 字幕样式(评审用):剪辑器里现在的全部样式,一张大卡片一套。
   样式直接读 Hybrid Reel 的 SUBTITLE_PRESETS(hybrid-reel/canvas/subtitles.tsx),和剪辑器预览区弹窗、全屏编辑的字幕面板是同一份,
   改了那边这里跟着变,不会对不上。
   2026-09-28 从调研候选库(catalog.tsx)里加选的 5 种排在原来 13 种后面(最初选了 12 种,去掉 7 种重复的);候选库只作为这几种的样式来源保留,不在页面上展示。 */

import { useState } from "react";
import { SUBTITLE_PRESETS, SubtitleText } from "../hybrid-reel/canvas/subtitles";
import { APPLE_FONT } from "../hybrid-reel/agent/chat/shell";

/* 示例台词 */
const SAMPLE = { zh: "软雾感谁看了都爱", en: "This mist is unreal" } as const;

/* 卡片背景统一用深色纯底:只看字幕本身,不让画面干扰判断。一行两张大卡,字够大,评审时看得清细节 */
const BACKDROP = "#16181d";

export default function SubtitleStylesPrototype() {
  const [lang, setLang] = useState<"zh" | "en">("en");

  return (
    <div className="min-h-dvh bg-[#f7f7f9] pb-16 text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1180px] px-6 pt-8">
        <header className="mb-5">
          <h1 className="text-[22px] font-bold">字幕样式 · {SUBTITLE_PRESETS.length} 套</h1>
          <p className="mt-1 text-[13.5px] text-[#6a6b7b]">
            Hybrid Reel 剪辑器里现在的全部字幕样式,都是静态样式(不含逐词高亮等动态效果)。和剪辑器预览区的「Subtitle styles」弹窗、全屏编辑的字幕面板是同一份数据,顺序也一样。
          </p>
        </header>

        {/* 示例设置:演示控件,不是产品界面 */}
        <div className="sticky top-0 z-20 -mx-6 mb-5 flex flex-wrap items-center gap-2 bg-[#f7f7f9]/95 px-6 py-3 backdrop-blur">
          <span className="text-[13px] text-[#6a6b7b]">示例</span>
          <Seg value={lang} onChange={setLang} options={[{ v: "zh", l: "中文" }, { v: "en", l: "English" }]} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SUBTITLE_PRESETS.map((p) => (
            <Card key={p.id} name={p.name}>
              <SubtitleText text={SAMPLE[lang]} preset={p} progress={0} className="text-[clamp(15px,4.6cqw,30px)]" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#e7e8ee]">
      <div className="relative aspect-[2/1] w-full overflow-hidden" style={{ containerType: "inline-size", background: BACKDROP }}>
        <span className="absolute inset-x-[7%] top-1/2 -translate-y-1/2 text-center">{children}</span>
      </div>
      <p className="px-3.5 py-3 text-[14px] font-semibold">{name}</p>
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
