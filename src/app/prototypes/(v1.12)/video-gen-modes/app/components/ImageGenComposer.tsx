"use client";

/* 首页 Image Gen 输入框(照真实产品:左上「+」上传参考图，提示词，底栏 [Image Gen][模型][条数] … [积分][Create])。
   2026-11-05:侧边栏 Image 里跳 Agent 的项(Text to Image、Image Edit、Remove Background、Product Photography、Relight、Image Face Swap)
   都进这里并预填提示词，选中第一个 [占位]。点 Create 之后的交互不在本需求范围，只弹提示。 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { firstPlaceholder } from "@/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import type { Asset } from "../assets";
import { AssetPicker, AssetThumb } from "./AssetPicker";
import { CountMenu, companyHeading } from "./BarMenus";
import { MenuItem, Pill } from "./Popover";

const homeCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

/** 产品里的图片模型(名字照 BuzzVideo 模型列表;积分为示意) */
export const IMAGE_MODELS: { key: string; company: string; label: string; icon: string; credits?: number }[] = [
  { key: "gpt-image-2", company: "OpenAI", label: "GPT-image-2", icon: "/prototypes/agent-llm-picker/icons/openai.svg", credits: 4 },
  { key: "gpt-image-2.6-flare", company: "OpenAI", label: "GPT Image 2.6 Flare", icon: "/prototypes/agent-llm-picker/icons/openai.svg", credits: 10 },
  { key: "gpt-image-2.6-sunburst", company: "OpenAI", label: "GPT Image 2.6 Sunburst", icon: "/prototypes/agent-llm-picker/icons/openai.svg", credits: 18 },
  { key: "gpt-image-2.5-sunburst", company: "OpenAI", label: "GPT Image 2.5 Sunburst", icon: "/prototypes/agent-llm-picker/icons/openai.svg", credits: 15 },
  { key: "nano-banana-2", company: "Google", label: "Nano Banana 2", icon: "/prototypes/agent-llm-picker/icons/gemini.svg", credits: 6 },
  { key: "seedream-5-pro", company: "ByteDance", label: "Seedream 5.0 Pro", icon: "/prototypes/starter-guide/icons/bytedance.svg", credits: 5 },
  /* 2026-11-26 官网每个模型落地页的按钮都要进生成器并选中这个模型 —— 补上有落地页、这里还没有的 11 个图片模型(加在最后，默认仍是 GPT-image-2)。
     名字 / 厂商照 models-catalog;积分 = 线上定价接口(site/models/pricing-live.json)最低一档,Seedream 5.5 用 UAT 报价(1K 4 积分);
     FLUX 3 Image、Muse Image、MAI-Image-2.5、Qwen Image 3.0 接口里还没有价，积分不写(显示 —) */
  { key: "nano-banana-2.1", company: "Google", label: "Nano Banana 2.1", icon: "/prototypes/agent-llm-picker/icons/gemini.svg", credits: 7 },
  { key: "nano-banana-pro", company: "Google", label: "Nano Banana Pro", icon: "/prototypes/agent-llm-picker/icons/gemini.svg", credits: 27 },
  { key: "nano-banana", company: "Google", label: "Nano Banana", icon: "/prototypes/agent-llm-picker/icons/gemini.svg", credits: 8 },
  { key: "seedream-5.5", company: "ByteDance", label: "Seedream 5.5", icon: "/prototypes/starter-guide/icons/bytedance.svg", credits: 4 },
  { key: "seedream-4.5", company: "ByteDance", label: "Seedream 4.5", icon: "/prototypes/starter-guide/icons/bytedance.svg", credits: 8 },
  { key: "gpt-image-2.5-flare", company: "OpenAI", label: "GPT Image 2.5 Flare", icon: "/prototypes/agent-llm-picker/icons/openai.svg", credits: 1 },
  { key: "grok-imagine-2.0", company: "xAI", label: "Grok Imagine Image 2.0", icon: "/prototypes/video-gen-modes/icons/grok.svg", credits: 8 },
  { key: "flux-3-image", company: "Black Forest Labs", label: "FLUX 3 Image", icon: "/prototypes/video-gen-modes/icons/flux.svg" },
  { key: "muse-image", company: "Meta", label: "Muse Image", icon: "/prototypes/site/logos/muse-color.svg" },
  { key: "mai-image-2.5", company: "Microsoft", label: "MAI-Image-2.5", icon: "/prototypes/site/logos/microsoft-color.svg" },
  { key: "qwen-image-3.0", company: "Alibaba", label: "Qwen Image 3.0", icon: "/prototypes/agent-llm-picker/icons/qwen.png" },
];

export function ImageGenComposer({
  prompt,
  onPrompt,
  selectKey,
  leading,
  notify,
  onCreate,
  initialModel,
}: {
  /** 打开时选中的模型(官网 Header 点某个图片模型进来，2026-11-19) */
  initialModel?: string;
  /** 点 Create:传了就交给外层(v1.16 Design Studio 出图片结果卡);不传 = 只弹 toast */
  onCreate?: (prompt: string, count: number) => void;
  prompt: string;
  onPrompt: (p: string) => void;
  /** 变了就聚焦并选中第一个 [占位](从侧边栏预填进来时) */
  selectKey?: string;
  leading: ReactNode;
  notify: (t: string) => void;
}) {
  const [files, setFiles] = useState<Asset[]>([]);
  const [model, setModel] = useState(() => IMAGE_MODELS.find((m) => m.key === initialModel) ?? IMAGE_MODELS[0]);
  const [count, setCount] = useState(1);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectKey || !area.current) return;
    const el = area.current;
    const r = firstPlaceholder(el.value) ?? [el.value.length, el.value.length];
    el.focus();
    el.setSelectionRange(r[0], r[1]);
  }, [selectKey]);

  /* 还没有定价依据的模型显示 — */
  const credits = model.credits !== undefined ? model.credits * count : "—";
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
          <AssetPicker
            accept={["image"]}
            multiple
            placement="down"
            uploadHint="Support JPG, PNG, WEBP"
            onPick={(a) => setFiles((f) => [...f, ...a])}
            trigger={(open, isOpen) => (
              <button type="button" onClick={open} aria-label="Upload reference images" className={`grid size-[56px] place-items-center rounded-xl border transition ${isOpen ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]" : "border-transparent bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"}`}>
                <Plus className="size-5" />
              </button>
            )}
          />
        </div>
        <textarea
          ref={area}
          value={prompt}
          onChange={(e) => onPrompt(e.target.value)}
          aria-label="Prompt"
          rows={4}
          placeholder='Describe the image you want to create, or upload references. Use "@" to mention them.'
          className="min-w-0 flex-1 resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {leading}
        <Pill
          ariaLabel="Image model"
          placement="down"
          width={260}
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={model.icon} alt="" className="size-4 object-contain" />
          }
          label={model.label}
        >
          {(close) => (
            <>
              {/* 2026-11-18 Monica:按公司分组，公司按 A–Z 排(样式同视频模型下拉) */}
              {[...new Set(IMAGE_MODELS.map((m) => m.company))].sort((a, b) => a.localeCompare(b)).map((c, gi) => (
                <div key={c} role="group" aria-label={c}>
                  <p className={`${companyHeading} ${gi > 0 ? "mt-1.5" : ""}`}>{c}</p>
                  {IMAGE_MODELS.filter((m) => m.company === c).map((m) => (
                    <MenuItem
                      key={m.key}
                      selected={m.key === model.key}
                      onClick={() => (setModel(m), close())}
                      // eslint-disable-next-line @next/next/no-img-element
                      icon={<img src={m.icon} alt="" className="size-4 object-contain" />}
                      label={m.label}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </Pill>
        <CountMenu value={count} onChange={setCount} placement="down" />
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]">
            <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
            {credits}
          </span>
          <button type="button" disabled={!prompt.trim() && !files.length} onClick={() => (onCreate ? onCreate(prompt, count) : notify(count > 1 ? `${count} images are generating` : "Your image is generating"))} className={homeCta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
