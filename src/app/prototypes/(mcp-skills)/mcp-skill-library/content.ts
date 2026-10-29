// MCP Skill 库的全部调研数据。页面只负责展示与筛选，改内容只改这里。

export type Batch = 1 | 2 | 3 | "extra";

/** 执行这个 Skill 要用到的能力 */
export type Cap =
  | "image"
  | "video"
  | "voice"
  | "avatar"
  | "music"
  | "edit"
  | "search"
  | "3d"
  | "code"
  | "browser"
  | "data"
  | "publish"
  | "new";

export const CAPS: Record<Cap, string> = {
  image: "生图",
  video: "生视频",
  voice: "配音 / 克隆声",
  avatar: "数字人",
  music: "音乐",
  edit: "本地剪辑 ffmpeg",
  search: "网页搜索",
  "3d": "3D(Blender / 网页 3D)",
  code: "代码渲染",
  browser: "浏览器",
  data: "MediaLens 数据",
  publish: "发布通道",
  new: "需 MCP 新能力",
};

export type Category =
  | "底座"
  | "广告"
  | "UGC"
  | "电商图"
  | "3D"
  | "内容"
  | "剪辑"
  | "动效"
  | "品牌 / 网站"
  | "爆款玩法"
  | "社媒"
  | "行业包"
  | "数据驱动"
  | "代理商";

export type Skill = {
  slug: string;
  name: string;
  batch: Batch;
  category: Category;
  what: string;
  flow?: string;
  caps: Cap[];
  refs: string;
  value: "高" | "中";
  /** 已在 dev-admin 配置并测过 */
  tested?: boolean;
  /** Monica 点名、或与已有 demo 流程一致 */
  proven?: boolean;
  note?: string;
};

export const BATCHES: { id: Batch; label: string; hint: string }[] = [
  { id: 1, label: "第一批", hint: "底座 + 已跑通的流程 + 商业价值最高" },
  { id: 2, label: "第二批", hint: "放量工具 + 细分场景 + 网站 / 品牌" },
  { id: 3, label: "第三批", hint: "爆款玩法 + 社媒 + 行业包 + 发布" },
  { id: "extra", label: "新增方向", hint: "接 MediaLens 数据、面向代理商，以及需要 MCP 新能力的" },
];

export const SKILLS: Skill[] = [
  // ── 第一批 ──
  {
    slug: "ai-video-editor",
    name: "AI 剪辑",
    batch: 1,
    category: "底座",
    what: "把镜头剪成一条成片。三种模式：生成镜头拼成片 / 剪用户素材(去废话、去停顿、双语字幕) / 实拍 + AI 补拍混剪",
    flow: "问需求 → 看素材(联系表 + 逐字稿) → 出剪辑表并报积分，等确认 → 生成缺的镜头和配音 → ffmpeg 剪辑、字幕、混音 → 逐帧质检 → 交付",
    caps: ["edit", "video", "voice", "music"],
    refs: "browser-use video-use(约 3 万星)、剪映、IG 剪片 reel、Rellet 广告、hybrid-reel",
    value: "高",
    tested: true,
    proven: true,
    note: "2026-10-29 已在 dev-admin 配置并测通;v2 已加入剪辑风格(含参考视频学风格)并更新",
  },
  {
    slug: "video-understand",
    name: "看懂视频",
    batch: 1,
    category: "底座",
    what: "抽帧 + 转录，拆出任何视频的时间轴：时长、景别、运镜、转场、字幕、音乐节奏",
    flow: "下载视频 → 抽帧 + 转录 → 输出镜头表，供复刻类 Skill 调用",
    caps: ["edit", "search"],
    refs: "watch(约 1.7 万安装)、HeyGen video-understand、你的参考片调研",
    value: "高",
    proven: true,
  },
  {
    slug: "ad-remake",
    name: "广告复刻",
    batch: 1,
    category: "广告",
    what: "搜同类在投广告，拆结构，换成用户的产品和卖点，生成自己的版本",
    flow: "搜 Meta 广告库 → 选参考 → 拆结构 → 改写脚本 → 生成 → 剪成片",
    caps: ["search", "image", "video", "voice", "edit"],
    refs: "Creatify Ad Clone、Higgsfield Ad Recreator、Topview Viral Agent",
    value: "高",
    proven: true,
  },
  {
    slug: "viral-remix",
    name: "爆款换主体复刻(Katana 式)",
    batch: 1,
    category: "广告",
    what: "爆款参考视频 + 自己的主体，保留节奏、运镜、转场、调色，逐镜头重做",
    flow: "看懂参考片 → 逐镜头用主体参考图生成 → 按原片卡点剪",
    caps: ["video", "image", "edit"],
    refs: "Higgsfield /katana、Seedance 参考视频换角色",
    value: "高",
    proven: true,
  },
  {
    slug: "link-to-ad",
    name: "商品链接出广告",
    batch: 1,
    category: "广告",
    what: "贴商品链接，自动抓图文、提炼卖点、写 3 个角度脚本、出多条广告",
    caps: ["search", "image", "video", "voice", "edit"],
    refs: "Pippit、Creatify、Topview、Captions、Higgsfield Click to Ad —— 行业标配",
    value: "高",
  },
  {
    slug: "ugc-product-review",
    name: "数字人手持口播测评",
    batch: 1,
    category: "UGC",
    what: "选数字人 → 生成手持商品图 → 确认脚本 → 口播视频 + 字幕",
    caps: ["avatar", "image", "voice", "edit"],
    refs: "Topview Product Avatar、MakeUGC、HeyGen、Arcads —— 各家付费主力",
    value: "高",
  },
  {
    slug: "ad-hook-variants",
    name: "开头 Hook 多版本",
    batch: 1,
    category: "广告",
    what: "同一条广告只重做开头，换痛点 / 反差 / 提问 / 数字 3–5 种 hook，用于 A/B",
    caps: ["video", "voice", "edit"],
    refs: "Higgsfield Hook Multiplier、Creatify Batch Mode",
    value: "高",
  },
  {
    slug: "product-photoshoot",
    name: "产品电商套图",
    batch: 1,
    category: "电商图",
    what: "一张产品图出白底、场景、细节、尺度、手持全套，光线统一、商品不变形",
    caps: ["image"],
    refs: "Freepik Spaces、Pippit AI Product Photo、Higgsfield product-photoshoot(开源)",
    value: "高",
  },
  {
    slug: "product-ad",
    name: "产品多场景广告套装",
    batch: 1,
    category: "广告",
    what: "透明底产品图 → 多场景图 → 多图生视频 + 旁白 / 字卡快剪，同时出 9:16 和 16:9",
    caps: ["image", "video", "voice", "edit"],
    refs: "你的 Enterprise 画布交付(BuzzRose 香水)",
    value: "高",
    proven: true,
  },
  {
    slug: "3d-product-video",
    name: "3D 产品片",
    batch: 1,
    category: "3D",
    what: "Blender 建模或导入 → 爆炸图 / 360° 转台 / 材质打光 → 渲染关键帧 → 图生视频",
    caps: ["3d", "image", "video", "edit"],
    refs: "Segmind 爆炸图流程、cc-blender-skill、Topview 3D",
    value: "高",
    proven: true,
  },
  {
    slug: "3d-director",
    name: "3D 导演",
    batch: 1,
    category: "3D",
    what: "从一张图转成 3D 模型，或从零搭白模场景，然后逐镜头控制机位运镜、角色动作、故事分镜，渲染成参考视频后生成写实成片",
    flow: "图转 3D(调 photo-to-3d) 或搭白模 → 定故事分镜 → 逐镜头摆机位、运镜、动作 → 渲染参考视频 → 生成写实画面 → 交给 AI 剪辑出片。只控运镜用网页 3D;要角色动作(需绑骨骼)用 Blender",
    caps: ["3d", "code", "video", "new"],
    refs: "Higgsfield scene-builder、Seedance 2.5 多参考视频;就是你的 3D Studio 原型的 MCP 版",
    value: "高",
    proven: true,
    note: "合并了原「3D 白模控构图」;图转 3D 依赖 MCP 新增 3D 模型能力",
  },
  {
    slug: "festival-campaign",
    name: "节日营销套装",
    batch: 1,
    category: "广告",
    what: "搜节日习俗和热点 → 定概念 → 主视觉 + 15 秒片 + 多尺寸 KV(留文案位)",
    caps: ["search", "image", "video", "music", "edit"],
    refs: "麦当劳香港 AI 新年片、海洋公园 Halloween、万宁双 11",
    value: "高",
  },
  {
    slug: "product-promo-video",
    name: "产品宣讲片 / 上新片",
    batch: 1,
    category: "内容",
    what: "拆参考片 → 脚本分镜 → 录屏或生成画面 → 配音 → 剪辑 + 字卡",
    caps: ["video", "voice", "edit", "code", "browser"],
    refs: "你的宣讲片、模型宣传片、HybridReel 上新弹窗",
    value: "高",
    proven: true,
  },

  // ── 第二批 ──
  { slug: "ad-variations", name: "广告裂变", batch: 2, category: "广告", what: "商品、节奏、音乐不变，换人物、服装、场景批量出", caps: ["image", "video", "edit"], refs: "Higgsfield Ad Multiplier、MakeUGC", value: "高" },
  { slug: "ad-localizer", name: "广告多语言本地化", batch: 2, category: "广告", what: "转录 → 本地化文案 → 粤语 / 普通话 / 英文配音 → 换字幕和画面文字", caps: ["voice", "edit", "image"], refs: "HeyGen Translate、Higgsfield Ad Localizer", value: "高", note: "目前没有粤语预设声音，需补" },
  { slug: "ad-resizer", name: "多比例改版", batch: 2, category: "广告", what: "识别主体 → 9:16 / 1:1 / 4:5 / 16:9 重构 → 扩图补边 → 查文字安全区", caps: ["image", "edit"], refs: "Opus Reframe、Firefly、Canva Magic Switch", value: "中" },
  {
    slug: "competitor-ad-research",
    name: "竞品广告情报",
    batch: 2,
    category: "广告",
    what: "全网搜竞品在投广告和市场资料，拆角度、hook、CTA，出报告和可复刻清单",
    flow: "网页搜索 + Meta 公开广告库 / TikTok 创意中心 → 收集竞品广告 → 拆角度、hook、CTA → 出报告和可复刻清单",
    caps: ["search", "browser"],
    refs: "Creatify Competitor Tracker、competitive-ads-extractor",
    value: "高",
    note: "现在没有 MediaLens 数据，先用全网搜索做市场调研;接通 MediaLens 后再加港台本地广告数据",
  },
  { slug: "unboxing-ugc", name: "开箱 UGC", batch: 2, category: "UGC", what: "包装 → 拆开 → 产品揭晓 → 第一印象口播", caps: ["avatar", "image", "video", "voice"], refs: "Higgsfield Unboxing UGC", value: "中" },
  { slug: "try-on-ugc", name: "试穿 UGC", batch: 2, category: "UGC", what: "服装图 + 模特 → 上身 → 转身走动 → 口播", caps: ["image", "video", "voice"], refs: "Higgsfield Try-on、Kling Try-On", value: "高" },
  { slug: "product-demo-ugc", name: "产品用法教程", batch: 2, category: "UGC", what: "拆步骤，每步一个手部特写镜头，配旁白和字幕", caps: ["video", "voice", "edit"], refs: "Higgsfield Physical UGC", value: "中" },
  { slug: "talking-avatar", name: "数字分身讲解", batch: 2, category: "UGC", what: "照片或视频建分身 → 克隆声音 → 按脚本出讲解片(讲师、老板)", caps: ["avatar", "voice", "edit"], refs: "HeyGen Video Agent、Hedra Character-3", value: "中" },
  { slug: "marketplace-listing", name: "详情页套图", batch: 2, category: "电商图", what: "主图 + 卖点图 + 参数图 + A+ 模块，符合各平台规范", caps: ["image", "code"], refs: "Higgsfield marketplace-cards、Amazon Listing Pack", value: "高" },
  { slug: "virtual-try-on", name: "换模特 / 换体型", batch: 2, category: "电商图", what: "同一件衣服换不同模特、肤色、体型", caps: ["image"], refs: "Pippit Clothing Model", value: "中" },
  { slug: "long-to-shorts", name: "长视频切短视频", batch: 2, category: "剪辑", what: "转录 → 片段打分 → 用户选 → 按词边界切 → 9:16 跟随主体 → 动态字幕", caps: ["edit", "code"], refs: "Opus Clip、Submagic、claude-shorts", value: "高" },
  { slug: "faceless-explainer", name: "无人出镜讲解", batch: 2, category: "内容", what: "资料 → 脚本 → 选画风(火柴人、Vox 混媒、手绘、扁平、纸雕) → 分镜 → 配音 → 剪辑", caps: ["search", "image", "video", "voice", "edit"], refs: "Higgsfield faceless 系列、video-podcast-maker", value: "中" },
  { slug: "short-drama", name: "系列短剧", batch: 2, category: "内容", what: "角色卡三视图 → 分集大纲 → 逐集分镜 → 生成 → 剪辑，每集留钩子(含水果 / 宠物微短剧)", caps: ["image", "video", "voice", "music", "edit"], refs: "抖音 AI 短剧、Cheating Fruit、美亚 AI 短剧", value: "高" },
  { slug: "video-thumbnail", name: "视频封面", batch: 2, category: "内容", what: "从视频抽高光，出 3 个方向的 YouTube / 小红书封面，大字不压主体", caps: ["image", "edit"], refs: "Higgsfield youtube-thumbnail", value: "中" },
  {
    slug: "transparent-video",
    name: "生成透明视频",
    batch: 2,
    category: "动效",
    what: "生成带透明背景的视频素材：抠好的产品、人物、特效元素(火花、烟雾、水花)、动态贴纸、logo 动画，直接叠到任何画面或剪辑软件里用",
    flow: "在纯色背景(绿幕 / 纯黑)上生成 → 本地抠像(色键或 AI 抠图逐帧) → 检查边缘、发丝、半透明 → 导出 ProRes 4444 .mov / WebM / PNG 序列 / 动图",
    caps: ["video", "image", "edit", "code"],
    refs: "Runway 去背景、CapCut 抠像、Lottie 透明动画;剪辑师和设计师常用的叠加素材",
    value: "高",
    note: "现在靠本地抠像实现;若 BuzzVideo 能直接输出透明视频，效果和速度都会更好(见产品建议)",
  },
  { slug: "motion-graphics", name: "代码动效视频", batch: 2, category: "动效", what: "用代码渲染标题、字卡、数据图表、品牌片尾，保证文字准确", caps: ["code", "music"], refs: "Remotion、HeyGen HyperFrames(7.5 万星)、Lottie", value: "中" },
  { slug: "landing-page", name: "产品落地页", batch: 2, category: "品牌 / 网站", what: "生成主视觉和背景视频 → 写网站 → 部署出链接", caps: ["image", "video", "code"], refs: "Higgsfield websites", value: "中" },
  { slug: "brand-kit", name: "品牌套件", batch: 2, category: "品牌 / 网站", what: "品牌调研 → 配色、字体、logo 方向 → 物料样机 → 品牌手册(PDF / PPT)", caps: ["search", "image", "code"], refs: "Higgsfield brandkit、Krea 风格训练", value: "中" },

  // ── 第三批 ──
  { slug: "talking-product", name: "会说话的产品", batch: 3, category: "爆款玩法", what: "产品长出脸，自己讲卖点", caps: ["image", "video", "voice", "avatar"], refs: "Opus 2026 爆款格式", value: "中" },
  { slug: "pov-vlog", name: "角色 / 门店 POV vlog", batch: 3, category: "爆款玩法", what: "第一人称自拍视角的角色或门店 vlog", caps: ["video", "voice", "edit"], refs: "Bigfoot vlog、历史人物 vlog", value: "中" },
  { slug: "ai-asmr", name: "AI ASMR", batch: 3, category: "爆款玩法", what: "切玻璃水果等不可能材质 + 逼真音效，适合食品、消费品", caps: ["video", "edit"], refs: "TikTok ASMR,单条约 6700 万播放", value: "中" },
  { slug: "music-video", name: "品牌歌 / 歌词 MV", batch: 3, category: "爆款玩法", what: "歌曲配 AI 画面或歌词动画，卡拍对齐", caps: ["music", "image", "video", "edit", "code"], refs: "OpenArt Music Video、Suno MV", value: "中" },
  { slug: "trend-effects", name: "热点特效", batch: 3, category: "爆款玩法", what: "手办盲盒、Ghibli / 黏土风、拥抱、老照片动起来", caps: ["image", "video"], refs: "Nano Banana 手办、Vidu Hug、Pikaffects", value: "中" },
  { slug: "before-after", name: "前后对比", batch: 3, category: "爆款玩法", what: "美容、健身、清洁、装修的分屏对比", caps: ["image", "video", "edit"], refs: "Designkit、Miraflow", value: "中" },
  { slug: "ai-podcast", name: "双人 AI 播客", batch: 3, category: "爆款玩法", what: "资料 → 双人对谈脚本 → 两个声音 → 数字人画面", caps: ["search", "voice", "avatar", "edit"], refs: "Hedra、deer-flow podcast", value: "中" },
  { slug: "fashion-show", name: "AI 时装秀", batch: 3, category: "爆款玩法", what: "不可能存在的 T 台 / IP 主题走秀", caps: ["image", "video", "music"], refs: "小红书 IP 时装秀", value: "中" },
  { slug: "xhs-notes", name: "小红书图文笔记", batch: 3, category: "社媒", what: "先分析高互动笔记，再出封面 + 图文", caps: ["search", "image", "code"], refs: "baoyu xhs-images(2.7 万星)", value: "中" },
  { slug: "social-carousel", name: "社媒轮播图", batch: 3, category: "社媒", what: "IG / 小红书 3–10 张连贯轮播", caps: ["image", "code"], refs: "Higgsfield social_carousel", value: "中" },
  { slug: "bulk-creatives", name: "表格批量出素材", batch: 3, category: "社媒", what: "导入表格，每行出一张图或一条视频", caps: ["image", "video", "code"], refs: "Canva Bulk Create", value: "中" },
  { slug: "screen-tutorial", name: "产品录屏教程", batch: 3, category: "内容", what: "录屏 + 配音 + 字卡讲解产品功能", caps: ["browser", "voice", "edit", "code"], refs: "你的 MCP 教程片、record-demo", value: "中", proven: true },
  { slug: "restaurant-menu-video", name: "餐饮菜品动态", batch: 3, category: "行业包", what: "真菜品照片加蒸汽、淋酱、推镜", caps: ["video", "music", "edit"], refs: "香港 SME AI 视频指南", value: "中" },
  { slug: "real-estate-tour", name: "地产看房片", batch: 3, category: "行业包", what: "虚拟软装 + 照片转看房运镜(需标注 AI)", caps: ["image", "video", "voice", "edit"], refs: "Cliprise", value: "中" },
  { slug: "edu-course-video", name: "教育课程片", batch: 3, category: "行业包", what: "讲师分身课程 + 多语字幕", caps: ["avatar", "voice", "edit"], refs: "e-learning 数字人", value: "中" },
  { slug: "cantonese-ad", name: "粤语对白广告", batch: 3, category: "行业包", what: "粤语对白、粤语配音的本地广告", caps: ["video", "voice", "edit"], refs: "香港 SME Veo 粤语指南", value: "高", note: "香港差异化，依赖粤语声音" },
  { slug: "ai-reborn", name: "授权人物重现", batch: 3, category: "行业包", what: "授权的名人 / 品牌人物年轻版重现，带授权流程", caps: ["image", "video", "voice"], refs: "X Wallet × 陈冠希", value: "中" },
  { slug: "social-publish", name: "发布 / 排期", batch: 3, category: "社媒", what: "发布或排期到 IG、TikTok、小红书、YouTube", caps: ["publish", "browser"], refs: "Postiz、Ayrshare、Typefully", value: "中", note: "要先接发布通道：官方 API / 第三方发布 MCP / 浏览器" },

  // ── 新增方向 ──
  { slug: "creative-fatigue-refresh", name: "素材疲劳自动替换", batch: "extra", category: "数据驱动", what: "读 Ad Manager 数据，找出效果下滑的素材，自动生成替换版本", caps: ["data", "image", "video"], refs: "MediaLens 素材疲劳接口；调研：素材约 7 天就疲劳", value: "高", note: "竞品没有的数据优势" },
  { slug: "trend-jacking", name: "热点当天出素材", batch: "extra", category: "数据驱动", what: "读 Buzz 热门话题和爆款帖，当天出蹭热点的素材", caps: ["data", "image", "video"], refs: "MediaLens Buzz 热点数据", value: "高" },
  { slug: "competitor-ad-remake", name: "竞品广告情报 → 复刻", batch: "extra", category: "数据驱动", what: "从 Ad Intelligence 拉竞品在投广告，拆解后直接复刻", caps: ["data", "video", "edit"], refs: "MediaLens Ad Intelligence", value: "高" },
  { slug: "campaign-report-to-next", name: "投放复盘 → 下一轮", batch: "extra", category: "数据驱动", what: "读投放结果，建议下一轮测的角度，再直接生成", caps: ["data", "image", "video"], refs: "Creatify AdMax、Higgsfield Campaign Analyst", value: "高" },
  { slug: "pitch-animatic", name: "比稿动态分镜", batch: "extra", category: "代理商", what: "脚本 → 分镜图 → 带临时配音的动态分镜", caps: ["image", "voice", "edit"], refs: "代理商比稿刚需", value: "高" },
  { slug: "brand-profile", name: "品牌档案", batch: "extra", category: "品牌 / 网站", what: "一次存好品牌色、字体、logo、声音、禁用词，其他 Skill 都读它", caps: ["image"], refs: "digitalsamba /brand、HeyGen Brand kit", value: "高" },
  { slug: "character-mascot", name: "吉祥物 / 虚拟代言人", batch: "extra", category: "品牌 / 网站", what: "三视图定妆，后续反复使用", caps: ["image", "video"], refs: "PixVerse character-design、Higgsfield Soul ID", value: "中" },
  { slug: "content-calendar", name: "月度内容计划", batch: "extra", category: "社媒", what: "排一个月社媒内容，再逐条生成", caps: ["search", "image", "video"], refs: "把单次生成变成持续使用", value: "中" },
  { slug: "creative-qa", name: "交付前质检", batch: "extra", category: "底座", what: "查穿帮、平台广告政策、AI 标注、文字错误", caps: ["edit"], refs: "调研共性：各家都在加质检步骤", value: "中" },
  { slug: "sound-design", name: "音效与配乐", batch: "extra", category: "剪辑", what: "给无声片段配音效和音乐", caps: ["music", "edit"], refs: "ElevenLabs sound-effects、Firefly 音效", value: "中" },
  { slug: "photo-to-3d", name: "照片生成 3D 模型", batch: "extra", category: "3D", what: "用自己或产品的照片生成 3D 模型，做转台视频、手办;也是「3D 导演」的第一步", caps: ["new", "3d", "video"], refs: "Hunyuan3D、Tripo、Meshy;Higgsfield generate 已支持 3D", value: "高", note: "Monica 点名;需要 BuzzVideo MCP 新增生成 3D 模型的工具" },
];

/** Monica 2026-10-29 选定要做的 Skill(页面默认勾选这些) */
export const DECIDED = [
  "ai-video-editor",
  "video-understand",
  "ad-remake",
  "viral-remix",
  "link-to-ad",
  "ugc-product-review",
  "ad-hook-variants",
  "product-photoshoot",
  "product-ad",
  "3d-product-video",
  "3d-director",
  "festival-campaign",
  "product-promo-video",
  "ad-variations",
  "ad-localizer",
  "ad-resizer",
  "unboxing-ugc",
  "try-on-ugc",
  "competitor-ad-research",
  "marketplace-listing",
  "long-to-shorts",
  "faceless-explainer",
  "short-drama",
  "transparent-video",
  "photo-to-3d",
];

/** 暂不做 */
export const NOT_DOING = [{ name: "24 小时 AI 直播", why: "要实时推流，不是 Skill 能解决的工作流(对标 Shopee AI LiveStream)" }];

/** 首条 Skill 的测试记录 */
export const TEST_RUN = {
  slug: "ai-video-editor",
  date: "2026-10-29",
  video: "/prototypes/mcp-skill-library/test-ai-video-editor.mp4",
  poster: "/prototypes/mcp-skill-library/test-poster.jpg",
  brief: "Rellet 实拍 15 秒 + 2 个 AI 镜头，粤语配音 + 繁中 / 英文双语字幕，9:16，21 秒",
  passed: [
    "dev-admin 新建、保存、启用(Public)",
    "dev MCP 的 list_skills 能列出，get_skill 能返回全文",
    "AI 照 Skill 走完：问需求 → 看素材 → 出方案报积分等确认 → 上传参考图 → 生成 → 剪辑 → 质检 → 交付",
    "上传卡片在桌面端能显示;生成结果本地直接下载",
    "规则生效：品牌名看错(頤蓮)被纠正、字幕压产品被移开",
    "成片 1080×1920、−14.4 LUFS,约 1,036 积分",
  ],
  /** 2026-10-29 已全部写进 v2 并更新到 dev-admin */
  todo: [
    "剪辑风格：用户没说就必须问;预设快剪带货(社媒默认)/ 种草口播 / 质感品牌 / 卡点，或给 1–3 条参考视频让 AI 拆出风格卡再照着剪",
    "AI 镜头人物前后不一致 → 先生成人物定妆图，所有镜头都用它做参考",
    "部分电脑 ffmpeg 没有字幕模块(libass) → 字幕画成图片叠加",
    "没有对应方言的预设声音 → 告诉用户、给最接近的选项，请用户试听确认",
    "去掉 Claude 的名字，改成能力条件;卖点向用户确认;逐帧审核设为必做",
  ],
};

/** 写所有 Skill 都要遵守的规则 */
export const RULES: { title: string; body: string; must?: boolean }[] = [
  { title: "不点名 AI 产品", body: "Skill 会被任何接了 MCP 的 AI 读到。写「如果你能在用户电脑上执行命令」这类能力条件，并给出降级方案。" },
  { title: "花积分前先确认", body: "脚本或分镜先给用户看，同时报 estimate_credits 的积分，确认后才生成。" },
  {
    title: "交付前逐帧审核",
    body: "AI 自己当审核：逐帧查穿帮(手、脸、包装变形、文字错误)、字幕不压主体、响度达标。有问题先修，不过审不交付。",
    must: true,
  },
  { title: "卖点先向用户确认", body: "从包装和画面读到的卖点、品牌名，列出来请用户确认后再写进文案;读不清的直接问，不自己猜。" },
];

/** 三路调研的结论 */
export const RESEARCH = [
  {
    title: "Skill 市场与开源仓库",
    count: "约 47 条",
    points: [
      "主流 Skill 都有确认关卡：在策略、片段或脚本这一步停下来等人确认，渲染后还会自查重做",
      "剪辑类 Skill 先转录再按需看帧，用剪辑表驱动 ffmpeg / Remotion",
      "厂商把 Skill 拆成「单一能力」+「多步配方」两层，并常配模型专用的提示词优化",
      "代码渲染视频增长最快：Remotion、HyperFrames、Manim、Lottie",
      "社区目录里最多的是电商和 UGC 广告模板;「竞品调研 → 生成 → 改尺寸 → 发布」全链路几乎没人做",
    ],
    sources: [
      { label: "browser-use/video-use", url: "https://github.com/browser-use/video-use" },
      { label: "remotion-dev/skills", url: "https://github.com/remotion-dev/skills" },
      { label: "heygen-com/hyperframes", url: "https://github.com/heygen-com/hyperframes" },
      { label: "PixVerseAI/skills", url: "https://github.com/PixVerseAI/skills" },
      { label: "SamurAIGPT/Generative-Media-Skills", url: "https://github.com/SamurAIGPT/Generative-Media-Skills" },
      { label: "claudemarketplaces 视频剪辑分类", url: "https://claudemarketplaces.com/skills/category/video-editing" },
      { label: "higgsfield-ai/skills", url: "https://github.com/higgsfield-ai/skills" },
      { label: "Higgsfield MCP 目录", url: "https://higgsfield.ai/mcp" },
    ],
  },
  {
    title: "竞品平台预设工作流",
    count: "55 条",
    points: [
      "商品链接一键出广告 + 批量变体是行业标配",
      "数字人手持商品的 UGC 是各家付费主力，比的是互动真不真",
      "电商商品图(多场景、360°、换商品、包装、试穿)需求密集，Higgsfield MCP 基本没做 —— 我们的空白",
      "爆款复刻 + 竞品情报正在从功能变成 agent;我们能接 MediaLens 数据",
      "本地化、多尺寸、长视频切条是放量工具，粤语 / 繁中 / 英文多语市场价值高",
    ],
    sources: [
      { label: "Creatify", url: "https://creatify.ai/features/batch-mode" },
      { label: "Pippit / CapCut", url: "https://www.capcut.com/resource/turn-product-link-into-video-ad" },
      { label: "Topview 官方指南", url: "https://www.topview.ai/guides/topview-official-guide" },
      { label: "HeyGen MCP", url: "https://www.heygen.com/mcp" },
      { label: "Higgsfield Apps", url: "https://higgsfield.ai/apps" },
      { label: "Opus Clip Reframe", url: "https://www.opus.pro/ai-reframe" },
    ],
  },
  {
    title: "爆款玩法与港台需求",
    count: "41 条",
    points: [
      "最有商业价值的是电商素材流水线：商品图转视频、360° 转台、换模特、前后对比、UGC 测卖点",
      "节日 campaign 是香港品牌的确定需求(麦当劳香港、海洋公园、万宁、X Wallet)",
      "爆款玩法改成能套品牌的模板：会说话的产品、微短剧、POV vlog、ASMR、爆炸图",
      "粤语对白与配音是香港差异化;要提醒声音授权和 AI 标注",
      "行业 Skill 走「真实素材 + AI 补强」，消费者对明显 AI 有反感，默认带质检",
    ],
    sources: [
      { label: "Opus:2026 爆款 AI 视频格式", url: "https://www.opus.pro/blog/viral-ai-video-styles-2026" },
      { label: "AI 水果连续剧", url: "https://the-decoder.com/ai-generated-dating-show-pulls-10-million-views-per-episode-on-tiktok/" },
      { label: "麦当劳香港 AI 新年 campaign", url: "https://www.marketing-interactive.com/mcdonald-s-hk-extends-cny-blessings-with-first-ai-generated-campaign" },
      { label: "海洋公园 AI Halloween", url: "https://www.marketing-interactive.com/ocean-park-unveils-ai-driven-campaign-this-halloween" },
      { label: "香港 SME:Veo 粤语对白", url: "https://ud.hk/en/blogs/insight/article/2026-05-05-google-veo3-hk-sme" },
      { label: "Segmind 爆炸图流程", url: "https://www.segmind.com/pixelflows/exploded-view-video-creation-seedance-2-gpt-image-2" },
    ],
  },
];

/** PressLogic 自家产品的 MCP:能和 BuzzVideo MCP 一起用的数据 */
export const ECOSYSTEM = {
  intro:
    "MediaLens 已经有自己的 MCP。用户同时接上 BuzzVideo 和 MediaLens 两个 MCP,AI 就能先拿港台的广告与社媒数据，再用 BuzzVideo 生成素材。",
  rows: [
    { area: "Ad Intelligence", gives: "竞品和品类在投广告、广告主的活动", skills: ["ad-remake", "competitor-ad-remake", "competitor-ad-research"] },
    { area: "Ad Manager", gives: "自家投放表现、素材疲劳、创意分析", skills: ["creative-fatigue-refresh", "campaign-report-to-next"] },
    { area: "Buzz", gives: "港台热门话题、爆款 FB / IG / 连登帖子", skills: ["trend-jacking", "festival-campaign"] },
    { area: "Social Listening", gives: "关键词舆情、热门讨论", skills: ["content-calendar", "link-to-ad"] },
    { area: "Competitor / Leaderboard", gives: "竞品专页表现、KOL 排行", skills: ["competitor-ad-research", "content-calendar"] },
    { area: "Influencer", gives: "KOL 推荐、campaign 规划", skills: ["ugc-product-review"] },
  ],
  how: [
    "Skill 里写成条件：「如果能用 MediaLens 的工具，就用它拿数据;否则改用网页搜索」。没接 MediaLens 的用户照样能用，符合「不点名、不假设环境」的写法规则",
    "数据只用来定方向(选角度、找参考、判断该换哪条素材),生成仍走 BuzzVideo",
  ],
  edge: "竞品有广告库或竞品追踪，但没有港台本地的社媒热点、连登讨论和本地广告数据。这是 Higgsfield、Creatify 等做不到的组合",
};

/** 产品层面的建议(不是 Skill,是 MCP 本身要补的能力) */
export const PRODUCT_ASKS = [
  { title: "照片生成 3D 模型", body: "新增生成 3D 模型的工具：用自己或产品的照片生成 3D，再做转台视频、手办。Higgsfield 已有。" },
  { title: "直接输出透明视频", body: "生成视频时可选透明背景，直接拿到带透明通道的文件，不用再本地抠像，发丝和烟雾这类半透明边缘也更干净。" },
  { title: "粤语预设声音", body: "预设声音只有英文和普通话，粤语广告和本地化 Skill 都依赖它。" },
  { title: "不分平台的写法规范", body: "admin 的 Instructions 提示里加一句：不要点名任何 AI 产品，用能力条件写。" },
  { title: "BuzzVideo × MediaLens 打包", body: "企业版把两个 MCP 一起开通;或让 BuzzVideo MCP 直接带上 MediaLens 的部分数据(热点、竞品广告)，用户不用接两个。" },
];
