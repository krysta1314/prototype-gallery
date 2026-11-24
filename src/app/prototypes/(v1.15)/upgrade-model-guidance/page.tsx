"use client";

import { ArrowUp, Plus, Play } from "lucide-react";

// ── design.md brand tokens ────────────────────────────────────────
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";

// 生成结果占位素材(图片 / 视频封面共用)
const MEDIA_SRC =
  "https://assets.presslogic.com/buzzvideo/users/system-gemini-generate/2026-07-06/332441088264560640.jpg";

// Apple system font stack (project standard, see design.md §2)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ── page ──────────────────────────────────────────────────────────
export default function UpgradeModelGuidance() {
  return (
    <div
      className="flex min-h-screen flex-col bg-white text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* 对话区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] space-y-6 px-5 py-8">
          {/* 上下文:agent 给出创意方向 */}
          <div className="min-w-0">
            <div className="space-y-2.5 text-[15px] leading-relaxed text-[#1a1a2e]">
              <p className="font-bold">Route 3: The Modern Classic</p>
              <p className="text-[#3a3a4d]">
                <span className="font-semibold">Central insight:</span>{" "}
                While other brands chase trends, the red heel stays the one
                constant in a woman&apos;s wardrobe.
              </p>
              <p className="text-[#3a3a4d]">
                <span className="font-semibold">Tagline candidates:</span>{" "}
                Always Red. Always Right. / The Only Constant. / Beyond the
                Trend.
              </p>
              <p className="pt-1 text-[#3a3a4d]">
                Please review the directions above, then reply{" "}
                <span className="font-bold">&quot;confirm&quot;</span>{" "}
                with the route number you prefer (e.g., &quot;Confirm Route 1&quot;), or
                let me know if you&apos;d like any specific edits.
              </p>
            </div>
          </div>

          {/* 用户回复 */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md bg-[#f1f1f4] px-4 py-2.5 text-[15px] font-medium text-[#1a1a2e]">
              confirm, route 1
            </div>
          </div>

          {/* agent 生成结果:4 张 1:1 图片 */}
          <div className="min-w-0">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={MEDIA_SRC}
                  alt={`Route 1 generation ${i + 1}`}
                  className="aspect-square w-full rounded-2xl object-cover shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
                />
              ))}
            </div>

            {/* upsell:低质模型生成后引导升级换更高质量模型(克制、产品原生) */}
            <p className="mt-4 text-[14px] leading-relaxed text-[#6a6b7b]">
              Upgrade to generate higher quality and more accurate text
              rendering image.{" "}
              <button className="font-semibold text-[#ff5e1a] transition hover:opacity-80">
                Upgrade
              </button>
            </p>
          </div>

          {/* 用户要求转成视频 */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md bg-[#f1f1f4] px-4 py-2.5 text-[15px] font-medium text-[#1a1a2e]">
              now turn route 1 into a video
            </div>
          </div>

          {/* agent 生成结果:4 段视频(封面 + 播放按钮) */}
          <div className="min-w-0">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
                >
                  <img
                    src={MEDIA_SRC}
                    alt={`Route 1 video ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid size-9 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
                      <Play className="size-4 text-white" fill="white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* upsell:视频同样引导升级获得更好效果 */}
            <p className="mt-4 text-[14px] leading-relaxed text-[#6a6b7b]">
              Upgrade to generate higher quality video with smoother, cinematic
              motion.{" "}
              <button className="font-semibold text-[#ff5e1a] transition hover:opacity-80">
                Upgrade
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* 底部 composer(产品外壳,占位) */}
      <div className="bg-white px-5 py-3">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-2 rounded-2xl border border-[#ececf1] bg-[#faf8f6] px-3 py-2">
          <button className="grid size-8 shrink-0 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-white hover:text-[#1a1a2e]">
            <Plus className="size-4.5" />
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#1a1a2e] outline-none placeholder:text-[#9a9aa8]"
            placeholder="Reply to continue…"
          />
          <button
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${ctaGrad} text-white`}
          >
            <ArrowUp className="size-4.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
