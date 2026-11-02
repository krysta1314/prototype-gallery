"use client";

/* 字卡样式(评审用):剪辑器里现有的 9 套 + 2026-09-29 全网调研的热门字卡样式候选,一张卡一套,Monica 在这里挑。
   现有 9 套直接读剪辑器的 CardText(hybrid-reel/canvas/cards.tsx),候选在 catalog.tsx。
   「选中」只存在这个浏览器里(localStorage),挑完点「复制已选」贴到对话里,再由我把选中的做进剪辑器。 */

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { APPLE_FONT } from "../hybrid-reel/agent/chat/shell";
import { CardText } from "../hybrid-reel/canvas/cards";
import { CARD_STYLES } from "@/lib/hybrid-reel/cards";
import { STYLES } from "./catalog";
import { CardSpec } from "./spec";

type Lang = "yue" | "en";


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

/* 粵語(繁體)示例:港澳投放的主要語言;沒有的回退到候選庫的中文 */
const YUE: Record<string, string> = {
  "tiktok-box": "試勻晒所有精華\n淨係留低呢支",
  "tiktok-outline": "用咗三個禮拜之後…",
  "ig-strong": "唔好再亂洗錢",
  "comment-reply": "油性皮用真係有用咩??",
  "imessage": "你最近用緊咩護膚品?",
  "hormozi": "呢支*改變咗一切*",
  "beast-pop": "真係唔敢相信",
  "pov": "你終於搵到一支有用嘅精華",
  "huazi": "正到爆!!",
  "neon": "發光模式開啟",
  "link-in-bio": "連結喺主頁 👇",
  "poster": "唔好碌走",
  "block": "3 秒吸收",
  "tag": "無香精",
  "sticker": "新品!",
  "button": "立即購買",
  "editorial": "更好嘅肌膚",
  "glass": "皮膚科測試",
};

/* 預覽底色:固定深灰 */
const BACKDROP: React.CSSProperties = { background: "#2b2d33" };

/** 示例文案:English 用英文;粵語用 YUE,沒有就用候選庫的中文 */
const sampleOf = (id: string, lang: Lang, fallback?: { en: string; zh: string }) =>
  lang === "en" ? (CURRENT_SAMPLE[id]?.en ?? fallback?.en) : (YUE[id] ?? CURRENT_SAMPLE[id]?.zh ?? fallback?.zh);

type Item = { id: string; name: string; note: string; recipe?: string; source?: string; node: React.ReactNode };

export default function TextStylesPrototype() {
  const [lang, setLang] = useState<Lang>("en");

  /* 只放剪辑器里现有的这几套,直接用剪辑器的 CardText 画,和剪辑器里一模一样 */
  const items: Item[] = useMemo(
    () =>
      CARD_STYLES.map((s) => {
        const c = STYLES.find((x) => x.id === s.id);
        return {
          id: s.id,
          name: s.name,
          note: CURRENT_NOTE[s.id] ?? c?.note ?? s.fit,
          recipe: c?.recipe,
          source: c?.source,
          node: <CardText text={sampleOf(s.id, lang, c?.sample) ?? s.name} style={s.id} accent="#ff5e1a" />,
        };
      }),
    [lang],
  );

  return (
    <div className="min-h-dvh bg-[#f7f7f9] pb-16 text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1920px] px-4 pt-8 sm:px-8">
        <header className="mb-4">
          <h1 className="text-[22px] font-bold">字卡样式</h1>
          <p className="mt-1 max-w-[860px] text-[13.5px] leading-relaxed text-[#6a6b7b]">
            字卡是画面上设计出来的文字(钩子标题、卖点、价格、口碑、CTA),和字幕分开。这里只放剪辑器里现有的样式,直接用剪辑器的渲染画,和剪辑器里一模一样;示例文案默认 English,可切粤语(繁体),每张卡的开发参数默认收起。
          </p>
        </header>

        {/* 演示控件,不是产品界面 */}
        <div className="sticky top-0 z-20 -mx-4 mb-5 flex items-center gap-2 bg-[#f7f7f9]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <span className="text-[13px] text-[#6a6b7b]">示例</span>
          <Seg value={lang} onChange={setLang} options={[{ v: "en", l: "English" }, { v: "yue", l: "粵語(繁體)" }]} />
        </div>

        <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((it) => (
            <StyleCard key={it.id} it={it} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* 一套样式一张卡:效果 + 说明 + 开发参数(从渲染出来的 DOM 读,见 spec.tsx) */
function StyleCard({ it, lang }: { it: Item; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  /* 开发参数(字号、颜色、CSS)默认收起,点开才看 */
  const [spec, setSpec] = useState(false);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#e7e8ee]">
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ containerType: "inline-size", ...BACKDROP }}>
        <div ref={ref} className="absolute inset-0 grid place-items-center px-[6%] text-center" style={{ fontSize: "clamp(10px, 5.4cqw, 20px)" }}>
          {it.node}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[14px] font-semibold">
            {it.name} <code className="ml-1 text-[11.5px] font-normal text-[#9a9bb0]">id: {it.id}</code>
          </p>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-[#4a4b5c]">{it.note}</p>
        {it.source && <p className="mt-1 text-[11.5px] text-[#9a9bb0]">来源:{it.source}</p>}
        <button
          type="button"
          aria-expanded={spec}
          onClick={() => setSpec((v) => !v)}
          className="mt-2 flex items-center gap-1 self-start text-[12px] font-medium text-[#6a6b7b] hover:text-[#1a1a2e]"
        >
          {spec ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          开发参数
        </button>
        {spec && <CardSpec previewRef={ref} wrapped deps={[lang, it.id]} />}
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
