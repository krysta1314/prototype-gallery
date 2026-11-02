"use client";
/* eslint-disable @next/next/no-img-element -- 对比页全是示意缩略图,不走 next/image */

/* 待生成 AI 镜头 · 方案对比页(给 Monica 选方案用)。
   同一组示例镜头、同一个状态开关,六个方案并排:预览区 + 工具栏 + 时间线。
   演示说明用中文,产品 UI 文案用英文。 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, Clock, Loader2, Play, RefreshCw, Video } from "lucide-react";
import { LIBRARY_IMAGES, LIBRARY_VIDEOS } from "../canvas/project";

type State = "idle" | "generating" | "failed";

/* 示意素材:站内几条护肤类 Seedance 成片的画面(精华质地特写 / 梳妆台上的产品 / 护肤流程)+ 一张产品图 */
const VID = LIBRARY_VIDEOS.map((x) => x.src);
const IMG = [VID[0], VID[1], VID[2], LIBRARY_IMAGES[0].src];
const PROGRESS = 45;
const PX = 40; // 每秒像素

type Shot = {
  n: number;
  role: string;
  len: number;
  pending: boolean;
  src?: string;
  prompt?: string;
  refs?: string[];
  fields?: { framing: string; abbr: string; subject: string; setting: string; light: string; motion: string };
  /** 给普通用户看的大白话:短标题 + 这一镜在片子里的作用 */
  title?: string;
  why?: string;
};

const SHOTS: Shot[] = [
  {
    n: 1,
    role: "Hook",
    len: 2,
    pending: true,
    prompt:
      "Close-up macro shot of flaky, caked foundation on the cheek of someone sitting beside a running air conditioner vent, bright soft indoor lighting",
    refs: [IMG[0], IMG[1], IMG[2]],
    title: "Makeup cracking in the AC",
    why: "Opens on the problem your viewers feel every day, so they stop scrolling.",
    fields: {
      framing: "Macro close-up",
      abbr: "ECU",
      subject: "Flaky, caked foundation on a cheek",
      setting: "Beside a running AC vent",
      light: "Bright, soft indoor",
      motion: "Static",
    },
  },
  { n: 2, role: "Proof", len: 1, pending: false, src: IMG[3] },
  { n: 3, role: "Usage", len: 3, pending: false, src: IMG[1] },
  {
    n: 4,
    role: "Proof",
    len: 3,
    pending: true,
    prompt: "Macro slow-motion shot of fine mist from the spray landing on skin, post-application skin looks dewy, no caking residue",
    refs: [IMG[1], IMG[0]],
    title: "Mist settling on skin",
    why: "Shows the spray working, right before the call to action.",
    fields: {
      framing: "Macro close-up",
      abbr: "ECU",
      subject: "Fine mist landing on skin",
      setting: "Clean studio backdrop",
      light: "Soft daylight",
      motion: "Slow motion",
    },
  },
  { n: 5, role: "CTA", len: 6, pending: false, src: IMG[2] },
];
const FOCUS = SHOTS[0];

/* 第 1 镜跟着状态开关走;第 4 镜在「生成中」时算排队 / 未生成,方便对比两种待生成状态 */
const stateOf = (s: Shot, global: State, auto: boolean): State | "queued" => {
  /* C 方案进画布就排队,没有「未生成」这一态 */
  if (s.n === 1) return auto && global === "idle" ? "queued" : global;
  return auto ? "queued" : "idle";
};

/* ──────────────────────────── 页面 ──────────────────────────── */

export default function PendingOptions() {
  const [state, setState] = useState<State>("idle");
  const options: { id: string; name: string; idea: string; pros: string; cons: string; preview: Look; clip: Look; toolbar: "none" | "generateAll" | "auto" }[] = [
    {
      id: "0",
      name: "现在的版本 · 取景框 + 镜头描述",
      idea: "四角取景框,左上镜头编号,镜头描述作为主角,预览里带 Generate shot。",
      pros: "去掉了星星和斜纹,信息完整。",
      cons: "描述和 Settings 重复;预览变成读文字,不像在看视频;时间线灰块看不出内容。",
      preview: "slate",
      clip: "flat",
      toolbar: "none",
    },
    {
      id: "A",
      name: "A · 参考素材替身",
      idea: "这一镜本来就是拿参考素材生成的,待生成时直接展示它的输入:第一张参考做灰度画面,底部一排参考缩略图。",
      pros: "一眼知道这一镜大概是什么;时间线能读(哪里是产品、哪里是人);没有 AI 符号。",
      cons: "参考图和最终画面可能差很多,用户可能误以为「就是这个画面」。",
      preview: "refs",
      clip: "refs",
      toolbar: "generateAll",
    },
    {
      id: "B",
      name: "B · 镜头单(Shot list)",
      idea: "用拍摄现场的语言:大号镜头编号 + 景别 / 主体 / 场景 / 光线 / 运镜 五个字段。时间线像一排索引卡「01 · ECU」。",
      pros: "最像专业工具;用户看的是「这一镜怎么拍」,改镜头细节时很清楚。",
      cons: "需要 Agent 生成分镜时多输出 5 个结构化字段;对不懂拍摄的商家略抽象。",
      preview: "shotlist",
      clip: "index",
      toolbar: "generateAll",
    },
    {
      id: "C",
      name: "C · 进画布即自动生成",
      idea: "执行计划在 Agent 里已经确认、积分也看过了,进画布就把所有 AI 镜头排队生成。「未生成」基本不出现,重点变成等待体验:灰度参考画面随进度从左到右上色。",
      pros: "少一步操作;等待过程本身就是反馈;时间线上一眼看到哪些镜头在排队、哪些在生成。",
      cons: "流程改动:进画布就开始扣积分,需要在执行计划卡上把这一点讲清楚。",
      preview: "auto",
      clip: "reveal",
      toolbar: "auto",
    },
    {
      id: "D",
      name: "D · 混合:预览镜头单 + 时间线参考图",
      idea: "预览区用 B 的镜头卡讲清楚「怎么拍」,时间线用 A 的参考图让整条片子可读。",
      pros: "两边各取所长:细节在预览,全局在时间线。",
      cons: "和 B 一样需要结构化字段;两种视觉语言要调得足够统一。",
      preview: "shotlist",
      clip: "refs",
      toolbar: "generateAll",
    },
    {
      id: "E",
      name: "E · 极简留白",
      idea: "预览区只写「Shot 1 · Hook · Not generated」,其余全部交给右侧 Settings;时间线是虚线空槽 + 镜头号。",
      pros: "最安静,完全不和成片抢注意力;信息只出现一次。",
      cons: "信息量最少,用户要点开 Settings 才知道这一镜是什么。",
      preview: "minimal",
      clip: "slot",
      toolbar: "generateAll",
    },
    {
      id: "F",
      name: "F · 线稿分镜",
      idea: "把参考画面实时描成铅笔线稿,像导演手绘的分镜稿。生成时线稿渐渐显影成真实画面。",
      pros: "一眼就懂「这是分镜,还没拍」;保留了构图信息,又不会被误认为成片。",
      cons: "线稿效果依赖参考图本身的对比度,很暗或很平的参考图描出来会比较乱。",
      preview: "sketch",
      clip: "sketch",
      toolbar: "generateAll",
    },
    {
      id: "G",
      name: "G · 低清草稿 → 逐步变清晰",
      idea: "参考画面先用很粗的马赛克显示,像一张没加载完的草图;生成过程中马赛克一格一格变细,直到清晰。",
      pros: "进度直接体现在画面清晰度上,不需要额外的进度条;有「正在成像」的感觉。",
      cons: "马赛克在「未生成」时信息量偏少;对视觉敏感的用户可能觉得像网络卡了。",
      preview: "pixel",
      clip: "pixel",
      toolbar: "generateAll",
    },
    {
      id: "H",
      name: "H · 离线素材(专业剪辑软件语言)",
      idea: "借用 Premiere / 剪映专业版里「媒体离线」的样子:深色画面、等宽字体、时间码,写明这一镜的起止时间。",
      pros: "剪辑师零学习成本;深色让待生成的镜头在时间线上非常醒目,绝不会和成片混淆。",
      cons: "偏专业、偏冷,和 Buzz 温暖活泼的品牌气质有距离;对普通商家不够友好。",
      preview: "offline",
      clip: "offline",
      toolbar: "generateAll",
    },
    {
      id: "I",
      name: "I · 胶片底片(未冲印)",
      idea: "参考画面显示成还没冲印的彩色负片(橙色调的反色),两边带齿孔;生成过程就是「冲印显影」,负片慢慢变成正片。",
      pros: "隐喻最完整:还没冲印 → 冲印中 → 成片;非常有记忆点,和「拍视频」直接相关。",
      cons: "拟物感强,做不好会显得复古、花哨;负片色调会让参考内容更难辨认。",
      preview: "negative",
      clip: "negative",
      toolbar: "generateAll",
    },
    {
      id: "J",
      name: "J · 大白话镜头卡",
      idea: "不给用户看英文提示词和术语:一个短标题说这一镜拍什么,一句话说它在片子里起什么作用;下面讲清积分、时长、不满意可以重生成。时间线片段直接显示短标题。",
      pros: "普通商家零门槛;把「为什么要这一镜」讲清楚,用户更愿意花积分;时间线读起来像一份故事大纲。",
      cons: "需要 Agent 多输出「短标题 + 作用」两个字段(比镜头单的 5 个字段简单)。",
      preview: "plain",
      clip: "plainclip",
      toolbar: "generateAll",
    },
    {
      id: "K",
      name: "K · 助手口吻",
      idea: "延续 Agent 对话的体验:预览区是一条助手消息「这一镜我会帮你拍……」,下面两个按钮 Create this shot / Change it。改的话直接用大白话告诉助手。",
      pros: "和对话页一脉相承,用户知道「有人在帮我」;改镜头不用懂提示词,说人话就行。",
      cons: "预览区像聊天界面,和剪辑器的视觉语言有落差;需要接一个改写镜头的对话能力。",
      preview: "assistant",
      clip: "plainclip",
      toolbar: "generateAll",
    },
    {
      id: "L",
      name: "L · 分步进度",
      idea: "未生成时列出这一镜会经过的三步;生成中逐步打勾:读取你的参考素材 → 构图 → 渲染视频,并告诉用户大概还要多久。",
      pros: "等待不焦虑:用户知道 AI 在做什么、做到哪;失败时也能指出卡在哪一步。",
      cons: "步骤是演示性的(接口只回一个总进度),步骤节奏要按经验估。",
      preview: "steps",
      clip: "steps",
      toolbar: "generateAll",
    },
    {
      id: "M",
      name: "M · 由你的素材生成",
      idea: "左边是用户自己的素材「Your footage」,箭头指向右边的新镜头「New shot」,直观说明 AI 在做什么;新镜头位置先放大白话标题。",
      pros: "最能消除「AI 会乱生成」的顾虑:用户看得到新镜头是从自己的素材来的。",
      cons: "预览区被分成两半,新镜头的位置比较小;参考素材多于一张时要选代表图。",
      preview: "basedon",
      clip: "refs",
      toolbar: "generateAll",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#f7f7f9] pb-24 text-[#1a1a2e]">
      {/* 演示控制条(中文,不属于产品) */}
      <div className="sticky top-0 z-20 border-b border-[#e6e7ec] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-3">
          <h1 className="text-[15px] font-bold">待生成 AI 镜头 · 方案对比</h1>
          <span className="text-[12.5px] text-[#6a6b7b]">预览区 + 时间线,同一组镜头;第 1 镜跟着右边的状态切换</span>
          <div className="ml-auto flex rounded-lg bg-[#f1f2f5] p-0.5 text-[12.5px] font-semibold">
            {(
              [
                ["idle", "未生成"],
                ["generating", "生成中"],
                ["failed", "失败"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setState(id)}
                className={`rounded-md px-3 py-1.5 transition ${state === id ? "bg-white shadow-sm" : "text-[#6a6b7b] hover:text-[#1a1a2e]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-6 pb-2 text-[12px] font-semibold">
          {options.map((o) => (
            <a key={o.id} href={`#opt-${o.id}`} className="whitespace-nowrap rounded-full px-2.5 py-1 text-[#4a4b5c] hover:bg-[#f1f2f5]">
              {o.name.split(" · ")[0]}
            </a>
          ))}
        </nav>
      </div>

      {/* 线稿滤镜:去色 → 边缘检测 → 反相,描出铅笔线 */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="hr-sketch" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="-3.2" intercept="1" />
            <feFuncG type="linear" slope="-3.2" intercept="1" />
            <feFuncB type="linear" slope="-3.2" intercept="1" />
          </feComponentTransfer>
        </filter>
      </svg>

      <main className="mx-auto max-w-[1180px] space-y-8 px-6 pt-8">
        {options.map((o) => (
          <section
            key={o.id}
            id={`opt-${o.id}`}
            className="scroll-mt-28 overflow-hidden rounded-2xl bg-white ring-1 ring-[#e6e7ec]"
          >
            <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
              <div>
                <h2 className="text-[16px] font-bold">{o.name}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[#4a4b5c]">{o.idea}</p>
                <p className="mt-3 text-[12.5px] leading-relaxed">
                  <span className="font-semibold text-[#12704b]">好处 </span>
                  <span className="text-[#4a4b5c]">{o.pros}</span>
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed">
                  <span className="font-semibold text-[#c2410c]">代价 </span>
                  <span className="text-[#4a4b5c]">{o.cons}</span>
                </p>
              </div>
              <EditorMock state={state} preview={o.preview} clip={o.clip} toolbar={o.toolbar} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

/* ──────────────────────────── 剪辑器缩略版 ──────────────────────────── */

type Look =
  | "slate" | "refs" | "shotlist" | "auto" | "minimal" | "flat" | "index" | "reveal" | "slot"
  | "sketch" | "pixel" | "offline" | "negative"
  | "plain" | "plainclip" | "assistant" | "steps" | "basedon";

function EditorMock({ state, preview, clip, toolbar }: { state: State; preview: Look; clip: Look; toolbar: "none" | "generateAll" | "auto" }) {
  const auto = toolbar === "auto";
  const total = SHOTS.reduce((n, s) => n + s.len, 0);
  const pendingCount = SHOTS.filter((s) => s.pending).length;
  return (
    <div className="overflow-hidden rounded-xl bg-[#EDF1F3] ring-1 ring-[#e6e7ec]">
      <div className="grid h-[400px] place-items-center p-4">
        <div className="relative h-full overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(26,26,46,0.08)]" style={{ aspectRatio: "9 / 16", containerType: "inline-size" }}>
          <PendingPreview look={preview} state={stateOf(FOCUS, state, auto)} />
        </div>
      </div>
      <div className="bg-white px-4 pb-4">
        <div className="flex h-11 items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-[#1a1a2e] text-white">
            <Play className="ml-px size-3" fill="currentColor" />
          </span>
          <span className="text-[12.5px] font-semibold tabular-nums">
            00:00 <span className="font-normal text-[#9a9bb0]">/ 00:{String(total).padStart(2, "0")}</span>
          </span>
          <span className="ml-auto">
            <ToolbarStatus kind={toolbar} state={state} count={pendingCount} />
          </span>
        </div>
        <div className="overflow-hidden">
          <div className="relative flex gap-[3px]" style={{ width: total * PX + 12 }}>
            {SHOTS.map((s) => (
              <div key={s.n} className="relative h-[58px] shrink-0 overflow-hidden rounded-[6px]" style={{ width: s.len * PX - 3 }}>
                {s.pending ? <PendingClip look={clip} shot={s} state={stateOf(s, state, auto)} /> : <ReadyClip src={s.src!} />}
              </div>
            ))}
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[1.5px] bg-[#1a1a2e]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyClip({ src }: { src: string }) {
  return <Frame src={src} className="absolute inset-0 size-full object-cover" />;
}

/** 视频取一帧当缩略图;图片直接显示 */
function Frame({ src, className = "", style }: { src: string; className?: string; style?: React.CSSProperties }) {
  return /\.mp4$/.test(src) ? (
    <video src={`${src}#t=1`} muted playsInline preload="metadata" className={className} style={style} />
  ) : (
    <img src={src} alt="" className={className} style={style} />
  );
}

/** 马赛克画面:取一帧画到很小的 canvas 上再放大(image-rendering: pixelated),cells = 横向格数 */
function PixelFrame({ src, cells, className = "" }: { src: string; cells: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    const draw = (el: CanvasImageSource, w: number, h: number) => {
      if (cancelled || !w || !h) return;
      const box = canvas.getBoundingClientRect();
      const cols = cells;
      const rows = Math.max(1, Math.round((cols * box.height) / Math.max(1, box.width)));
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      /* object-cover:按画框比例裁中间 */
      const scale = Math.max(cols / w, rows / h);
      const dw = w * scale;
      const dh = h * scale;
      ctx.drawImage(el, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    };
    if (/\.mp4$/.test(src)) {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.preload = "auto";
      v.src = `${src}#t=1`;
      v.onloadeddata = () => draw(v, v.videoWidth, v.videoHeight);
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight);
    }
    return () => {
      cancelled = true;
    };
  }, [src, cells]);
  return <canvas ref={ref} className={className} style={{ imageRendering: "pixelated" }} />;
}

/** 胶片两侧的齿孔 */
function Sprockets({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-y-0 w-[9%] ${side === "left" ? "left-0" : "right-0"}`}
      style={{
        backgroundImage: "linear-gradient(#f5e6d8, #f5e6d8)",
        backgroundSize: "44% 10px",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "center 6px",
        maskImage: "repeating-linear-gradient(180deg, #000 0 10px, transparent 10px 20px)",
        WebkitMaskImage: "repeating-linear-gradient(180deg, #000 0 10px, transparent 10px 20px)",
        borderRadius: 2,
      }}
    />
  );
}

function ToolbarStatus({ kind, state, count }: { kind: "none" | "generateAll" | "auto"; state: State; count: number }) {
  if (kind === "none") return null;
  if (kind === "auto") {
    if (state === "failed")
      return (
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#d0342c]">
          <AlertCircle className="size-3.5" /> 1 shot failed
          <button type="button" className="rounded-md bg-[#fff5f4] px-2 py-1 text-[#d0342c] ring-1 ring-inset ring-[#f3c4c0]">
            Retry
          </button>
        </span>
      );
    return (
      <span className="flex items-center gap-2 text-[12px] font-semibold text-[#4a4b5c]">
        <Loader2 className="size-3.5 animate-spin text-[#ff5e1a]" />
        {state === "generating" ? "Generating 1 shot · 1 queued" : "2 shots queued"}
        <span className="font-normal text-[#9a9bb0]">· about 1 min</span>
      </span>
    );
  }
  if (state === "generating")
    return (
      <span className="flex items-center gap-2 text-[12px] font-semibold text-[#4a4b5c]">
        <Loader2 className="size-3.5 animate-spin text-[#ff5e1a]" /> Generating 1 shot
        <span className="font-normal text-[#9a9bb0]">· 1 not generated</span>
      </span>
    );
  return (
    <span className="flex items-center gap-2 text-[12px]">
      <span className="font-semibold text-[#4a4b5c]">
        {count} shots not generated <span className="font-normal text-[#9a9bb0]">· {count * 50} credits</span>
      </span>
      <button type="button" className="rounded-md bg-[#1a1a2e] px-2.5 py-1 font-semibold text-white">
        Generate all
      </button>
    </span>
  );
}

/* ──────────────────────────── 预览区的各个方案 ──────────────────────────── */

function PendingPreview({ look, state }: { look: Look; state: State | "queued" }) {
  const s = FOCUS;
  const meta = `Shot ${s.n} · ${s.role} · ${s.len.toFixed(1)}s`;

  if (look === "slate") {
    const corner = "absolute size-[7%] min-h-3 min-w-3 border-[#b9bbc6]";
    return (
      <div className="relative size-full bg-[#f1f2f5]">
        <span className={`${corner} left-[6%] top-[4%] border-l-[1.5px] border-t-[1.5px]`} />
        <span className={`${corner} right-[6%] top-[4%] border-r-[1.5px] border-t-[1.5px]`} />
        <span className={`${corner} bottom-[4%] left-[6%] border-b-[1.5px] border-l-[1.5px]`} />
        <span className={`${corner} bottom-[4%] right-[6%] border-b-[1.5px] border-r-[1.5px]`} />
        <div className="absolute inset-x-[12%] top-[11%]">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6a6b7b]">
            <Video className="size-3.5" /> {meta}
          </p>
          <p className="mt-3 line-clamp-6 text-[13px] font-medium leading-snug">{s.prompt}</p>
          <StatusLine state={state} fallback={<span className="mt-4 inline-block whitespace-nowrap rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[11.5px] font-semibold text-white">Generate shot <span className="font-normal opacity-60">· 50 credits</span></span>} />
        </div>
      </div>
    );
  }

  if (look === "refs" || look === "auto") {
    const reveal = look === "auto" && state === "generating";
    return (
      <div className="relative size-full bg-[#1a1a2e]">
        {/* 灰度参考画面;C 方案生成中:彩色版按进度从左到右露出来 */}
        <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover opacity-60 grayscale" />
        {reveal && (
          <span className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - PROGRESS}% 0 0)` }}>
            <Frame src={s.refs![0]} className="size-full object-cover" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
        <div className="absolute inset-x-3 top-3 flex flex-col items-start gap-1.5">
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">
            <Video className="size-3" /> {meta}
          </span>
          <StatePill state={state} dark />
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <p className="mb-1.5 text-[10.5px] font-medium text-white/75">Generates from {s.refs!.length} references</p>
          <div className="flex gap-1.5">
            {s.refs!.map((r) => (
              <Frame key={r} src={r} className="h-12 w-9 rounded-md object-cover ring-1 ring-white/60" />
            ))}
          </div>
          {state === "generating" && (
            <span className="mt-2.5 block h-[3px] overflow-hidden rounded-full bg-white/25">
              <span className="block h-full rounded-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
            </span>
          )}
        </div>
      </div>
    );
  }

  if (look === "shotlist") {
    const f = s.fields!;
    return (
      <div className="relative flex size-full flex-col bg-[#f7f8fa] p-[8%]">
        <div className="flex items-start justify-between">
          <span className="text-[44px] font-semibold leading-none tracking-[-0.03em] tabular-nums">0{s.n}</span>
          <span className="pt-1 text-right text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#6a6b7b]">
            {s.role}
            <br />
            <span className="tabular-nums normal-case tracking-normal">{s.len.toFixed(1)}s</span>
          </span>
        </div>
        <dl className="mt-4 divide-y divide-[#e6e7ec] border-y border-[#e6e7ec] text-[11px]">
          {(
            [
              ["Framing", f.framing],
              ["Subject", f.subject],
              ["Setting", f.setting],
              ["Light", f.light],
              ["Motion", f.motion],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[52px_1fr] gap-2 py-1.5">
              <dt className="text-[#9a9bb0]">{k}</dt>
              <dd className="font-medium leading-snug">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex gap-1">
            {s.refs!.map((r) => (
              <Frame key={r} src={r} className="h-9 w-7 rounded object-cover ring-1 ring-[#e6e7ec]" />
            ))}
          </div>
          <StatePill state={state} />
        </div>
        {state === "generating" && (
          <span className="mt-2 block h-[3px] overflow-hidden rounded-full bg-[#e6e7ec]">
            <span className="block h-full rounded-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
          </span>
        )}
      </div>
    );
  }

  if (look === "plain") {
    return (
      <div className="flex size-full flex-col bg-white p-[8%]">
        <span className="self-start rounded-full bg-[#fff1e8] px-2 py-0.5 text-[10.5px] font-semibold text-[#c2410c]">
          Shot {s.n} of 5 · {s.role}
        </span>
        <p className="mt-3 text-[17px] font-bold leading-snug [text-wrap:balance]">{s.title}</p>
        <p className="mt-1.5 text-[12px] leading-snug text-[#4a4b5c]">{s.why}</p>
        <div className="mt-auto">
          {state === "generating" ? (
            <FriendlyProgress />
          ) : state === "failed" ? (
            <FriendlyFailed />
          ) : (
            <>
              <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] py-2 text-[12.5px] font-semibold text-white">
                Create this shot <span className="font-normal opacity-80">· 50 credits</span>
              </span>
              <p className="mt-2 text-center text-[10.5px] leading-snug text-[#9a9bb0]">Takes about 30 seconds. Not happy? Recreate it anytime.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (look === "assistant") {
    return (
      <div className="flex size-full flex-col justify-end bg-[#f7f8fa] p-[7%]">
        <div className="flex items-end gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-[10px] font-bold text-white">B</span>
          <div className="rounded-2xl rounded-bl-md bg-white p-3 text-[12px] leading-snug shadow-[0_1px_3px_rgba(26,26,46,0.08)] ring-1 ring-[#eceef2]">
            {state === "generating" ? (
              <>
                <p>Creating “{s.title}” now — about 20 seconds left.</p>
                <FriendlyProgress compact />
              </>
            ) : state === "failed" ? (
              <p>
                That one didn’t come out right. <span className="font-semibold text-[#c2410c]">Try again?</span> It won’t cost extra.
              </p>
            ) : (
              <p>
                For shot {s.n} I’ll film <span className="font-semibold">{s.title?.toLowerCase()}</span> — {s.why?.charAt(0).toLowerCase()}
                {s.why?.slice(1)}
              </p>
            )}
          </div>
        </div>
        {state === "idle" && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8">
            <span className="whitespace-nowrap rounded-full bg-[#1a1a2e] px-3 py-1.5 text-[11.5px] font-semibold text-white">Create this shot · 50</span>
            <span className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#4a4b5c] ring-1 ring-[#e1e3e9]">Change it</span>
          </div>
        )}
      </div>
    );
  }

  if (look === "steps") {
    const current = state === "generating" ? 1 : state === "failed" ? 1 : -1;
    const steps = ["Reading your references", "Composing the shot", "Rendering the video"];
    return (
      <div className="flex size-full flex-col bg-white p-[8%]">
        <p className="text-[10.5px] font-semibold text-[#9a9bb0]">
          Shot {s.n} · {s.role} · {s.len.toFixed(1)}s
        </p>
        <p className="mt-1.5 text-[15px] font-bold leading-snug">{s.title}</p>
        <ol className="mt-5 space-y-3">
          {steps.map((label, i) => {
            const done = i < current;
            const active = i === current;
            const failedHere = state === "failed" && active;
            return (
              <li key={label} className="flex items-center gap-2.5 text-[12px]">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                    done
                      ? "bg-[#1f9d6b] text-white"
                      : failedHere
                        ? "bg-[#fff5f4] text-[#d0342c] ring-1 ring-[#f3c4c0]"
                        : active
                          ? "bg-[#fff1e8] text-[#ff5e1a] ring-1 ring-[#ffc4a3]"
                          : "bg-[#f1f2f5] text-[#9a9bb0]"
                  }`}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : failedHere ? <AlertCircle className="size-3" /> : active ? <Loader2 className="size-3 animate-spin" /> : i + 1}
                </span>
                <span className={done ? "text-[#4a4b5c]" : active ? "font-semibold text-[#1a1a2e]" : "text-[#9a9bb0]"}>{label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-auto text-[10.5px] leading-snug text-[#9a9bb0]">
          {state === "generating" ? "About 20 seconds left." : state === "failed" ? "Something went wrong while composing. Try again — no extra credits." : "About 30 seconds · 50 credits"}
        </p>
      </div>
    );
  }

  if (look === "basedon") {
    return (
      <div className="flex size-full flex-col bg-white p-[7%]">
        <p className="text-[10.5px] font-semibold text-[#9a9bb0]">
          Shot {s.n} · {s.role}
        </p>
        <div className="mt-2 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <div className="flex h-full flex-col">
            <div className="relative flex-1 overflow-hidden rounded-lg">
              <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover" />
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-[#4a4b5c]">Your footage</p>
          </div>
          <ArrowRight className="size-3.5 text-[#9a9bb0]" />
          <div className="flex h-full flex-col">
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-lg border border-dashed border-[#ffb58a] bg-[#fff8f4] p-2 text-center">
              {state === "generating" ? (
                <FriendlyProgress compact />
              ) : state === "failed" ? (
                <p className="text-[10.5px] font-semibold text-[#d0342c]">Didn’t work · Retry</p>
              ) : (
                <p className="text-[11px] font-semibold leading-snug text-[#c2410c]">{s.title}</p>
              )}
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-[#4a4b5c]">New shot</p>
          </div>
        </div>
      </div>
    );
  }

  if (look === "sketch") {
    const p = state === "generating" ? PROGRESS / 100 : 0;
    return (
      <div className="relative size-full bg-white">
        <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover" style={{ filter: "url(#hr-sketch)" }} />
        <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover transition-opacity duration-700" style={{ opacity: p }} />
        <div className="absolute inset-x-3 top-3 flex flex-col items-start gap-1.5">
          <span className="whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#1a1a2e] ring-1 ring-[#e6e7ec]">{meta}</span>
          <StatePill state={state} />
        </div>
      </div>
    );
  }

  if (look === "pixel") {
    const cells = state === "generating" ? 26 : 9;
    return (
      <div className="relative size-full bg-[#1a1a2e]">
        <PixelFrame src={s.refs![0]} cells={cells} className="absolute inset-0 size-full" />
        <div className="absolute inset-x-3 top-3 flex flex-col items-start gap-1.5">
          <span className="whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">{meta}</span>
          <StatePill state={state} dark />
        </div>
      </div>
    );
  }

  if (look === "offline") {
    const failed = state === "failed";
    return (
      <div className="relative flex size-full flex-col justify-between bg-[#1c1c1f] p-[9%] font-mono text-[#d7d8de]">
        <div className="flex items-start justify-between text-[10px] uppercase tracking-[0.08em] text-[#8a8b96]">
          <span>
            Shot 0{s.n}
            <br />
            {s.role}
          </span>
          <span className="text-right tabular-nums">
            00:00:00:00
            <br />
            00:00:02:00
          </span>
        </div>
        <div className="text-center">
          <p className={`text-[15px] font-semibold tracking-[0.12em] ${failed ? "text-[#ff6b6b]" : "text-white"}`}>
            {state === "generating" ? "GENERATING" : failed ? "FAILED" : state === "queued" ? "QUEUED" : "OFFLINE"}
          </p>
          <p className="mt-1.5 text-[10px] text-[#8a8b96]">
            {state === "generating" ? `${PROGRESS}% · about 20s left` : failed ? "Retry from the shot settings" : "Not generated yet"}
          </p>
          {state === "generating" && (
            <span className="mx-auto mt-2.5 block h-[2px] w-24 bg-white/15">
              <span className="block h-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
            </span>
          )}
        </div>
        <p className="text-[10px] tabular-nums text-[#8a8b96]">
          {s.fields?.abbr} · 1080×1920 · {s.len.toFixed(1)}s
        </p>
      </div>
    );
  }

  if (look === "negative") {
    const p = state === "generating" ? PROGRESS / 100 : 0;
    return (
      <div className="relative size-full bg-[#2a1a10] px-[9%]">
        <Sprockets side="left" />
        <Sprockets side="right" />
        <div className="relative size-full overflow-hidden">
          <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover" style={{ filter: "invert(1) sepia(0.55) saturate(1.6) hue-rotate(-18deg) brightness(0.95)" }} />
          <Frame src={s.refs![0]} className="absolute inset-0 size-full object-cover transition-opacity duration-700" style={{ opacity: p }} />
          <div className="absolute inset-x-2 top-3 flex flex-col items-start gap-1.5">
            <span className="whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">{meta}</span>
            <StatePill state={state} dark />
          </div>
        </div>
      </div>
    );
  }

  /* minimal */
  return (
    <div className="grid size-full place-items-center bg-[#f1f2f5] text-center">
      <div>
        <p className="text-[12px] font-semibold tabular-nums text-[#4a4b5c]">{meta}</p>
        <p className="mt-1 text-[11.5px] text-[#9a9bb0]">
          {state === "generating" ? `Generating · ${PROGRESS}%` : state === "failed" ? "Generation failed" : state === "queued" ? "Queued" : "Not generated"}
        </p>
        {state === "generating" && (
          <span className="mx-auto mt-2 block h-[3px] w-24 overflow-hidden rounded-full bg-[#dfe1e7]">
            <span className="block h-full rounded-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

function FriendlyProgress({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-2" : ""}>
      {!compact && <p className="text-[11.5px] font-semibold text-[#1a1a2e]">Creating your shot… {PROGRESS}%</p>}
      <span className={`block h-1.5 overflow-hidden rounded-full bg-[#f1f2f5] ${compact ? "" : "mt-2"}`}>
        <span className="block h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" style={{ width: `${PROGRESS}%` }} />
      </span>
      {!compact && <p className="mt-1.5 text-[10.5px] text-[#9a9bb0]">About 20 seconds left. You can keep editing meanwhile.</p>}
    </div>
  );
}

function FriendlyFailed() {
  return (
    <div className="rounded-xl bg-[#fff5f4] p-3 ring-1 ring-inset ring-[#f3c4c0]">
      <p className="text-[12px] font-semibold text-[#1a1a2e]">This shot didn’t come out right</p>
      <p className="mt-0.5 text-[10.5px] text-[#6a6b7b]">Try again — you won’t be charged twice.</p>
      <span className="mt-2 inline-block rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[11.5px] font-semibold text-white">Try again</span>
    </div>
  );
}

function StatusLine({ state, fallback }: { state: State | "queued"; fallback: React.ReactNode }) {
  if (state === "generating")
    return (
      <div className="mt-4 w-full max-w-[180px]">
        <p className="text-[11px] font-semibold text-[#6a6b7b]">Generating · {PROGRESS}%</p>
        <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-[#dfe1e7]">
          <span className="block h-full rounded-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
        </span>
      </div>
    );
  if (state === "failed")
    return (
      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#d0342c]">
        <AlertCircle className="size-3.5" /> Generation failed · Retry
      </p>
    );
  return <>{fallback}</>;
}

function StatePill({ state, dark = false }: { state: State | "queued"; dark?: boolean }) {
  const base = "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap";
  if (state === "generating")
    return (
      <span className={`${base} ${dark ? "bg-black/45 text-white backdrop-blur" : "bg-white text-[#1a1a2e] ring-1 ring-[#e6e7ec]"}`}>
        <Loader2 className="size-3 animate-spin text-[#ff5e1a]" /> {PROGRESS}%
      </span>
    );
  if (state === "failed")
    return (
      <span className={`${base} bg-[#fff5f4] text-[#d0342c] ring-1 ring-[#f3c4c0]`}>
        <AlertCircle className="size-3" /> Failed · Retry
      </span>
    );
  if (state === "queued")
    return (
      <span className={`${base} ${dark ? "bg-black/45 text-white backdrop-blur" : "bg-white text-[#4a4b5c] ring-1 ring-[#e6e7ec]"}`}>
        <Clock className="size-3" /> Queued
      </span>
    );
  return (
    <span className={`${base} ${dark ? "bg-black/45 text-white/85 backdrop-blur" : "bg-white text-[#6a6b7b] ring-1 ring-[#e6e7ec]"}`}>Not generated</span>
  );
}

/* ──────────────────────────── 时间线片段的各个方案 ──────────────────────────── */

function PendingClip({ look, shot, state }: { look: Look; shot: Shot; state: State | "queued" }) {
  const failedRing = state === "failed" ? "ring-[1.5px] ring-inset ring-[#e5484d]" : "";
  const bar =
    state === "generating" ? (
      <span className="absolute inset-x-0 bottom-0 h-[2px] bg-black/10">
        <span className="block h-full bg-[#ff5e1a]" style={{ width: `${PROGRESS}%` }} />
      </span>
    ) : null;
  const badge = (
    <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded bg-white/90 text-[#4a4b5c] shadow-sm">
      {state === "failed" ? (
        <AlertCircle className="size-2.5 text-[#e5484d]" />
      ) : state === "generating" ? (
        <Loader2 className="size-2.5 animate-spin text-[#ff5e1a]" />
      ) : state === "queued" ? (
        <Clock className="size-2.5" />
      ) : (
        <Video className="size-2.5" />
      )}
    </span>
  );

  if (look === "flat")
    return (
      <span className={`absolute inset-0 flex items-center gap-1.5 bg-[#eef0f3] px-2 text-[10.5px] font-semibold text-[#4a4b5c] ring-1 ring-inset ring-[#e1e3e8] ${failedRing}`}>
        {state === "failed" ? <AlertCircle className="size-3 text-[#e5484d]" /> : <Video className="size-3 text-[#6a6b7b]" />}
        <span className="truncate">{state === "generating" ? `Generating ${PROGRESS}%` : state === "failed" ? "Failed" : "Not generated"}</span>
        {bar}
      </span>
    );

  if (look === "refs" || look === "reveal") {
    const reveal = look === "reveal" && state === "generating";
    return (
      <span className={`absolute inset-0 bg-[#e9ebef] ${failedRing}`}>
        <Frame src={shot.refs![0]} className="absolute inset-0 size-full object-cover opacity-45 grayscale" />
        {reveal && (
          <span className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - PROGRESS}% 0 0)` }}>
            <Frame src={shot.refs![0]} className="size-full object-cover" />
          </span>
        )}
        {badge}
        {look === "refs" && bar}
      </span>
    );
  }

  if (look === "index")
    return (
      <span className={`absolute inset-0 flex flex-col justify-center bg-white px-2 ring-1 ring-inset ring-[#dfe1e7] ${failedRing}`}>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold leading-none tabular-nums">0{shot.n}</span>
          <span className="text-[10px] font-semibold tracking-[0.04em] text-[#9a9bb0]">{shot.fields?.abbr}</span>
        </span>
        <span className="mt-1 truncate text-[10px] text-[#6a6b7b]">
          {state === "generating" ? `Generating ${PROGRESS}%` : state === "failed" ? "Failed · Retry" : state === "queued" ? "Queued" : "Not generated"}
        </span>
        {bar}
      </span>
    );

  if (look === "plainclip")
    return (
      <span className={`absolute inset-0 flex flex-col justify-center gap-0.5 bg-[#fff8f4] px-2 ring-1 ring-inset ring-[#ffd9c2] ${failedRing}`}>
        <span className="truncate text-[10.5px] font-semibold text-[#1a1a2e]">{shot.title}</span>
        <span className="truncate text-[9.5px] text-[#c2410c]">
          {state === "generating" ? `Creating… ${PROGRESS}%` : state === "failed" ? "Didn’t work · Retry" : state === "queued" ? "Up next" : "Not created yet"}
        </span>
        {state === "generating" && (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#ffe6d6]">
            <span className="block h-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" style={{ width: `${PROGRESS}%` }} />
          </span>
        )}
      </span>
    );

  if (look === "steps")
    return (
      <span className={`absolute inset-0 flex flex-col justify-center gap-0.5 bg-white px-2 ring-1 ring-inset ring-[#e1e3e8] ${failedRing}`}>
        <span className="truncate text-[10.5px] font-semibold">{shot.title}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                state === "generating" ? (i === 0 ? "bg-[#1f9d6b]" : i === 1 ? "bg-[#ff5e1a]" : "bg-[#eceef2]") : state === "failed" && i === 1 ? "bg-[#e5484d]" : state === "failed" && i === 0 ? "bg-[#1f9d6b]" : "bg-[#eceef2]"
              }`}
            />
          ))}
        </span>
      </span>
    );

  if (look === "sketch")
    return (
      <span className={`absolute inset-0 bg-white ring-1 ring-inset ring-[#e1e3e8] ${failedRing}`}>
        <Frame src={shot.refs![0]} className="absolute inset-0 size-full object-cover" style={{ filter: "url(#hr-sketch)" }} />
        {state === "generating" && <Frame src={shot.refs![0]} className="absolute inset-0 size-full object-cover" style={{ opacity: PROGRESS / 100 }} />}
        {badge}
        {bar}
      </span>
    );

  if (look === "pixel")
    return (
      <span className={`absolute inset-0 bg-[#1a1a2e] ${failedRing}`}>
        <PixelFrame src={shot.refs![0]} cells={state === "generating" ? 14 : 5} className="absolute inset-0 size-full" />
        {badge}
      </span>
    );

  if (look === "offline")
    return (
      <span className={`absolute inset-0 flex flex-col justify-center bg-[#1c1c1f] px-2 font-mono ${failedRing}`}>
        <span className="text-[10px] font-semibold tracking-[0.1em] text-white">
          0{shot.n} {state === "generating" ? `${PROGRESS}%` : state === "failed" ? "FAILED" : state === "queued" ? "QUEUED" : "OFFLINE"}
        </span>
        <span className="mt-0.5 text-[9px] text-[#8a8b96]">{shot.fields?.abbr}</span>
        {bar}
      </span>
    );

  if (look === "negative")
    return (
      <span className={`absolute inset-0 bg-[#2a1a10] py-[7px] ${failedRing}`}>
        <span className="absolute inset-x-0 top-[2px] h-[3px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #f5e6d8 0 3px, transparent 3px 8px)" }} />
        <span className="absolute inset-x-0 bottom-[2px] h-[3px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #f5e6d8 0 3px, transparent 3px 8px)" }} />
        <span className="relative block size-full overflow-hidden">
          <Frame src={shot.refs![0]} className="absolute inset-0 size-full object-cover" style={{ filter: "invert(1) sepia(0.55) saturate(1.6) hue-rotate(-18deg)" }} />
          {state === "generating" && <Frame src={shot.refs![0]} className="absolute inset-0 size-full object-cover" style={{ opacity: PROGRESS / 100 }} />}
        </span>
        {badge}
      </span>
    );

  /* slot */
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center rounded-[6px] border border-dashed text-[12px] font-semibold tabular-nums ${
        state === "failed" ? "border-[#e5484d] text-[#e5484d]" : "border-[#c9cad4] text-[#9a9bb0]"
      }`}
    >
      {state === "generating" ? <RefreshCw className="size-3.5 animate-spin text-[#ff5e1a]" /> : `0${shot.n}`}
      {bar}
    </span>
  );
}
