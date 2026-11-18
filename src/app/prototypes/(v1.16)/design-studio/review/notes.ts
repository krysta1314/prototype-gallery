// 评审原型下方白底区的 PM 式交互说明(中文)。
// 版式与功能以 Notion 需求里的 HTML 示意原型为底(5 个分页一比一搬过来，换成 BuzzVideo 浅色 + 品牌橙),
// 在此基础上按市场调研和 spec docs/superpowers/specs/2026-11-17-design-studio-design.md 做新增 / 修改。
// 每节里「HTML 原有」和「新增」分开写，方便评审时对照;界面文案(英文)用引号原样写出。

export type ReviewView = "buzz" | "image" | "brand" | "decks" | "sites" | "projects";
export type NoteSection = { title: string; what: string; rules: string[]; errors?: string[] };

export const VIEW_LABEL: Record<ReviewView, string> = {
  buzz: "BuzzVideo 入口",
  image: "Image Builder",
  brand: "Brand Kit",
  decks: "Decks",
  sites: "Sites",
  projects: "Projects",
};
export const VIEWS: ReviewView[] = ["buzz", "image", "brand", "decks", "sites", "projects"];

const SHELL: NoteSection = {
  title: "顶栏(全部分页共用)",
  what: "HTML 原有：顶栏 5 个分页「Image Builder」「Brand Kit」「Decks」「Sites」「Projects」,右边「Brand」下拉(BusinessFocus / GirlStyle / Client: [BRAND])、积分、「Export」。切品牌后当前设计、Deck、Site 全部换成该品牌的颜色。",
  rules: [
    "改动:HTML 是独立页面，这里嵌在 BuzzVideo 侧边栏右边(侧边栏 3D Studio 下面的「Design Studio」),所以 HTML 顶栏左边的 BuzzVideo logo + Studio 标签换成「Design Studio」标题;视觉从深色紫色换成 BuzzVideo 浅色 + 品牌橙。",
    "新增：积分旁显示当前套餐;「Export」只在 Image Builder 和 Decks 出现;开了审批(Enterprise)且当前版本未批准时，「Export」变成「Submit for approval」,提交后变「In review」。",
    "新增：编辑器全套餐都能用;AI 动作扣积分;品牌数、导出格式、去标识、自定义域名、浏览分析按 Free → Ultra 解锁;模板锁、审批、Brand Check、模型白名单、个人额度在 Enterprise。入口旁的橙色小标签 = 自助套餐，深色 = Enterprise,点了弹升级面板。",
  ],
  errors: ["余额不足：不执行，弹「Not enough credits」+「Top up」。", "Enterprise 成员个人额度用完(演示条余额选「个人额度用完」):弹「You've reached your monthly limit」+「Request more credits」。"],
};

export const NOTES: Record<ReviewView, NoteSection[]> = {
  buzz: [
    {
      title: "侧边栏入口 + 首页 Brand 选择器 + Edit in Studio(新增)",
      what: "HTML 没有这部分(它是独立页面)。嵌进 BuzzVideo 后：侧边栏 3D Studio 下面新增一级入口「Design Studio」;首页输入框上方多一个「Brand」下拉;Image Gen 点「Create」出结果卡，卡上「Edit in Studio」把图带进 Image Builder。",
      rules: [
        "点侧边栏「Design Studio」→ 打开 Studio,侧边栏高亮这一项;点 Home / Marketing Agent / 其他工具离开 Studio,再回来停在上次的分页。",
        "「Edit in Studio」→ 新建一份 IG post 4:5,图片作为第一个图层铺满画布，套当前品牌，直接打开 Image Builder。",
        "首页「Brand」下拉和 Studio 顶栏的「Brand」是同一个值。",
        "演示：本原型首页默认停在 Image Gen;结果图是样片，约 2 秒出图。",
      ],
    },
  ],
  image: [
    {
      title: "Image Builder 版式(HTML 原有)",
      what: "最左工具栏 6 个:「Templates」「Elements」「Text」「Uploads」「Brand」「AI」,点了在旁边打开对应面板(再点一次收起);中间画布台，上方是选中属性条「Selected: Headline · 字体 · 字号 · B · Animate · 撤销 / 重做」,下方是「Magic Resize」格式条「IG post 1:1 / IG post 4:5 / Story 9:16 / FB link 1.91:1」和状态文字;右栏「AI tools · most already live in Marketing Agent」7 张卡 +「Layers」图层列表(锁定的带锁)。",
      rules: [
        "画布：点选图层(橙色细框 + 四角手柄)、拖动、选中文字后再点可直接改字;Layers 列表点哪层选哪层。",
        "Templates:搜索框 + 标签「Brand / IG post / Story / Imported from Canva」+ 模板缩略图(按当前品牌配色)+「Import from Canva (PDF / PNG)」。",
        "Elements:Shapes 4 种、Brand graphics 3 个(品牌徽章、Arrow tag、Frame)、Icons 5 个，点了加到画布。",
        "Text:「Add a heading / subheading / body text」、Brand text styles(標題 Heading、Body copy)、「Magic Write: draft caption」。",
        "Uploads:「Upload files」+ BuzzVideo Assets(My / Team)里的图，点了加到画布。",
        "Brand:当前品牌的 Logos(浅底 / 反白)、Colours(点色块改选中文字或形状，没选中改底色)、Fonts、「Open Brand Kit」。",
        "AI:「Generate on brand」提示词 +「Use brand kit」「4:5」「x4 variants」+「Generate」。",
        "Magic Resize:点另一个格式，画布直接换比例(图层按比例摆放，锁定规则不变);Story 9:16 上下叠蓝色「Platform UI · keep clear」安全区。",
      ],
    },
    {
      title: "在 HTML 基础上的修改 / 新增",
      what: "按市场调研和商业化设计改了这些地方。",
      rules: [
        "改名：右栏「Magic Layers」改成「Split to Layers」——Canva 2026-03 推出了同名功能，要区分;NEW 标签保留。",
        "AI 卡标积分(和工具页同价):Remove background 2、Split to Layers 8、Object removal / Inpaint 4、Relight / Style transfer 6、Magic Expand 6、Upscale 4;「Make it a video」交给 Video Gen,这里不扣。作用在选中的图片，没选中就作用在画面主图;执行中图片盖「Working…」,完成后底部状态和顶部 toast 都提示。",
        "Generate on brand:多了「By selling point ×12」(Ultra,按品牌套件里的卖点各出一张);点「Generate」先弹总价确认，生成的设计都可编辑，打开第一张。",
        "Magic Resize 要 Starter(Free 点其他格式弹升级)。",
        "模板锁只在 Enterprise 生效：锁住的图层显示「Content only / Locked」,模板缩略图左上角「Locked」;非 Enterprise 显示「Lock templates for your team · E1」,同一份设计按不锁显示。",
        "Brand 面板新增「Other brand kits」:可插入别的品牌 logo(演示 Brand Check 拦截)。",
        "右栏新增「Brand Check」(Enterprise):查字色是否在品牌色里、有没有混用别的品牌 logo;有问题的图层标红，列问题 +「Fix all」。",
        "导出(顶栏「Export」):PNG / JPG 都有，PDF Starter,SVG Pro,PDF Print(CMYK)Ultra;默认写入 Content Credentials(C2PA)标出 AI 图层，Enterprise 才能关。Free 画布底部常驻「Free plan · personal use only」。",
      ],
      errors: ["余额不足点 AI 卡：不执行，弹「Not enough credits」。", "Enterprise 成员(演示条角色选 Member):Admin 关掉的「Relight / Style transfer」置灰，写「Disabled by your admin」。"],
    },
    {
      title: "审批(Enterprise,演示条打开「审批」)",
      what: "画布上方多一条审批状态。点顶栏「Submit for approval」→「In review」→ 审批人「Approve」/「Request changes」(演示里 Admin 身份可以直接点)。",
      rules: ["审批绑定版本：批准的是 v1,之后改任何东西 → v2、状态回 Draft,提示「Edited after approval · needs re-approval」。", "只有当前版本被批准，「Export」才出现。"],
    },
    SHELL,
  ],
  brand: [
    {
      title: "Brand Kit 版式(HTML 原有)",
      what: "左边「Brand kits」列表(BusinessFocus / GirlStyle / Client: [BRAND])+「+ New brand kit」+ 说明「One kit per PressLogic brand or enterprise client. Admins/Editors edit; Members use.」;右边标题「<品牌> Brand Kit」+「Shared with organisation」+「Import from Canva Brand Kit」「Use in new design」。区块:Logos(Primary / Reversed / Icon / + Upload logo)、Colours(色块 + 名字 + HEX)、Fonts、Brand voice(Tone of voice / Avoid)、Locked templates。",
      rules: [
        "左边点品牌 = 切换顶栏品牌，全部画面换色。",
        "「Use in new design」→ 回 Image Builder 用这个品牌。",
        "Brand voice 会带进 Ad Copy、Captions & Hashtags、Campaign Brief(「Use brand kit」打开时)。",
      ],
    },
    {
      title: "在 HTML 基础上的修改 / 新增",
      what: "商业化额度、自动建品牌、治理。",
      rules: [
        "额度:Free 1(logo + 3 色)、Starter 1、Pro 3、Ultra 10、Enterprise 不限;左下显示「x / y kits」用量，满额「+ New brand kit」变「Upgrade to add more」。",
        "新建三选一:「From your website」(第一次免费，抽 logo / 色 / 字 / 语气 / 卖点，保存前逐项可改)、「Describe it to the Agent」(没网站时用 Marketing Agent 对话建)、「Start blank」。",
        "「Import from Canva Brand Kit」:Canva 没有 Brand Kit 导出功能，点了提示手动抄色值、上传自己的 logo 和字体文件。",
        "Avoid 改成可增删的词标签;字体标「Commercial use OK」;新增「Audience & selling points」(卖点驱动按卖点批量出图)。",
        "Locked templates 要 Enterprise,非 Enterprise 区块半透明 +「Lock templates so your team only edits content · Enterprise」。",
        "「Train brand style」品牌风格模型是 E3。",
      ],
      errors: [
        "Member 身份：整页只读，顶部「View only · ask a brand admin to change this kit」。",
        "降级(演示条 Pro → Free):超额的品牌套件变只读(列表带锁),仍可在设计里用。",
        "网址读不到(新建时输入 blocked.com):提示改手动或让 Agent 建。",
      ],
    },
  ],
  decks: [
    {
      title: "Decks 版式(HTML 原有)",
      what: "顶部「Generate deck」输入框 +「<品牌> theme」+「Generate outline」;左边页缩略图(5 页:Enterprise AI video, on brand / The problem today / BuzzVideo Studio / How teams use it / Plans and next step);中间当前页;右边「Deck」:「Present」「Download PPTX」「Download PDF」「Share view link」,「AI on this slide」:「Rewrite shorter」「Generate image for slide」「Turn into chart」「Add 15s video from slide」。",
      rules: ["首页和末页品牌主色底，中间页底色;页面上的字点了可以直接改。", "切顶栏品牌，整套 Deck 换色。"],
    },
    {
      title: "在 HTML 基础上的修改 / 新增",
      what: "生成流程和权益。",
      rules: [
        "「Generate outline」先出大纲弹窗(免费):可改标题、删页、加页，底部显示「8 × 6 = 48 credits」→「Generate deck」→ 总价确认 → 生成后打开。",
        "「Download PPTX」要 Pro、「Download PDF」要 Starter;PPTX 文字在 PowerPoint 里可编辑。",
        "「Share view link」打开分享设置:Password(Pro)、只给公司邮箱(Enterprise)、允许下载、浏览分析(Ultra);Free 分享页带「Made with BuzzVideo」。",
        "「Present」全屏放映,← → 翻页,Esc 退出。",
        "AI on this slide 标积分:Rewrite shorter 1、Generate image for slide 6(右侧加一张图，文字自动让位)、Turn into chart 2;「Add 15s video from slide」交给 Video Gen。右栏下方显示 Speaker notes。",
      ],
      errors: ["部分页生成失败：成功的保留，失败页积分退回，可单独重试(spec 第 6 节)。"],
    },
  ],
  sites: [
    {
      title: "Sites 版式(HTML 原有)",
      what: "顶部「Generate site」输入框 +「Generate」;左边「Sections」:Hero / Speakers / Agenda / Register form / Footer +「+ Add section」+「Edit HTML」;中间浏览器样式预览(地址栏 + 品牌色 Hero、讲者头像);右边「Publish to」四选一:「BuzzVideo site URL」「Custom domain」「Google Sites」「Download HTML」+「Publish」+ 说明 Google Sites 没有发布接口。",
      rules: ["点区块选中(橙框),再点里面的字直接改;切顶栏品牌整页换色。", "选「Google Sites」显示嵌入方法。"],
    },
    {
      title: "在 HTML 基础上的修改 / 新增",
      what: "托管安全和权益。",
      rules: [
        "改：托管地址从 HTML 的「sites.buzzvideo.ai/bf-talk」改成独立根域名「bf-talk.buzzsite.io」——托管页常被拿去做钓鱼，用 buzzvideo.ai 子域名会连累主站和邮件信誉。",
        "改:Google Sites 推荐「Insert › Embed › By URL › Whole page」贴网址(比贴 HTML 代码稳;Google 的沙箱 iframe 每次发布都换子域名),代码嵌入作为备选。",
        "新增额度：站点数 Free 1 / Starter 3 / Pro 10 / Ultra 25;自定义域名 Pro 1 / Ultra 5;「Register form」「Edit HTML」「Download HTML」要 Ultra;Password protect 要 Pro;Free 页脚「Made with BuzzVideo」。",
        "新增「Hide from search engines」;生成和「+ Add section」扣积分(每区块 4,先确认)。",
        "「Publish」先跑页面检查约 1 秒再上线，状态写「Live at …」。",
      ],
      errors: ["页面含密码 / 卡号输入框(勾「Demo: page has a password field」):「Publishing blocked: pages can't ask for passwords or card details.」", "自定义域名 / 站点数满额：弹升级面板。"],
    },
  ],
  projects: [
    {
      title: "Projects(HTML 原有)",
      what: "标题「Projects」+ 搜索「Search designs, decks, sites」+「+ New folder」「+ Create design」;「Folders」:BusinessFocus / GirlStyle / Client pitches / Event sites / Imported from Canva / Shared with me;「Recent」:设计、Deck、站点缩略图，下面写类型和品牌(如「Template · locked」「Site · live」)。",
      rules: ["点资料夹 → 下方只看这个资料夹的内容，再点取消;点缩略图打开(设计进 Image Builder,Deck 进 Decks,站点进 Sites)。", "「+ Create design」:Generate on brand / Deck / One-page site / Import + 4 种空白尺寸。"],
    },
    {
      title: "在 HTML 基础上的修改 / 新增",
      what: "团队资料夹与导入。",
      rules: [
        "团队资料夹和「+ New folder」要 Ultra,低于 Ultra 点了弹升级;「Shared with me」都能用。",
        "Import:Canva 简报(.pptx)/ Canva 单页(PDF)/ PowerPoint / 图片(Split to Layers 8 积分)→ 导入报告(可编辑元素数、替换的字体、可能是 Canva 授权素材的元素)→ 在 Image Builder 打开。",
      ],
      errors: ["Canva 素材授权：Canva 的素材不能在 Canva 外使用，导入时标出，商用前要替换(待法务确认边界)。"],
    },
  ],
};
