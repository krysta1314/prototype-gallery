/** 产品版本归类(画廊按此筛选) */
export type Version = "v1.2" | "v1.3" | "v1.4" | "v1.5";
export const VERSIONS: Version[] = ["v1.2", "v1.3", "v1.4", "v1.5"];

export type Prototype = {
  slug: string;
  title: string;
  desc: string;
  date: string;
  /** Route to open the prototype */
  href: string;
  /** 所属产品版本 */
  version: Version;
  /** true if it's a migrated static (legacy) demo served from /public/legacy */
  legacy?: boolean;
  /** true if href is an external URL (opens in a new tab) */
  external?: boolean;
};

export const PROTOTYPES: Prototype[] = [
  {
    slug: "seedance-2-5",
    title: "Seedance 2.5 · SEO 落地页",
    desc: "复刻 Dreamina Seedance 2.5 AI 视频生成器 SEO 落地页:结构与文案 1:1 还原(Hero/四大功能/收益/用例/三步上手/创作者证言/FAQ/更多工具/更多模型/结尾视频墙),换上 Buzz 橙高级感视觉——招牌渐变、圆润卡片、视频自动播放展示、影院级首屏。整页统一暖橙体系,避免 AI 模板感。",
    date: "2026-06-25",
    href: "/prototypes/seedance-2-5",
    version: "v1.3",
  },
  {
    slug: "pricing-plan",
    title: "Pricing Plan",
    desc: "定价方案原型(外部链接,点击在新标签页打开)。",
    date: "2026-06-23",
    href: "https://prototype-project-five.vercel.app/v1.2",
    version: "v1.2",
    external: true,
  },
  {
    slug: "affiliate-bold",
    title: "Affiliate 落地页 · 重新设计",
    desc: "旗舰 affiliate 页的重新设计 B 版:跳出 design.md 品牌体系,深色影院级编辑风——Bricolage 编辑体巨型字、视频跑马灯主导首屏、橙色作唯一强调色、编号大列表 How it works、深色玻璃计算器、横向滚动证言。与 rebuild 版对比挑选。",
    date: "2026-06-23",
    href: "/prototypes/affiliate-bold",
    version: "v1.3",
  },
  {
    slug: "asset-library",
    title: "Asset Library · 历史记录",
    desc: "Gemini 式的独立资产模组(左侧导航入口之一)。把跨 session 生成 + 用户上传的素材聚成等大网格,按日期分组,一级 Tab 分 All/Images/Videos/Audio/PDF。管理工具条含 Upload 入口、排序(Newest/Oldest)、批量多选(下载/取消)、筛选(来源:全部/AI 生成/用户上传)。图片直接展示、视频 hover 自动播放、点卡弹详情(大图/播放器 + Model config 键值块 + 下载/回到 session/重新生成)。空状态有扇形预览卡 + Generate。",
    date: "2026-06-15",
    href: "/prototypes/asset-library",
    version: "v1.4",
  },
  {
    slug: "brand-kits",
    title: "Brand Kits · 品牌资产",
    desc: "品牌资产模组(与 Asset Library 同壳、左侧导航另一入口)。卡片网格列出多个品牌(logo 首字母块 + 网站 + voice 描述 + 色板预览)外加「New Brand Kit」。点进编辑态含六字段:Brand logo(上传区)、Brand name、Brand description、Website、Brand color(色块+HEX,可加色)、Brand fonts(标题/正文)。生成时由 marketing agent 自动调用,保证产出统一在品牌调性内。",
    date: "2026-06-15",
    href: "/prototypes/brand-kits",
    version: "v1.4",
  },
  {
    slug: "marketing-agent-missions",
    title: "Marketing Agent · Web Search Mission Gallery",
    desc: "为 marketing agent 接入 web read/search 能力的 use case 卡库:复刻竞品「Ask anything + 分类 tab + 卡片网格」骨架,套 Buzz 品牌色。37 个 mission 分 Research/Creatives/Ad Launch/Analysis/Automation 五类,需联网的卡片右上角打 🌐 Web Read / 🔍 Web Search 标签,点卡把预设 prompt 填进输入框。",
    date: "2026-06-12",
    href: "/prototypes/marketing-agent-missions",
    version: "v1.3",
  },
  {
    slug: "generation-queue-upsell",
    title: "生成排队 · 升级加速引导",
    desc: "图片/视频生成等待态的升级引导:4 张卡片跑生成动画,非 Ultra 档约 8s 后网格中央浮现升级卡(Fast Lane processing + up to 12 并发),Ultra 纯动画不打扰。含 Free/Starter/Pro/Ultra 套餐切换演示。",
    date: "2026-06-11",
    href: "/prototypes/generation-queue-upsell",
    version: "v1.3",
  },
  {
    slug: "credits-topup",
    title: "Credits Top-up(充值)",
    desc: "充值功能嵌进账户设置弹窗(Account / Billing / Usage / Top-up 四 tab),仅对付费用户开放:Free 用户 Top-up tab 仍可见但内容上锁,充值包虚化置后、中央盖一层升级 gate(Need more credits?)把好奇心转成升级转化。身份模型复刻真实订阅页的三个维度——Tier(Free/Starter/Pro/Ultra)× 计费(Monthly/Yearly)× Ultra 容量(×1/×2/×4),演示控制器同样三件套切换,共 11 个身份。主体是一次性 top-up 包(不过期、单价固定 $0.01/credit、故意高于订阅);升级助推按真实定价走价值阶梯:月付档主推「转年付」(单价掉到 ~$0.007 真低于 top-up),年付档主推升一档/扩容(Starter→Pro→Ultra×1→×2→×4),Ultra×4 年付封顶不引导。点 Upgrade 弹 toast 模拟订阅弹窗。Buzz 橙单一口径 + 划线价 + 单价对比让升级明显更划算。",
    date: "2026-06-10",
    href: "/prototypes/credits-topup",
    version: "v1.3",
  },
  {
    slug: "2026-06-09-affiliate",
    title: "Affiliate Program 落地页",
    desc: "完整 affiliate 落地页:50% 佣金 hero、收益计算器、How it works、真实证言、FAQ、结尾 CTA 视频墙。用 Next.js + Tailwind + shadcn/ui 重构。",
    date: "2026-06-09",
    href: "/prototypes/2026-06-09-affiliate",
    version: "v1.3",
  },
  {
    slug: "onboarding",
    title: "Onboarding",
    desc: "PlayAd 广告生成产品的 onboarding 引导流程原型:登录 → 加载 → 多步生成广告。",
    date: "2026-06-04",
    href: "/prototypes/onboarding",
    version: "v1.4",
  },
];
