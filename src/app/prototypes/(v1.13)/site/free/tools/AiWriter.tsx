"use client";

/* AI 写作类免费工具(Hook / 脚本 / 广告文案 / TikTok 文案)的首屏表单(2026-11-19)。
   PM 定：浏览器里跑不了的不假装生成 —— 表单收集产品 + 受众，拼成提示词，带着它打开产品里的 Marketing Agent。
   页面上不说文字生成免费 / 无限，只说 Marketing Agent 在 Free 套餐里可用、注册送积分(积分能用在哪写清楚)。 */

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { appOf } from "../../../site-nav/SiteNavHeader";
import { SIGNUP_CREDITS } from "../../tools/credits";
import { BTN, Seg, ToolPanel } from "../ui";

export type WriterSpec = {
  /** 第三个选项(语气 / 平台 / 时长) */
  option: { label: string; values: string[] };
  build: (v: { product: string; audience: string; option: string; extra: string }) => string;
  productHint: string;
  audienceHint: string;
  extraLabel: string;
  extraHint: string;
  cta: string;
};

/** Marketing Agent 的产品网址:appOf("/marketing-agent") 去掉它自带的 prompt,再拼 &prompt=encodeURIComponent(简报) */
export function agentUrl(prompt: string) {
  const base = (appOf("/marketing-agent") ?? "/prototypes/video-gen-modes/home?type=marketing").replace(/([?&])prompt=[^&]*&?/, "$1").replace(/[?&]$/, "");
  return `${base}${base.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(prompt)}`;
}

export function AiWriter({ spec }: { spec: WriterSpec }) {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [extra, setExtra] = useState("");
  const [option, setOption] = useState(spec.option.values[0]);
  const [touched, setTouched] = useState(false);
  const missing = !product.trim();
  const prompt = spec.build({ product: product.trim() || "[your product]", audience: audience.trim() || "[your audience]", option, extra: extra.trim() });

  const field = "mt-1.5 w-full rounded-[12px] bg-white/[0.06] px-4 py-3 text-[15px] text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#FF744D]";
  return (
    <ToolPanel>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (missing) return;
          window.location.href = agentUrl(prompt);
        }}
        className="grid gap-6 md:grid-cols-[1fr_1fr]"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-[13px] font-semibold text-[#CACACA]">Product or offer *</span>
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder={spec.productHint} aria-invalid={touched && missing} className={field} />
            {touched && missing && <span className="mt-1.5 block text-[12.5px] text-[#FFF3EC]">Add your product so the agent knows what to write about.</span>}
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#CACACA]">Audience</span>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder={spec.audienceHint} className={field} />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#CACACA]">{spec.extraLabel}</span>
            <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={spec.extraHint} className={field} />
          </label>
          <Seg label={spec.option.label} value={option} onChange={setOption} options={spec.option.values.map((v) => ({ value: v, label: v }))} />
        </div>
        <div className="flex flex-col">
          <p className="text-[13px] font-semibold text-[#CACACA]">Brief sent to the Marketing Agent</p>
          <p className="mt-1.5 flex-1 whitespace-pre-wrap rounded-[14px] bg-white/[0.04] p-4 text-[14px] leading-relaxed text-white/85 ring-1 ring-white/[0.08]">{prompt}</p>
          <button type="submit" className={`${BTN} mt-4 w-full`}>
            {spec.cta} <ArrowUpRight className="size-4" />
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-[#9F9F9F]">
            Opens BuzzVideo&apos;s Marketing Agent with this brief filled in. Sign-up is free and new accounts get {SIGNUP_CREDITS} credits.
          </p>
        </div>
      </form>
    </ToolPanel>
  );
}
