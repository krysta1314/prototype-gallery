"use client";

import { useState } from "react";
import {
  Sparkles,
  Lock,
  ArrowRight,
  ArrowUp,
  Plus,
  Zap,
  Check,
  Loader2,
  Crown,
} from "lucide-react";

// ── design.md brand tokens ────────────────────────────────────────
const ctaGrad = "bg-gradient-to-br from-[#FFA73C] to-[#FF5255]";
const ORANGE = "#ff5e1a";
const INK = "#1a1a2e";
const SUB = "#6a6b7b";

// Apple system font stack (project standard, see design.md §2)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

type Variant = "before" | "after";
type Outcome = null | "switched" | "upgrading";

// ── small pieces ──────────────────────────────────────────────────
function AgentAvatar() {
  return (
    <div
      className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${ctaGrad} shadow-[0_4px_12px_rgba(255,82,85,0.28)]`}
    >
      <Sparkles className="size-4 text-white" strokeWidth={2.2} />
    </div>
  );
}

/** 左侧头像 + 右侧内容的 agent 消息行 */
function AgentRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <AgentAvatar />
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────
export default function UpgradeModelGuidance() {
  const [variant, setVariant] = useState<Variant>("after");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [toast, setToast] = useState<string | null>(null);

  function switchVariant(v: Variant) {
    setVariant(v);
    setOutcome(null);
    setToast(null);
  }

  function fireToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-white text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* 顶部演示控制条(中文,非产品 UI) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#ececf1] bg-white/85 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className={`grid size-7 place-items-center rounded-lg ${ctaGrad}`}>
            <Sparkles className="size-3.5 text-white" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-[#1a1a2e]">
              Confirm 后 · 升级引导优化
            </p>
            <p className="text-[11px] text-[#6a6b7b]">
              加背景色 + 高亮「换 Seedream 免费继续」
            </p>
          </div>
        </div>

        <div className="flex items-center rounded-full border border-[#ececf1] bg-[#faf8f6] p-1">
          {(["before", "after"] as Variant[]).map((v) => (
            <button
              key={v}
              onClick={() => switchVariant(v)}
              className={
                "rounded-full px-3.5 py-1.5 text-[13px] font-bold transition " +
                (variant === v
                  ? `${ctaGrad} text-white shadow-[0_6px_16px_rgba(255,82,85,0.28)]`
                  : "text-[#6a6b7b] hover:text-[#1a1a2e]")
              }
            >
              {v === "before" ? "改版前" : "改版后"}
            </button>
          ))}
        </div>
      </header>

      {/* 对话区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] space-y-6 px-5 py-8">
          {/* 上下文:agent 给出创意方向 */}
          <AgentRow>
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
          </AgentRow>

          {/* 用户回复 */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md bg-[#f1f1f4] px-4 py-2.5 text-[15px] font-medium text-[#1a1a2e]">
              confirm, route 1
            </div>
          </div>

          {/* 升级引导:改版前 / 改版后 */}
          {variant === "before" ? (
            <BeforeMessage />
          ) : (
            <AfterMessage
              outcome={outcome}
              onSwitch={() => setOutcome("switched")}
              onUpgrade={() => {
                setOutcome("upgrading");
                fireToast("Opening plan upgrade…");
              }}
            />
          )}
        </div>
      </main>

      {/* 底部 composer(产品外壳,占位) */}
      <div className="border-t border-[#ececf1] bg-white px-5 py-3">
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

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1a1a2e] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_16px_36px_rgba(26,26,46,0.24)]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── 改版前:纯文字,无背景,只有升级一条路(还原截图) ─────────────────
function BeforeMessage() {
  return (
    <AgentRow>
      <div className="space-y-3 text-[15px] leading-relaxed text-[#1a1a2e]">
        <p>
          It looks like the model required for this high-quality creative is part
          of the <span className="font-bold">Starter</span> plan. Please upgrade
          your plan to continue with this generation.
        </p>
        <p>Once you&apos;ve upgraded, let me know and I&apos;ll kick off the process!</p>
      </div>
    </AgentRow>
  );
}

// ── 改版后:加背景色卡片 + 高亮「换 Seedream 免费继续」 ───────────────
function AfterMessage({
  outcome,
  onSwitch,
  onUpgrade,
}: {
  outcome: Outcome;
  onSwitch: () => void;
  onUpgrade: () => void;
}) {
  if (outcome === "switched") {
    return (
      <AgentRow>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-[#ffddc7] bg-[#fff7f1] px-4 py-3">
            <div className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5e1a]">
              <Check className="size-3.5 text-white" strokeWidth={3} />
            </div>
            <p className="text-[15px] font-semibold text-[#1a1a2e]">
              Switched to Seedream ·{" "}
              <span className="text-[#ff5e1a]">Free</span>
            </p>
          </div>
          <div className="flex items-center gap-2 pl-1 text-[14px] text-[#6a6b7b]">
            <Loader2 className="size-4 animate-spin text-[#ff5e1a]" />
            Kicking off Route 1 on Seedream now. No upgrade needed.
          </div>
        </div>
      </AgentRow>
    );
  }

  return (
    <AgentRow>
      {/* 这块卡片背景色就是「把这段文字背后的背景颜色改成其他颜色」 */}
      <div className="overflow-hidden rounded-2xl border border-[#ffddc7] bg-[#fff7f1] shadow-[0_4px_16px_rgba(255,94,26,0.08)]">
        <div className="space-y-4 p-5">
          {/* 现有升级提示(保留) */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[#ff5e1a] shadow-[0_2px_6px_rgba(26,26,46,0.06)]">
              <Lock className="size-3.5" strokeWidth={2.2} />
            </div>
            <p className="text-[15px] leading-relaxed text-[#1a1a2e]">
              The model behind this high-quality creative is part of the{" "}
              <span className="font-bold">Starter</span>{" "}
              plan, so I can&apos;t run it on your current plan.
            </p>
          </div>

          {/* 新增:高亮的「换模型免费继续」提示句 */}
          <div className="flex items-start gap-2.5 rounded-xl border-l-[3px] border-[#ff5e1a] bg-[#fff3ec] py-3 pl-3 pr-4">
            <Zap
              className="mt-0.5 size-4 shrink-0 text-[#ff5e1a]"
              strokeWidth={2.4}
              fill="#ff5e1a"
            />
            <p className="text-[15px] leading-relaxed text-[#1a1a2e]">
              No upgrade needed to keep going. Switch to{" "}
              <span className="font-bold">Seedream</span>, our{" "}
              <span className="font-bold text-[#ff5e1a]">free</span>{" "}
              image model, and I&apos;ll generate Route 1 for you right away.
            </p>
          </div>

          {/* 两条出路:换模型(高亮主按钮) + 升级(次按钮) */}
          <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row">
            <button
              onClick={onSwitch}
              className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-xl ${ctaGrad} px-5 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_30px_rgba(255,82,85,0.38)]`}
            >
              Switch to Seedream
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                Free
              </span>
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={onUpgrade}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ffcbaa] bg-white px-5 py-3 text-[15px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
            >
              <Crown className="size-4 text-[#ff5e1a]" strokeWidth={2.2} />
              Upgrade to Starter
            </button>
          </div>
        </div>
      </div>
    </AgentRow>
  );
}
