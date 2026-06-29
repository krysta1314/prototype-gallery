"use client";

import { Calculator, type CardVariant } from "../affiliate-bold/page";

/* 计算器卡片配色方案对比页(演示用,非正式产品页)。
   四个方案都锁定在同一档位(Sapphire / 青),只比较「卡片底色 + 色彩如何出现」。
   每张卡仍可拖动,可自行滑到 Gold / Diamond 看不同档位下的表现。 */
const VARIANTS: { key: CardVariant; label: string; note: string }[] = [
  {
    key: "restrained",
    label: "方案 A · 克制",
    note: "暖黑渐变底 + 顶边高光,几乎不上彩 —— 最高级、最稳。彩色全部交给轨道/旋钮/宝石。",
  },
  {
    key: "tier-wash",
    label: "方案 B · 档位色晕染(推荐)",
    note: "暖黑底 + 右下角随档位变色的极淡晕染(金→青→橙)。由滑块状态驱动,有意义不装饰。",
  },
  {
    key: "gradient-border",
    label: "方案 C · 渐变描边",
    note: "暖黑底 + 顶部一条渐变鳞光吃品牌橙。色彩克制地待在边缘,像被品牌光描了一道。",
  },
  {
    key: "tinted-number",
    label: "方案 D · 巨数染色",
    note: "暖黑底 + 把巨型收益/招募数染成当前档色。让「一个元素」独占色彩,冲击力最强。",
  },
];

export default function CardVariantsPage() {
  return (
    <main
      className="min-h-[100dvh] bg-[#0d0c10] text-[#f4f1ec]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mx-auto max-w-[1640px] px-3 py-16 md:px-6 md:py-20">
        <h1
          className="text-[clamp(32px,5vw,64px)] font-extrabold leading-[0.95] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-bricolage)" }}
        >
          计算器卡片配色方案对比
        </h1>
        <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-white/55">
          四个方案均锁定在 Sapphire(青)档,只看卡片底色处理的差异。每张卡都可拖动,
          自行滑到 Gold / Diamond 可看不同档位下的表现。
        </p>

        <div className="mt-12 space-y-16 md:space-y-24">
          {VARIANTS.map((v) => (
            <section key={v.key}>
              <div className="mb-4 px-1 md:mb-6">
                <div
                  className="text-[clamp(20px,2vw,28px)] font-bold tracking-[-0.01em]"
                  style={{ fontFamily: "var(--font-bricolage)" }}
                >
                  {v.label}
                </div>
                <div className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-white/45">
                  {v.note}
                </div>
              </div>
              <Calculator variant={v.key} autoSlide={false} initial={120} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
