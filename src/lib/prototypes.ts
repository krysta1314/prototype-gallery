export type Prototype = {
  slug: string;
  title: string;
  desc: string;
  date: string;
  /** Route to open the prototype */
  href: string;
  /** true if it's a migrated static (legacy) demo served from /public/legacy */
  legacy?: boolean;
};

export const PROTOTYPES: Prototype[] = [
  {
    slug: "2026-06-09-affiliate",
    title: "Affiliate Program 落地页",
    desc: "完整 affiliate 落地页:50% 佣金 hero、收益计算器、How it works、真实证言、FAQ、结尾 CTA 视频墙。用 Next.js + Tailwind + shadcn/ui 重构。",
    date: "2026-06-09",
    href: "/prototypes/2026-06-09-affiliate",
  },
  {
    slug: "2026-06-08-affiliate-program",
    title: "Affiliate Program 入口",
    desc: "右上角导航栏新增 Affiliate 入口:hover tooltip,点击弹出 50% Commission 卡片,跳转推广登录页。",
    date: "2026-06-08",
    href: "/prototypes/2026-06-08-affiliate-program",
  },
  {
    slug: "2026-06-04-playad-onboarding",
    title: "PlayAd Onboarding",
    desc: "PlayAd 广告生成产品的 onboarding 引导流程原型:登录 → 加载 → 多步生成广告。",
    date: "2026-06-04",
    href: "/prototypes/2026-06-04-playad-onboarding",
  },
];
