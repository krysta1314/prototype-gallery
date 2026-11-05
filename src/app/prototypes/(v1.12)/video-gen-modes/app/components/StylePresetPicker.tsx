"use client";

/* H3 Max Style Presets 的「Style」:5 个风格各一张真实样图(同一个女生、同一条街、同一瓶精华，只换风格),
   一眼对比 VHS / 手绘 / 70 年代卡通 / 16-bit 像素 / 低多边形长什么样。
   样图 2026-11-05 用 BuzzVideo dev 的 GPT Image 2.5 Sunburst 生成(先出 VHS,其余 4 张以它为参考换风格),
   放在 public/prototypes/video-gen-modes/styles/。两列大图，看得清画面。 */

const DIR = "/prototypes/video-gen-modes/styles";
const SAMPLE: Record<string, string> = {
  VHS: `${DIR}/vhs.jpg`,
  "Hand-drawn": `${DIR}/hand-drawn.jpg`,
  "Retro Toon 70s": `${DIR}/retro-toon-70s.jpg`,
  "16-bit Pixel": `${DIR}/16-bit-pixel.jpg`,
  "Low Poly": `${DIR}/low-poly.jpg`,
};

export function StylePresetPicker({ values, value, onChange }: { values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Style" className="mt-1.5 grid grid-cols-2 gap-2">
      {values.map((v) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`flex flex-col gap-1.5 rounded-xl border p-1.5 text-left transition ${on ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#ececf1] bg-white hover:border-[#d4d3df]"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE[v]} alt={`${v} style example`} loading="lazy" className="aspect-video w-full rounded-lg bg-[#f3f4f6] object-cover" />
            <span className={`px-0.5 text-[12px] leading-tight ${on ? "font-semibold text-[#1a1a2e]" : "text-[#4a4b5c]"}`}>{v}</span>
          </button>
        );
      })}
    </div>
  );
}
