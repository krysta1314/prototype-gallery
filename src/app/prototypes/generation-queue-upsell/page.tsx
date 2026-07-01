"use client";

import { useEffect, useState } from "react";
import { Pencil, RotateCw, Zap, Clock, X, Check } from "lucide-react";

type Plan = "free" | "starter" | "pro" | "ultra";
const PLANS: Plan[] = ["free", "starter", "pro", "ultra"];
const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  ultra: "Ultra",
};
const CARD_COUNT = 4;

/** Processing Speed 只有两档:Standard(仅 Free)/ Fast(Starter/Pro/Ultra)。
 *  Fast 档不排队、不显示角标、不显示升级引导。 */
const isFast = (p: Plan) => p !== "free";

/** 仅 Standard 档(Free)显示升级引导,引导升到 Fast */
type StandardPlan = "free";
const UPSELL_COPY: Record<StandardPlan, { benefit: string; cta: string }> = {
  free: {
    benefit: "You're on Standard speed. Upgrade to Fast and skip the wait.",
    cta: "Upgrade to skip the queue",
  },
};

/* ---------- 演示控制条上的套餐 Chip ---------- */
function PlanChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-3 py-1.5 text-[13px] font-bold transition " +
        (active
          ? "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.28)]"
          : "border border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]")
      }
    >
      {children}
    </button>
  );
}

/* ---------- 底部工具条上的胶囊按钮 ---------- */
function ToolPill({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6]">
      {children}
    </button>
  );
}

/* ---------- 单张生成中卡片:暖橙渐变动画 + 排队角标 + 画布内升级入口 ---------- */
function GeneratingCard({
  queued,
  skipChip,
  onUpgrade,
}: {
  queued: boolean;
  /** Canvas UI:卡片左下角的「Skip the queue」升级入口 */
  skipChip?: boolean;
  onUpgrade?: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
      <div
        className="gen-anim absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(255,219,179,0.95) 0%, rgba(255,179,180,0.9) 25%, rgba(255,219,179,0.95) 50%)",
          backgroundSize: "200% 200%",
        }}
      />
      <div className="absolute left-2.5 top-2.5 inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#868686]">
        Generating
        <span className="gen-dot">.</span>
        <span className="gen-dot">.</span>
        <span className="gen-dot">.</span>
      </div>
      {queued && skipChip && (
        <button
          onClick={onUpgrade}
          className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[11px] font-bold text-[#ff5e1a] shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          <Zap className="size-3" />
          Upgrade to skip the queue
        </button>
      )}
    </div>
  );
}

/* ---------- 画布节点:标题 + 端口 + 生成卡(尺寸与 Agent 卡一致) ----------
   升级入口统一为卡片左下角的「Upgrade to skip the queue」胶囊 */
function CanvasNode({
  label,
  queued,
  onUpgrade,
}: {
  label: string;
  queued: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="w-[210px]">
      <div className="mb-2 text-[13px] font-semibold text-[#6a6b7b]">
        {label}
      </div>
      <div className="relative">
        <GeneratingCard queued={queued} skipChip onUpgrade={onUpgrade} />

        {/* 左右连接端口 */}
        <span className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-[#c9c8d2] bg-white" />
        <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-[#c9c8d2] bg-white" />
      </div>
    </div>
  );
}

/* ---------- 内联排队 + 升级加速条(非 Ultra,无弹窗)---------- */
function QueueUpsellBar({
  plan,
  onUpgrade,
}: {
  plan: StandardPlan;
  onUpgrade: () => void;
}) {
  const { benefit, cta } = UPSELL_COPY[plan];
  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-[#9a9aa8]">
      <Clock className="size-3.5 shrink-0 text-[#6a6b7b]" />
      <span className="font-medium text-[#6a6b7b]">{benefit}</span>
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-1 font-bold text-[#ff5e1a] transition hover:opacity-80"
      >
        <Zap className="size-3.5" />
        {cta}
      </button>
    </div>
  );
}

/* ---------- 订阅弹窗(点击升级后弹出,定价卡样式)---------- */
const PRICING_PLANS = [
  {
    name: "Pro",
    price: "$19",
    features: [
      "Priority generation",
      "Faster than the standard queue",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Ultra",
    price: "$39",
    features: [
      "Everything in Pro",
      "Fast Lane, skip the queue",
      "Highest priority access",
      "Early features",
    ],
    popular: true,
  },
] as const; // mock pricing

function UpgradeModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[720px] rounded-[22px] bg-white p-7 shadow-[0_24px_60px_rgba(26,26,46,0.28)] animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none sm:p-9"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-[#9a9aa8] transition hover:bg-[#f1f0f4] hover:text-[#1a1a2e]"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(24px,3vw,30px)] font-extrabold tracking-tight text-[#1a1a2e]">
          {title}
        </h2>
        <p className="mx-auto mt-2.5 max-w-[440px] text-center text-[15px] leading-relaxed text-[#6a6b7b]">
          Scale creativity with higher limits, priority access, and early
          features
        </p>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRICING_PLANS.map((p) => (
            <div
              key={p.name}
              className={
                "relative rounded-2xl border bg-white p-6 " +
                (p.popular
                  ? "border-[#ff5e1a] shadow-[0_8px_24px_rgba(255,82,85,0.14)]"
                  : "border-[#ececf1]")
              }
            >
              {p.popular && (
                <span className="absolute -top-3 right-5 rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] px-3 py-1 text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(255,82,85,0.28)]">
                  Popular
                </span>
              )}
              <div className="text-[15px] font-bold text-[#1a1a2e]">
                {p.name}
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-[40px] font-extrabold leading-none tracking-tight text-[#1a1a2e]">
                  {p.price}
                </span>
                <span className="text-[14px] text-[#9a9aa8]">/mo</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[14px] text-[#6a6b7b]"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[#ff5e1a]"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onClose}
                className={
                  "mt-6 w-full rounded-xl px-6 py-3 text-[15px] font-bold transition " +
                  (p.popular
                    ? "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] hover:brightness-105"
                    : "border border-[#ececf1] bg-white text-[#1a1a2e] hover:border-[#ff5e1a] hover:bg-[#fff7f1]")
                }
              >
                Choose {p.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 页面 ---------- */
export default function GenerationQueueUpsell() {
  const [plan, setPlan] = useState<Plan>("free");
  const [view, setView] = useState<"agent" | "canvas">("agent");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const fast = isFast(plan);
  const showQueue = !fast;
  // 弹窗标题取当前套餐的 CTA(Pro → "Upgrade to Fast Lane",其余 → "Upgrade to skip the queue")
  const upgradeTitle = fast
    ? "Upgrade"
    : UPSELL_COPY[plan as StandardPlan].cta;

  return (
    <main className="min-h-[100dvh] bg-[#faf8f6] px-6 py-12">
      <div className="mx-auto max-w-[920px]">
        {/* 演示控制条(套餐切换;非产品 UI 的一部分) */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-bold text-[#9a9aa8]">
            套餐
          </span>
          {PLANS.map((p) => (
            <PlanChip key={p} active={plan === p} onClick={() => setPlan(p)}>
              {PLAN_LABEL[p]}
            </PlanChip>
          ))}

          <span className="ml-3 mr-1 text-[12px] font-bold text-[#9a9aa8]">
            视图
          </span>
          <PlanChip active={view === "agent"} onClick={() => setView("agent")}>
            Agent
          </PlanChip>
          <PlanChip active={view === "canvas"} onClick={() => setView("canvas")}>
            Canvas
          </PlanChip>
        </div>

        {view === "agent" ? (
          /* ---------- Agent UI:贴合真实 Seedream 界面 ---------- */
          <div>
            {/* 标题行 */}
            <div className="mb-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[#1a1a2e]">
                AI Selfie
              </span>
              <span className="text-[13px] text-[#9a9aa8]">
                Seedream 5.0 lite · 1:1
              </span>
            </div>

            {/* 横排 4 张方卡 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: CARD_COUNT }).map((_, i) => (
                <GeneratingCard key={i} queued={showQueue} />
              ))}
            </div>

            {/* 卡片下方内联排队 + 升级条(Ultra 不显示) */}
            {showQueue && (
              <QueueUpsellBar
                plan={plan as StandardPlan}
                onUpgrade={() => setUpgradeOpen(true)}
              />
            )}

            {/* 底部工具条 */}
            <div className="mt-4 flex items-center gap-2">
              <ToolPill>
                <Pencil className="size-3.5" />
                Edit
              </ToolPill>
              <ToolPill>
                <RotateCw className="size-3.5" />
                Retry
              </ToolPill>
            </div>
          </div>
        ) : (
          /* ---------- Canvas UI:节点画布,两个节点对比 ---------- */
          <div className="canvas-grid overflow-hidden rounded-2xl border border-[#ececf1] px-8 py-12">
            <div className="flex flex-wrap items-start justify-center gap-x-16 gap-y-10">
              <CanvasNode
                label="Image Generator"
                queued={showQueue}
                onUpgrade={() => setUpgradeOpen(true)}
              />
            </div>
          </div>
        )}

        {/* 说明 */}
        <p className="mt-5 text-center text-[13px] text-[#9a9aa8]">
          切换上方套餐 / 视图查看各状态。
        </p>
      </div>

      {upgradeOpen && (
        <UpgradeModal
          title={upgradeTitle}
          onClose={() => setUpgradeOpen(false)}
        />
      )}

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        .gen-anim { animation: gradient-shift 5s linear infinite; }
        @keyframes gen-dot-blink {
          0%, 60%, 100% { opacity: 0.2; }
          30% { opacity: 1; }
        }
        .gen-dot { animation: gen-dot-blink 1.4s infinite both; }
        .gen-dot:nth-child(2) { animation-delay: 0.2s; }
        .gen-dot:nth-child(3) { animation-delay: 0.4s; }
        .canvas-grid {
          background-color: #f1f0f4;
          background-image: radial-gradient(circle, #cfced8 1px, transparent 1.5px);
          background-size: 22px 22px;
        }
        @media (prefers-reduced-motion: reduce) {
          .gen-anim, .gen-dot { animation: none; }
          .gen-dot { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
