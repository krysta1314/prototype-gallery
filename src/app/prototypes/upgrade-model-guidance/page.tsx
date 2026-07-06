"use client";

import { useState } from "react";
import { ArrowUp, Plus, Lock, X } from "lucide-react";

// ── design.md brand tokens ────────────────────────────────────────
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const ORANGE = "#ff5e1a";
const INK = "#1a1a2e";
const SUB = "#6a6b7b";

// Apple system font stack (project standard, see design.md §2)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

type Outcome = null | "switched";
type Plan = "free" | "starter";

/**
 * 身份感知场景:用户当前套餐 → 请求的锁定模型、需升到的套餐、
 * 以及当前套餐内「可切换继续」的模型(Free 是免费模型;Starter 是套餐已含)。
 * 数据来自模型可用性表(Free 仅 Seedream 系列可用;Starter 仅 Seedance 2.0 锁)。
 */
const SCENARIO: Record<
  Plan,
  {
    label: string;
    lockedModel: string;
    upgradeTo: string;
    /** 次要按钮/链接指向的单个模型 */
    fallbackModel: string;
    /** 说明文案里列出的「可继续使用」的模型(Free 有两个免费模型) */
    continueModels: string;
    /** free = 免费模型(Free 套餐);included = 当前套餐已包含(Starter) */
    fallbackKind: "free" | "included";
  }
> = {
  free: {
    label: "Free",
    lockedModel: "GPT-image-2",
    upgradeTo: "Starter",
    fallbackModel: "Seedream 5.0 lite",
    continueModels: "5.0 lite",
    fallbackKind: "free",
  },
  starter: {
    label: "Starter",
    lockedModel: "Seedance 2.0",
    upgradeTo: "Pro",
    fallbackModel: "Seedance 2.0 Fast",
    continueModels: "Seedance 2.0 Fast",
    fallbackKind: "included",
  },
};

// ── small pieces ──────────────────────────────────────────────────

/** 左侧头像 + 右侧内容的 agent 消息行 */
function AgentRow({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

// ── page ──────────────────────────────────────────────────────────
export default function UpgradeModelGuidance() {
  const [plan, setPlan] = useState<Plan>("free");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [showSub, setShowSub] = useState(false);
  const scenario = SCENARIO[plan];

  function switchPlan(p: Plan) {
    setPlan(p);
    setOutcome(null);
    setShowSub(false);
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-white text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* 顶部演示控制条(中文,非产品 UI) */}
      <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-[#ececf1] bg-white/85 px-5 py-3 backdrop-blur">
        {/* 演示身份切换(中文,非产品 UI) */}
        <div className="flex items-center rounded-full border border-[#ececf1] bg-[#faf8f6] p-1">
          {(["free", "starter"] as Plan[]).map((p) => (
            <button
              key={p}
              onClick={() => switchPlan(p)}
              className={
                "rounded-full px-3.5 py-1.5 text-[13px] font-bold transition " +
                (plan === p
                  ? "bg-[#1a1a2e] text-white"
                  : "text-[#6a6b7b] hover:text-[#1a1a2e]")
              }
            >
              {p === "free" ? "Free 用户" : "Starter 用户"}
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

          {/* 点击「Switch…」后新增的用户消息气泡(在 agent 确认之前) */}
          {outcome === "switched" && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-[#f1f1f4] px-4 py-2.5 text-[15px] font-medium text-[#1a1a2e]">
                switch model to {scenario.fallbackModel}
              </div>
            </div>
          )}

          {/* 升级引导(主:升级套餐;次:切换可用模型继续)— 随身份变化 */}
          <AfterMessage
            scenario={scenario}
            outcome={outcome}
            onSwitch={() => setOutcome("switched")}
            onUpgrade={() => setShowSub(true)}
          />
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

      {/* 点击 Upgrade 弹出订阅弹窗(占位,标题身份感知) */}
      {showSub && (
        <SubscribeModal
          title={`Upgrade to use ${scenario.lockedModel}`}
          onClose={() => setShowSub(false)}
        />
      )}
    </div>
  );
}

// ── 订阅弹窗(占位:真正的订阅/定价 UI 由独立原型负责) ─────────────
function SubscribeModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#14141f]/55 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(15,15,25,0.3)] motion-safe:animate-in motion-safe:zoom-in-95"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f7f6f9] hover:text-[#6a6b7b]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid aspect-[5/3] place-items-center rounded-2xl border-2 border-dashed border-[#d4d3df] bg-[#fbfbfc] text-center text-[14px] font-semibold text-[#9a9bb0]">
          这里弹出订阅弹窗
        </div>
      </div>
    </div>
  );
}

// ── 升级引导卡(Claude 用量到限风格:主升级套餐、次切换可用模型) ────
// 克制的系统提示卡:中性底 + 小锁图标锚点 + 实色主按钮 + 安静次按钮。
function AfterMessage({
  scenario,
  outcome,
  onSwitch,
  onUpgrade,
}: {
  scenario: (typeof SCENARIO)[Plan];
  outcome: Outcome;
  onSwitch: () => void;
  onUpgrade: () => void;
}) {
  const { label, lockedModel, upgradeTo, fallbackModel, continueModels, fallbackKind } =
    scenario;
  const isFree = fallbackKind === "free";
  const switchLabel = `Switch to ${fallbackModel}`;

  // 点击切换后不再显示 agent 确认态,只保留用户气泡(引导卡收起)
  if (outcome === "switched") return null;

  return (
    <AgentRow>
      <div className="rounded-2xl border border-[#ececf1] bg-[#fbfbfc] p-5">
        <div className="flex gap-3">
          <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#fff3ec] text-[#ff5e1a]">
            <Lock className="size-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#1a1a2e]">
              {lockedModel} isn&apos;t available on the {label} plan
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6a6b7b]">
              Upgrade to {upgradeTo} plan to keep generating, or continue right
              away with {continueModels}
              {isFree ? ", free on your plan." : ", already on your plan."}
            </p>
            <div className="mt-3.5 flex flex-col items-start gap-3">
              <button
                onClick={onUpgrade}
                className={`inline-flex items-center rounded-lg ${ctaGrad} px-4 py-2 text-[14px] font-bold text-white transition hover:brightness-105`}
              >
                Upgrade to {upgradeTo}
              </button>
              <button
                onClick={onSwitch}
                className="text-[13px] font-semibold text-[#1a1a2e] underline-offset-2 transition hover:underline"
              >
                {switchLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AgentRow>
  );
}
