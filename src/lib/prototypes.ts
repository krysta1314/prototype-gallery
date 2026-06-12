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
    slug: "marketing-agent-missions",
    title: "Marketing Agent · Mission Gallery",
    desc: "为 marketing agent 接入 web read/search 能力的 use case 卡库:复刻竞品「Ask anything + 分类 tab + 卡片网格」骨架,套 Buzz 品牌色。37 个 mission 分 Research/Creatives/Ad Launch/Analysis/Automation 五类,需联网的卡片右上角打 🌐 Web Read / 🔍 Web Search 标签,点卡把预设 prompt 填进输入框。",
    date: "2026-06-12",
    href: "/prototypes/marketing-agent-missions",
  },
  {
    slug: "generation-queue-upsell",
    title: "生成排队 · 升级加速引导",
    desc: "图片/视频生成等待态的升级引导:4 张卡片跑生成动画,非 Ultra 档约 8s 后网格中央浮现升级卡(Fast Lane processing + up to 12 并发),Ultra 纯动画不打扰。含 Free/Starter/Pro/Ultra 套餐切换演示。",
    date: "2026-06-11",
    href: "/prototypes/generation-queue-upsell",
  },
  {
    slug: "credits-topup",
    title: "Credits 充值(Ultra 专属)",
    desc: "充值功能嵌进账户设置弹窗(Account Settings / Billing / Credits Usage 三 tab),仅对 Ultra 用户开放,落在 Credits Usage tab。主体是一次性 top-up 包(不过期、单价高于订阅),底部按当前 Ultra 状态(月付/年付Y1/Y2/Y3)指向价值阶梯的下一级——月付引导升年付、年付引导升更高额度档、顶档不引导,用 Buzz 橙 CTA+折扣徽章+单价对比让升级订阅明显更划算。",
    date: "2026-06-10",
    href: "/prototypes/credits-topup",
  },
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
    slug: "onboarding",
    title: "Onboarding",
    desc: "PlayAd 广告生成产品的 onboarding 引导流程原型:登录 → 加载 → 多步生成广告。",
    date: "2026-06-04",
    href: "/prototypes/onboarding",
  },
];
