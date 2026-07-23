/** 产品版本归类(画廊按此筛选) */
export type Version = "v1.2" | "v1.3" | "v1.4" | "v1.5" | "归档";
export const VERSIONS: Version[] = ["v1.2", "v1.3", "v1.4", "v1.5", "归档"];

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
    slug: "audio-generation",
    title: "音频生成 · Agent + Canvas 双场景",
    desc: "TTS 语音配音(对齐豆包 Seed-Audio「音频生成 HTTP」接口)的双场景原型,顶部 tab 切 Agent / Canvas。Agent:对话里请求配音 → agent 回内联音频生成卡片(脚本+音色+进阶参数+波形播放器)。Canvas:点阵画布双击或点 + 弹出 Add Node 菜单,在 Generate Video 下方新增 Generate Audio,点击落一个可拖动的自包含生成节点。共享 VoicePicker(音色 popover 带 mock 试听)/ AdvancedParams(model、语速/音调/音量滑块、format、字幕开关)/ AudioPlayer(mock 波形 + 播放头动画)三组件。纯前端 mock,无真实接口/音频。",
    date: "2026-07-22",
    href: "/prototypes/audio-generation",
    version: "v1.5",
  },
  {
    slug: "workflow-canvas",
    title: "Work Flow + Canvas",
    desc: "Work Flow 与 Canvas 的新页面入口。页面内容待补充。",
    date: "2026-07-22",
    href: "/prototypes/workflow-canvas",
    version: "v1.4",
  },
  {
    slug: "canvas-billing",
    title: "Canvas Billing · 内部成本账单后台",
    desc: "公司内部 admin 成本记录后台原型,参照 BytePlus console「Bill details」,最小统计单位为 Canvas。费用只面向内部核算、不对终端用户展示。顶栏 Bill details + 双月历日期范围选择器(默认不选=全部,按 Created 过滤);Total cost 汇总卡随筛选实时重算。主体是一张平铺的生成记录表,每行一条生成记录,列为 Canvas ID / Email / Model / Status(Completed·Processing·Failed 三色徽章)/ Cost(USD)/ Credits / Created / Updated。三个独立搜索框(Email / Canvas ID / Agent ID)+ Resource·Status 两个筛选下拉。Buzz 暖橙 + 干净数据表,纯前端 mock(~52 条记录 / 9 用户 / 3 个月,已排除 storage,税额演示为 $0)。",
    date: "2026-07-20",
    href: "/prototypes/canvas-billing",
    version: "v1.5",
  },
  {
    slug: "consecutive-video",
    title: "连续视频生成 · Demo",
    desc: "验证 Seedance 2.0「连续视频生成」(BytePlus ModelArk)的极简 demo:上传一张产品图 + 写多段分镜 prompt,点生成后用 return_last_frame 让每段视频的最后一帧作为下一段的首帧、逐段串联,最后在页面播放器里连贯播放。用来评估这种「尾帧接首帧」串联方式的成片连贯度与产品一致性。前端调本地后端生成引擎(localhost:8899)。",
    date: "2026-07-17",
    href: "/prototypes/consecutive-video",
    version: "v1.5",
  },
  {
    slug: "homepage",
    title: "Homepage · 产品首页",
    desc: "BuzzVideo 产品首页原型：包含模型与功能入口、会员促销、ChatGPT Image 2.0、Seedance 2.0、MCP、Canvas、灵感瀑布流及响应式手机和平板布局。",
    date: "2026-07-14",
    href: "/prototypes/homepage",
    version: "v1.4",
  },
  {
    slug: "marketing-agent-v14",
    title: "Marketing Agent · V1.4 新版",
    desc: "Marketing Agent V1.4 独立入口：全新的浅色网格与品牌光晕背景、项目管理侧栏、可筛选的创作内容卡片，以及与 Homepage 同步的收起/展开式营销对话框。旧版 Web Search Mission Gallery 继续保留在 V1.3，便于独立查看和对比。",
    date: "2026-07-22",
    href: "/prototypes/marketing-agent-v14",
    version: "v1.4",
  },
  {
    slug: "ad-studio",
    title: "Ad Studio · 功能首页(创作库)",
    desc: "Ad Studio 的产品功能首页(不是落地页):从 Buzz 左侧导航 Canvas 下的「Ad Studio」入口跳脱进入,是一个 light mode 的独立全屏页(与 Buzz 产品体系一致),页面结构为「两张卡片」:左卡是侧边栏(Projects/搜索/项目列表 + 返回 Buzz),右卡是影院墙(顶栏 All team creations / Contact Sales / Upgrade -50% / 账户 + 内容),两卡圆角悬浮在暖白画布上、留间隙,右卡内部滚动。定稿方向 A 影院墙(参考 Sora/Runway 创作库):内嵌 featured showcase 大 banner + Your projects 续作行(带进度) + Trending/Drama/Thriller/Action/Horror/Sci-Fi 分类片墙,海报 hover 放大浮出 播放/加入/logline,点开弹影片详情浮层(Play/Remix into project/Save,Esc 关)。暖白 chrome + 墨色文字 + Buzz 橙作唯一强调色;海报为彩色影像内容,底部 scrim 保证白色片名可读。刻意避 AI 味:无渐变字/无 emoji/单一强调色/主题不翻转。点 Create Project 后右卡内切换成会话页(不跳路由):底部 composer(传产品图 + brief + Image/Video/模型/时长)→ Generate 走生成骨架 → 进入分镜看板 Storyboard:顶部「产品参考 + Consistency locked + Cinematic/16:9/Seed」一致性锁定条,按 Scene 分组的关键帧卡(编号/时长/景别/旁白,hover 可重生/编辑),底部「N shots · 时长 + Generate clips」。演示长视频广告的一致性链路,四阶段贯通(面包屑 Brief›Storyboard›Clips›Export):① composer 传产品图+brief → ② Storyboard 分镜看板(锁参考/风格 + 按场关键帧)→ ③ Clip timeline 渲染队列(逐镜 queued/rendering %/ready 交错动画 + 单镜重生 + 全部就绪才可合成)→ ④ Assembly 时间线编辑器(预览播放器 + Video/Audio/Text 三轨按时长对齐 + 播放头 + Export)。另有第二条生成路径:composer 顶部「Storyboard / Consecutive」模式切换,Consecutive 锁 Seedance 2.0(专属),写一句概念 → AI 拆成 5s beat 列表(可增删改)→ 首尾帧链式续拍(顺序渲染,每段「last frame becomes the next first frame」)→ 同一 Assembly 合成。全程暗色单一橙色强调、无渐变字/无 emoji。",
    date: "2026-07-10",
    href: "/prototypes/ad-studio",
    version: "v1.5",
  },
  {
    slug: "mcp",
    title: "BuzzVideo MCP · 落地页(对标 Magnific)",
    desc: "按 magnific.com/mcp 的信息架构 1:1 复刻的 BuzzVideo MCP 落地页:深色 hero + 客户端 tabs 连接面板(mcp.buzzvideo.ai)→ 浅暖白 body(All inside the chat 能力行、大 demo、feature 分段、MCP vs Agents 对比、Prompts 示例、FAQ)→ 深色多栏 footer。文案 BuzzVideo 原创,素材用真实 BuzzVideo 视频 + 真渲染 in-client 聊天。",
    date: "2026-07-08",
    href: "/prototypes/mcp",
    version: "v1.5",
  },
  {
    slug: "admin-cost-console",
    title: "Admin 成本后台 · Cost Console",
    desc: "PressLogic 内部 admin 原型:按用户名/邮箱/日期搜索账户,下钻「用户 → 项目 → task」三层,看每个 image/video/canvas/agent 的真实美元成本($)。顶部汇总条显示总成本/用户数/task 数/Top3 最烧钱用户;用户详情按项目分组、展开看单个 task 的模型/参数/单价,类型筛选贯穿两层。纯前端 mock,同页切换列表/详情。",
    date: "2026-07-06",
    href: "/prototypes/admin-cost-console",
    version: "归档",
  },
  {
    slug: "upgrade-model-guidance",
    title: "升级引导 · 生成结果 Upsell",
    desc: "Marketing Agent 生成结果后的升级 upsell 引导。用户在对话里确认 route → agent 用免费模型(Seedream 5.0 lite)生成 4 张 1:1 图 → 图片下方一句克制的灰色提示引导升级换更高质量模型:「Upgrade to generate higher quality and more accurate text rendering image.」+ 品牌橙色 Upgrade 文本链接。刻意去掉 sparkles / 渐变按钮 / 药丸卡等 AI 模板感,做成产品原生的安静 nudge。",
    date: "2026-07-03",
    href: "/prototypes/upgrade-model-guidance",
    version: "v1.4",
  },
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
    version: "v1.5",
  },
  {
    slug: "starter-guide",
    title: "Starter Guide · 新手引导",
    desc: "Buzz Agent 首页的 6 步新手引导(Web & Mobile):复刻产品外壳(左侧导航 + composer + hero),进页面弹欢迎卡,点「Start the tour」后用聚光灯遮罩 + 气泡逐步高亮 6 个关键操作——① Marketing Agent 选择器 ② Auto 模式 ③ Agent ④ Chat ⑤ Workflows ⑥ Canvas。气泡含步骤计数、进度点、Back/Next/Finish、Skip,支持方向键/Esc。桌面高亮左侧栏,移动端无侧栏改高亮底部 tab bar,聚光灯随目标自动定位。结束弹完成卡,底部有「重新开始」演示按钮。",
    date: "2026-07-03",
    href: "/prototypes/starter-guide",
    version: "归档",
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
    version: "归档",
  },
];
