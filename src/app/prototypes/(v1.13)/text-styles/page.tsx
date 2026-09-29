"use client";

/* 字卡样式(评审用):剪辑器里现有的 9 套 + 2026-09-29 全网调研的热门字卡样式候选,一张卡一套,Monica 在这里挑。
   现有 9 套直接读剪辑器的 CardText(hybrid-reel/canvas/cards.tsx),候选在 catalog.tsx。
   「选中」只存在这个浏览器里(localStorage),挑完点「复制已选」贴到对话里,再由我把选中的做进剪辑器。 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { APPLE_FONT } from "../hybrid-reel/agent/chat/shell";
import { CardText } from "../hybrid-reel/canvas/cards";
import { CARD_STYLES } from "@/lib/hybrid-reel/cards";
import { GROUPS, STYLES, type Group } from "./catalog";
import { CardSpec } from "./spec";

type Lang = "zh" | "en";
type Bg = "photo" | "dark" | "light";

const PICKS_KEY = "text-styles-picks";
const inEditor = new Set(CARD_STYLES.map((s) => s.id));

/* 原有几套的示例文案;从候选加进剪辑器的,示例文案和说明取候选库里的 */
const CURRENT_SAMPLE: Record<string, { en: string; zh: string }> = {
  poster: { en: "Stop scrolling", zh: "别划走" },
  block: { en: "Absorbs in 3s", zh: "3 秒吸收" },
  tag: { en: "Fragrance-free", zh: "无香精" },
  sticker: { en: "New!", zh: "新品!" },
  button: { en: "Shop now", zh: "立即购买" },
  editorial: { en: "Skin, but better", zh: "更好的肌肤" },
  glass: { en: "Dermatologist tested", zh: "皮肤科测试" },
};

/* 现有 9 套的中文说明(CARD_STYLES 里的 fit 是写给排方案的模型看的英文) */
const CURRENT_NOTE: Record<string, string> = {
  poster: "超大压缩粗体全大写,白字粗黑边。开场钩子标题,让人停下来。",
  block: "强调色实底 + 粗体字。卖点、动作提示。",
  tag: "小白胶囊 + 强调色圆点。几个卖点一条条出。",
  sticker: "倾斜的黄色贴纸 + 硬投影。优惠、折扣、新品。",
  button: "胶囊按钮 + 箭头。行动号召。",
  editorial: "优雅衬线斜体,不加底。高级感标语,美妆、时尚。",
  glass: "毛玻璃半透明底板。干净、冷静,科技或护肤。",
};

const BACKDROP: Record<Bg, React.CSSProperties> = {
  photo: { backgroundImage: "url(/prototypes/buzzvideo-app/usecase-skincare.jpg)", backgroundSize: "cover", backgroundPosition: "center 40%" },
  dark: { background: "#16181d" },
  light: { background: "#eceef2" },
};

type Item = { id: string; name: string; group: Group | "current"; note: string; recipe?: string; source?: string; node: React.ReactNode };

export default function TextStylesPrototype() {
  const [lang, setLang] = useState<Lang>("en");
  const [bg, setBg] = useState<Bg>("photo");
  const [group, setGroup] = useState<Group | "current" | "all">("all");
  const [picks, setPicks] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PICKS_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
  }, []);
  const toggle = (id: string) =>
    setPicks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(PICKS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const items: Item[] = useMemo(
    () => [
      /* 剪辑器里的 28 套:直接用剪辑器的 CardText 画,和剪辑器里一模一样 */
      ...CARD_STYLES.map((s) => {
        const c = STYLES.find((x) => x.id === s.id);
        return {
          id: s.id,
          name: s.name,
          group: "current" as const,
          note: CURRENT_NOTE[s.id] ?? c?.note ?? s.fit,
          recipe: c?.recipe,
          source: c?.source,
          node: <CardText text={CURRENT_SAMPLE[s.id]?.[lang] ?? c?.sample[lang] ?? s.name} style={s.id} accent="#ff5e1a" />,
        };
      }),
      /* 没选的候选 */
      ...STYLES.filter((s) => !inEditor.has(s.id)).map((s) => ({ id: s.id, name: s.name, group: s.group, note: s.note, recipe: s.recipe, source: s.source, node: s.render(s.sample[lang]) })),
    ],
    [lang],
  );
  const shown = group === "all" ? items : items.filter((i) => i.group === group);
  const count = (g: Group | "current") => items.filter((i) => i.group === g).length;

  const copyPicks = () => {
    const text = picks
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean)
      .map((i) => `${i!.name}(${i!.id})`)
      .join("\n");
    navigator.clipboard?.writeText(`字卡样式 · 我选了这些:\n${text}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="min-h-dvh bg-[#f7f7f9] pb-16 text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-6">
        <header className="mb-4">
          <h1 className="text-[22px] font-bold">字卡样式 · 剪辑器 {CARD_STYLES.length} 套 + 未选候选 {STYLES.filter((s) => !inEditor.has(s.id)).length} 套</h1>
          <p className="mt-1 max-w-[860px] text-[13.5px] leading-relaxed text-[#6a6b7b]">
            字卡是画面上设计出来的文字(钩子标题、卖点、价格、口碑、CTA),和字幕分开。候选来自 TikTok / Instagram 自带文字样式、CapCut 文字模板与剪映花字、Canva 文字特效、Submagic,以及投放素材指南里常见的 UGC 广告字卡。全部是静态外观;原本靠动效的(打字、倒计时、上滑)只画停住时的样子。2026-09-29 定为 16 套进剪辑器(先选了 28 套,按投放素材里的热门程度砍到 18 套,再去掉 Notification、Search bar),「剪辑器里的」这组直接用剪辑器的渲染画,和剪辑器里一模一样;剩下的是没进剪辑器的候选。
          </p>
        </header>

        {/* 演示控件,不是产品界面 */}
        <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-col gap-2.5 bg-[#f7f7f9]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2">
              <span className="text-[13px] text-[#6a6b7b]">示例</span>
              <Seg value={lang} onChange={setLang} options={[{ v: "zh", l: "中文" }, { v: "en", l: "English" }]} />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[13px] text-[#6a6b7b]">背景</span>
              <Seg value={bg} onChange={setBg} options={[{ v: "photo", l: "画面" }, { v: "dark", l: "深色" }, { v: "light", l: "浅色" }]} />
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[13px] text-[#4a4b5c]">已选 {picks.length}</span>
              <button
                type="button"
                disabled={!picks.length}
                onClick={copyPicks}
                className="flex items-center gap-1.5 rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-[#2c2d44] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "已复制" : "复制已选"}
              </button>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([["all", `全部 ${items.length}`], ["current", `剪辑器里的 ${count("current")}`], ...GROUPS.map((g) => [g.id, `${g.zh} ${count(g.id)}`])] as [Group | "current" | "all", string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGroup(id)}
                className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition ${group === id ? "bg-[#1a1a2e] text-white" : "bg-white text-[#4a4b5c] ring-1 ring-[#e1e3e9] hover:bg-[#f3f4f6]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          {shown.map((it) => (
            <StyleCard key={it.id} it={it} on={picks.includes(it.id)} onToggle={() => toggle(it.id)} bg={bg} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* 一套样式一张卡:效果 + 说明 + 开发参数(从渲染出来的 DOM 读,见 spec.tsx) */
function StyleCard({ it, on, onToggle, bg, lang }: { it: Item; on: boolean; onToggle: () => void; bg: Bg; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const groupLabel = it.group === "current" ? "剪辑器里" : GROUPS.find((g) => g.id === it.group)?.zh;
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl bg-white transition ${on ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#e7e8ee]"}`}>
      <div className="relative aspect-[2/1] w-full overflow-hidden" style={{ containerType: "inline-size", ...BACKDROP[bg] }}>
        <div ref={ref} className="absolute inset-0 grid place-items-center px-[6%] text-center" style={{ fontSize: "clamp(12px, 3.6cqw, 22px)" }}>
          {it.node}
        </div>
        <button
          type="button"
          aria-pressed={on}
          aria-label={on ? `取消选择 ${it.name}` : `选择 ${it.name}`}
          onClick={onToggle}
          className={`absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full transition ${on ? "bg-[#ff5e1a] text-white" : "bg-white/85 text-transparent ring-1 ring-black/10 hover:text-[#9a9bb0]"}`}
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[14px] font-semibold">
            {it.name} <code className="ml-1 text-[11.5px] font-normal text-[#9a9bb0]">id: {it.id}</code>
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${it.group === "current" ? "bg-[#fff3ec] text-[#d24f14]" : "bg-[#f3f4f6] text-[#6a6b7b]"}`}>{groupLabel}</span>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-[#4a4b5c]">{it.note}</p>
        {it.source && <p className="mt-1 text-[11.5px] text-[#9a9bb0]">来源:{it.source}</p>}
        <CardSpec previewRef={ref} wrapped={it.group === "current"} deps={[lang, it.id]} />
      </div>
    </div>
  );
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <span className="flex items-center gap-0.5 rounded-lg bg-white p-1 ring-1 ring-[#e1e3e9]">
      {options.map((o) => (
        <button
          key={o.v}
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
