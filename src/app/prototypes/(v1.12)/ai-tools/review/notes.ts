// 评审原型下方白底区的 PM 式交互说明(中文):按顶部「主页 / 画布」各一套,每套分几节(功能说明 / 交互规则 / 异常情况)。
// 依据 spec 2026-11-03-upscale-image-seedvr-design.md §3–§6。界面文案(英文)用引号原样写出,方便对照真机。

export type ReviewView = "home" | "canvas";

export type NoteSection = {
  title: string;
  /** 功能说明:这一块是什么 */
  what: string;
  /** 交互规则:点击 xxx → 怎样 */
  rules: string[];
  /** 异常情况 */
  errors?: string[];
};

export const VIEW_LABEL: Record<ReviewView, string> = { home: "主页", canvas: "画布" };

export const NOTES: Record<ReviewView, NoteSection[]> = {
  home: [
    {
      title: "侧边栏与新模块",
      what: "侧边栏在原有 Home / Marketing Agent / Canvas / 3D Studio 下面加一条分隔线和四个新模块:Image › / Video › / Audio › / Avatar ›(参照竞品),Assets 移到四个模块下面(再隔一条分隔线)。放大的入口是 Image › Upscale Image,不再走 Agent 首页的工具卡片。",
      rules: [
        "悬停或点击模块 → 右侧弹出白底菜单(图标 + 名称;分隔线上面是基础生成能力,下面是其余工具,按市场调研的「广告实际使用 → 需求 → 竞品覆盖」排序);移开鼠标 / 点菜单外收起。",
        "键盘:模块上 Enter / Space / → 打开并聚焦第一项;菜单里 ↑↓ 移动,Enter 打开,Esc / ← 收起回到模块。",
        "Image:Text to Image、Image Edit | Remove Background、Resize & Expand、Product Photography、Remove Object、Upscale Image、Inpaint、Virtual Try-On、Model Swap、Relight、Photo Angle Editor、Image Face Swap。",
        "Video:Image to Video、Text to Video | URL to Video、Video Resize、Video Edit、Upscale Video、Motion Control、3D to Video、Video Character Swap、Camera Control、Video Styles(Video Face Swap 2026-11-06 删除)(2026-11-05 补调研后重排，调研结论「不建议」的沉底)。",
        "Audio:AI Voiceover、Background Music | Voice Clone、Sound Effects(2026-11-06 起 4 项都进首页 Audio Gen,预选模型并预填提示词;Voice Clone 独立页删除，Voice Enhancer 整项删除)。Avatar:UGC Avatar | Product Avatar、Talking Avatar、Lip Sync(2026-11-06:UGC Avatar、Product Avatar 进 Marketing Agent 并预填提示词，Product Avatar / Custom Avatar 工具页删除)。菜单依据见 docs/research/2026-11-04-ai-tools-demand-research.md。",
        "Agent 里已有的能力(如 Image Edit、Text to Video)也在模块里给一个入口:背后只是通用生成模型的,入口直接带到 Marketing Agent(见下一条规则和「从菜单跳 Marketing Agent」一节),不另做页面。",
        "在工具页时,Image 模块和菜单里的 Upscale Image 都是选中态(品牌橙)。",
        "所有工具页的主按钮照真实产品「Generate Video ● 1706」:积分放在按钮文字后面(白色圆点 + 数字),按钮上方不再单独一行 Estimated cost;还算不出积分时(没传素材)只显示按钮文字，免费时显示「Free」。",
        "整体版式照真实产品(buzzvideo.ai):浅灰底,左边 260px 侧边栏(官方 logo + 字标,无边框;选中项浅灰底 + 品牌橙字),页面内容放在四周内缩 8px 的白色圆角面板里;顶栏(Invite / 积分 / 礼物 / 帮助 / 账号)叠在白色面板顶部右侧。侧边栏底部是「Invite Friends, Earn Rewards · 1500 credits each」邀请卡和 TikTok / Instagram / YouTube 图标(原型里点了出「Coming soon」;侧边栏太矮时邀请卡自动隐藏,保证菜单完整)。",
        "宽屏(≥ 1024px)是完整侧边栏;768–1023px 收成 60px 图标栏,菜单照样弹出。",
        "窄屏(< 768px):侧边栏收起,顶栏左边出现菜单按钮 → 从左边滑出抽屉,内容和侧边栏一样(Home / Marketing Agent / Canvas / 3D Studio | Image / Video / Audio / Avatar | Assets);四个模块在抽屉里是手风琴,点一下就地展开二级菜单(同一时间只展开一个),不往右弹浮层;当前所在的模块默认展开。点菜单项或导航项后抽屉自动关上;点遮罩、右上角 × 或 Esc 也会关;抽屉打开时背景不能滚动,焦点只在抽屉里循环。顶栏在手机(< 640px)上只留积分和头像(Upgrade / 礼物 / 帮助 / 账号名收起)。工具页在手机上是单列:上传 + 参数在上、结果在下,「Estimated cost」+「Upscale」固定在屏幕底部;结果卡的 Before / After 可以用手指左右拖。",
        "2026-11-05 Monica 定:Image 菜单只有 Upscale Image 有自己的工具页，其余(Text to Image、Image Edit、Remove Background、Resize & Expand、Product Photography、Remove Object、Inpaint、Virtual Try-On、Model Swap、Relight、Photo Angle Editor、Image Face Swap)菜单里不显示「Agent」小标(2026-11-05 去掉)。分两路:Resize & Expand、Product Photography、Remove Object 进 Marketing Agent(要多步处理),其余进首页 Image Gen 输入框;都预填提示词。提示词写得短(一两句),用户能直接改:要改什么 + 一句什么保持不变;[方括号] 放一个示例值，打开时选中第一个。Resize & Expand 工具页已删除(通用图像模型就能扩图);Remove Object / Inpaint / Virtual Try-On / Model Swap / Photo Angle Editor 原来的页面暂留在开发原型地址里，但菜单不再进去。其余模块能点进去用的工具页:Motion Control、Video Character Swap、3D to Video(Video Relight 2026-11-06 删除：使用场景很少，菜单项和页面都去掉);Avatar › Product Avatar、Custom Avatar、Lip Sync、Talking Avatar(结果都是 fixture,不调真实模型)。Video Resize 2026-11-05 删除页面，改走 Marketing Agent(预填「Resize my video to [9:16] by extending the scene…」,agent 用 MiniMax H3 Max reframe-video 补画面)。Auto Captions 2026-11-05 删除(菜单项和页面都去掉)。所有独立工具页共用两条规则(2026-11-06):① 参数记住用户上次的选择(模式、倍数、格式、选项等，不含素材和提示词，存在浏览器本地),没有记录就用默认值;② 结果卡右上角删除要二次确认(「Delete this result? It will also be removed from your Assets.」),确认后从生成历史和 Assets 一起删掉;生成中删除按钮置灰不能点(悬停提示「You can delete it once it's done」),生成完才能删(2026-11-06 Monica 定)。③ 右上角账号可切个人账号 / 团队 / 企业工作区(2026-11-06),每个工作区各自一份积分和生成结果;团队工作区里结果区分 My Results / Team Results:生成结果默认只有自己可见，结果卡上点 Share → 共享弹窗把 General access 从 Restricted 改成「Anyone at <团队>」就进 Team Results(队友只读，可下载 / 收藏),改回 Restricted 或删除就移出;个人账号没有 Share 和 Team Results。Custom Avatar(分身)不走这套共享。从侧边栏或手机抽屉进，工具页之间来回切换，各页的任务和参数都保留;积分是同一个余额;Custom Avatar 建好的分身会出现在 Product Avatar 的「My avatars」里。",
        "菜单项去哪儿的规则(依据调研第 4 轮「每个工具有没有专门模型」):有专门模型的工具做成独立工具页;背后只是通用生成模型 + prompt 的,点了跳到 Marketing Agent,切到对应创作模式并预填提示词(详见下一节)。每个菜单项只属于「工具页 / 跳 Agent / Coming soon」其中一种。",
        "跳 Marketing Agent 的(共 14 个,名字后面紧跟浅紫底小标签「✦ Agent」(Marketing Agent 同款图标)):Image ›(2026-11-05 起进首页 Image Gen,不进 Marketing Agent)Text to Image、Image Edit、Remove Background(预填「Remove the background from this product photo and give me a clean cutout on transparent and pure white backgrounds.」,2026-11-05 定)、Product Photography、Relight、Image Face Swap(→ Image Gen);Video › Image to Video、Text to Video、URL to Video、Video Edit(→ Video Gen;Video Face Swap 2026-11-06 删除);Audio › AI Voiceover、Background Music、Voice Clone、Sound Effects(→ 首页 Audio Gen,2026-11-06:AI Voiceover / Voice Clone 预选 Seed Audio 1.0,Background Music 预选 ElevenLabs Music v2.5,Sound Effects 预选 ElevenLabs Sound Effects V3)。;Avatar › UGC Avatar、Product Avatar(→ Marketing Agent,2026-11-06)",
        "原型限制:Camera Control、Video Styles 在 ai-tools 原型里还没做(video-gen-modes 原型里有),以及 3D Studio / Assets,点了出顶部 toast「Coming soon in this prototype」——只是原型行为,不是产品设计。",
      ],
    },
    {
      title: "从菜单跳 Marketing Agent",
      what: "通用模型的菜单项(如 Image › Relight、Video › Image to Video、Audio › Background Music)不做单独页面:点了回到 Marketing Agent 首页,输入框已经切好创作模式、填好这个工具的英文提示词模板,用户改掉 [方括号] 里的内容就能 Create。",
      rules: [
        "侧边栏和手机抽屉一样:点菜单项 → 页面切到 Marketing Agent 首页,侧边栏选中的是「Marketing Agent」导航项(不是 Image / Video 模块);手机上抽屉自动关上。",
        "创作模式只有三种:Marketing Agent / Image Gen / Video Gen(输入框左下角的类型按钮,可手动切)。Image 的项 → Image Gen,Video 的项 → Video Gen,Audio 的项 → Marketing Agent。标题跟着模式换:「Marketing Agent: Your ideas, campaign-ready in seconds」「Image Gen: Ad-ready product shots, no photoshoot needed」「Video Gen: Ad-ready video clips, with sound, from one prompt」;Image Gen / Video Gen 下面的工具卡片也跟着换成对应类别,Marketing Agent 模式不显示卡片。",
        "提示词模板:简短、面向广告的英文,要用户填的部分写成 [方括号](可带候选,如 Relight「Relight [product] for a [lighting: soft daylight / studio spotlight / golden hour] look, keep the product unchanged.」)。打开时光标在输入框里,并选中第一个 [方括号],直接打字就替换掉。",
        "输入框上方出现小标「From: <工具名>」,说明是从哪个工具来的;点 × 去掉小标(提示词保留)。",
        "再点另一个(或同一个)菜单项:重新切模式、换成新提示词(之前输入框里的内容被替换)。",
        "菜单里这些项名字后面紧跟浅紫底小标签「✦ Agent」(Marketing Agent 同款图标)(悬停提示「Opens in Marketing Agent」),和进工具页的项区分开。",
        "原型限制:Create 不真正生成,出 toast。",
      ],
    },
    {
      title: "Upscale Image 工具页",
      what: "左栏是标题「Upscale Image」+ 模型标「SeedVR」+ 副标题「Sharper detail, up to 10x and print-ready.」、上传位、参数区(含实时尺寸预览)、预计积分和「Upscale」按钮;右侧是结果列表,最新的在最上面。背后模型直接换成 SeedVR(fal SeedVR2),旧放大模型下线,不提供模型下拉。SeedVR 不接受文字,所以没有 prompt。",
      rules: [
        "上传位:点击或拖拽文件进来(拖到左栏任意位置都行);已传图时显示原图 + 文件名和尺寸,可「Replace」换图,右上角 × 移除。",
        "默认参数:Factor、2x、Format PNG(模型默认 jpg,产品默认 PNG,印刷要无损)。",
        "任何参数变动,立即刷新「原图 W×H → 输出 W×H px」和下方「Estimated cost」。样图 2x = 3,072×2,048,1 credit。",
        "积分 = ⌈⌈输出百万像素⌉ × 0.1⌉,最低 1(按输出像素计,1 credit = $0.01,和 fal 账单一致)。",
        "首页的「Upscale Image」工具卡片不再进放大:和其他卡片一样,只把 prompt 填进 Image Gen 输入框。",
      ],
    },
    {
      title: "SEO / GEO:结果区的 Guide 标签页(样板)",
      what: "2026-11-10:工具页原来只有标题、一句描述和一个演示，搜索引擎和 AI 搜索没有内容可收录。现在把原来的空状态演示扩成一整段介绍内容，放进结果区常驻的「Guide」标签页(有了结果也能回去看);左栏工具不动，网址不变。先在 Upscale Image 做样板，确认后其余工具页照同一结构补(内容在 app/seo/content.ts,每个工具一份)。",
      rules: [
        "内容放在结果区的「Guide」标签页里，排在最后:团队工作区是 My Results / Team Results / Guide,个人账号是 Results / Guide(原来个人账号只有一个「Results」标题，现在也变成标签页)。",
        "还没有生成结果时默认停在 Guide:第一屏仍是「AI Image Upscaler」+ 一句卖点 + 可拖的前后对比，不再撑满整屏，底下露出下一节的标题，提示还能往下滚。这时点 Results / My Results 是一句「Your upscaled images show up here.」。",
        "点「Generate」提交任务 → 自动切到 Results / My Results 看进度;之后随时点 Guide 回去看介绍，再点 Results 回来，结果不受影响。已经有结果的用户再进这个页面，默认停在结果，不是 Guide。",
        "2026-11-10 起 7 个工具页都有 Guide 标签页，同一套版式和规则:Upscale Image、Upscale Video、Motion Control、Video Character Swap、3D to Video、Lip Sync、Talking Avatar。内容分别在 app/seo/content.ts(Upscale Image)和 app/seo/guides.ts(其余 6 个);各页的 <title> / description / 分享图 / 结构化数据由 app/seo/ToolSeo.tsx 统一输出。下面以 Upscale Image 为例，其余 6 页差别:没有「前后对比样例」一屏(还没有真实样例素材);定义旁的两格配图是「输入 / 结果」而不是细节特写;页尾按钮打开的是该工具第一个素材位的文件选择框。",
        "收费口径(Monica 2026-11-10):图片工具注册送 500 积分、不用订阅就能用，所以只有 Upscale Image 写 free,结构化数据里也只有它标 0 元;视频类 6 个工具都要订阅，价格行写「Video tools need a BuzzVideo subscription.」,不写 free。Lip Sync、Talking Avatar 虽然在 Avatar 菜单下，输出是视频，暂按视频类处理(待确认)。",
        "视频类工具的价格文案和按钮上的积分用同一套算法:每秒积分 × 质量档(Standard 0.6 / Pro 1)× 分辨率(480p 0.7 / 768p 1 / 1080p 1.5 / 2K 2)。例:Character Swap 768p 每秒 9、1080p 每秒 13.5;Talking Avatar 用 MiniMax H3 Max 从 480p 的 6.3 到 2K 的 18。⚠️ 每秒积分在规格配置里标的是「示意」,上线前要和正式定价核对。",
        "各页文案规则:定义段第二句写这个工具自己的事实，7 页不重复同一句话;FAQ 的问题带上主语(「How much does AI lip sync cost on BuzzVideo?」而不是「How much does it cost?」),单独被 AI 引用时也看得懂;用真实搜索用词(Kling Motion Control、motion transfer、talking photo、character replacement、Blender / Unreal Engine、video enhancer);「More AI tools」的链接文字用对方页面的主标题(AI Video Upscaler),不用菜单名(Upscale Video);页面上不出现中文。",
        "配图规则(2026-11-10 UI 审核 + Monica):每页定义旁的两格和三步里的缩略图，都从这一页首屏的演示片里截，保证是同一个人 / 同一个镜头，且两格看得出区别 —— Motion Control:左「Motion Video」真人跳舞、右「Result」卡通角色做同样动作(3D 白模和舞台女团的画面她都不要);Character Swap:同一个骑摩托镜头换人前「Original」/ 换人后「Result」;3D to Video:首屏那组水上飞机素材，白模「3D Render」/ 成片「AI Video」同一时刻(跳舞的白模和舞台女团画面全站都不用，Monica 2026-11-10);Talking Avatar:和首屏同一位女生的「Photo」/「Talking Video」;Upscale Video:同一帧的 Before / After;Lip Sync:首屏演示片里嘴型明显不同的两帧，标签写时间点「0:09」/「0:05」(那条片子只有对好口型的成片，没有改之前的版本，所以不写 Original / Result)。",
        "步骤里的界面片段要和左栏真实控件一致:控件名照左栏的写法(Upscale Factor、Target Resolution、Auto Look References、What should they say?),选中的是左栏的默认值;Upscale Image 第 2 步是滑杆 + 数值框(不是分段按钮);第 3 步「Generate and download」统一是结果缩略图 + 下载按钮。",
        "首屏下面是一整张落地页，版式是 Monica 2026-11-10 选定的「大色块」版(试过一版更素的，她要求改回这一版)。一屏讲一件事，每屏长得不一样，图片当主角:",
        "① 白底:大标题「What is an AI image upscaler?」+ 定义段(第一句是能单独拿出去读的定义，第二段写清 BuzzVideo 是谁、用什么模型、免费额度、上限和输出格式);右边是细节特写:演示图里唇膏上品牌字的 Before / After 两格(真图片，不是背景图),说明不写放大倍数。",
        "② 暖白色块「How to increase image resolution online」:三步横排，每步上面是一块产品界面片段(已上传的图片卡 / 2x 4x 8x 10x 倍数选择 +「1,200 × 900 → 4,800 × 3,600 px」/ 前后对比小图 + 下载按钮)。",
        "③ 白底「Before and after: low-resolution photos, upscaled」:两组大幅可拖的前后对比等高排开(1940 年彩色全家福、1915 年黑白婚礼照),图下第一行标题、第二行出处。页面上不出现中文(占位说明只写在评审说明里)。",
        "④ 深色块「What can you use an image upscaler for?」:5 个用途，左边大字标题、右边一句说明。",
        "⑤ 白底「Supported formats, sizes and pricing」:规格表，左标签右数值，8 行(价格、输入格式、文件大小、倍数、最大输出、目标分辨率、输出格式、模型)。",
        "⑥「AI image upscaler FAQ」:11 条，居中窄栏，默认展开第一条(Is the AI image upscaler free?),点问题展开 / 收起，右侧「+」转成「×」。",
        "⑦ 品牌渐变色块「Upscale your first image free」+ 主按钮「Upload an image」:点了直接打开文件选择框(和左栏上传位同一个动作);下面「More AI tools」是 3 张相关工具的卡片(2026-11-10 Monica:原来只是文字链接，不好看):每张上面是那个工具的演示片段，静音循环自动播放(2026-11-10 Monica:不要静图;Upscale Image 没有视频，用成果图;系统开了「减少动态效果」时只显示静图),下面是工具名(用对方页面的主标题)+ 一句说明 + 右上箭头;悬停时边框变浅橙、微微浮起、图片略放大;整张卡都能点，在外壳里就地切到那个工具页。宽屏三张并排、等高;结果区窄了(笔记本、手机)改成「左图右字」的横条上下排。",
        "色块(暖白 / 深色 / 渐变)都是内缩的大圆角面板;字号和栏数跟着结果区宽度变，窄了各屏改成上下排。",
        "文案规则(2026-11-10 SEO / GEO 审核后定):标题用用户会搜的说法(increase image resolution、online、before and after、free);同一个说法全页只出现一两次，不堆词;不写绝对化承诺(「without losing quality」只在 FAQ 的问题里，回答写明限制);不写验证不了的数字;计费写明「向上取整到整数积分」。",
        "样例图是占位(上线前必须换):老照片是公版图(美国国会图书馆，无已知使用限制),After 是高清原始扫描、Before 是同一张缩小的低清版，不是工具真实输出。正式版还要补商品图、带小字的广告图、AI 生成图各一组。样例图不能出现真实品牌(全家福已裁掉背景里的品牌海报)。",
        "规格表和 FAQ 里的数字(20 MB、1x–10x、0.1 credits / megapixel、10,000 px)直接取产品配置，产品参数改了这里跟着变，不允许手写一份对不上的。",
        "点「Related tools」里的工具 → 在当前外壳里切到那个工具页(和从侧边栏进一样);它们是真链接，新标签打开、搜索引擎抓取都能走。",
        "不在 Guide 标签页时内容只是藏起来，仍然在页面源码里;新访客和搜索引擎(没有结果)打开看到的就是 Guide,也就是完整内容。",
        "标题层级:停在 Guide 时整页唯一的 H1 是「AI Image Upscaler」,左栏的「Upscale Image」降成普通文字;内容区每节是 H2,步骤标题和 FAQ 问题是 H3。切到结果标签页时左栏「Upscale Image」才是 H1。(原型里首页和工具页挂在同一个页面，所以源码里还有首页的 H1;正式环境每个工具是独立路由，不会有。)",
        "页面信息:每个工具页有自己的 <title>(「Free AI Image Upscaler: Upscale to 4K Online | BuzzVideo」(56 个字符，不会被截断))、meta description、canonical、分享图(单独裁的 1200×630)。",
        "结构化数据(JSON-LD,和页面上的文字同一份):WebApplication(工具，名字「BuzzVideo AI Image Upscaler」)、HowTo(3 步)、FAQPage(11 条)、BreadcrumbList(AI Tools › AI Image Upscaler;分类没有自己的页面，不放没有网址的一级)。",
        "SEO 审核给开发的补充要求(原型里做不了):a) 正式环境工具页的 HTML 里不能带其他页面的内容(原型里首页和工具页挂在同一个文档，隐藏的首页占了源码的大半，还多出一个 H1);b) 侧边栏的工具入口要是真链接(<a href>),现在是按钮，搜索引擎顺着爬不到其他工具页;加可见的面包屑和页脚链接(Pricing、Sign up、其他工具);c) 图片走图片优化(带宽高、延迟加载、WebP / AVIF);d) 原型域名要禁止收录，避免和正式域名重复;e) 网址建议用 /tools/ai-image-upscaler 这类带关键词的写法;f) Google 已不给普通网站展示 FAQ / HowTo 富摘要，这两块结构化数据保留给 Bing 和 AI 搜索读，不必追加投入;没有真实评分不要加评分标记。",
        "给开发的三条前提(不满足的话内容加了也收录不了):① 工具页未登录也能打开，看到的就是空状态 + 内容区，点 Generate 时才要求登录;② 这些文字由服务端直接输出在 HTML 里，不能等前端脚本跑完才出现(FAQ 收起时答案也要在源码里);③ 每个工具页进 sitemap,并从四个分类菜单有普通链接可达。",
        "手机宽度:落地页单列;Generate 仍固定在底部。",
      ],
    },
    {
      title: "按倍数放大(Factor)",
      what: "设计团队做印刷图的主要用法。实测那一单:8.1x,1,536×1,024 → 12,442×8,294。",
      rules: [
        "倍数 1–10,可小数:滑杆 + 数字框(步长 0.1);2026-11-05 照 fal 去掉了 2x / 4x / 8x / 10x 快捷档。",
        "输出尺寸 = 原尺寸 × 倍数后四舍五入;尺寸、积分、Print-ready 判定都用同一个取整后的值。",
        "输出长边 ≥ 10,000px → 显示「Print-ready (300 dpi)」徽标,并换算成英寸(px ÷ 300)和厘米(英寸 × 2.54):12,442×8,294 ≈ 41.5×27.6 in · 105.3×70.2 cm。",
        "8.1x 约 103.2 MP → 按 104 MP 计 → 11 credits;10x(15,360×10,240)= 16 credits;4x = 3 credits。",
      ],
      errors: ["倍数框失焦时夹到 [1, 10]:输入 11 → 10,输入 0 或 -3 → 1;空、非数字回到上一次的合法值。尺寸预览和积分始终用合法值计算,不会出现 NaN。"],
    },
    {
      title: "按分辨率放大(Target)",
      what: "按目标分辨率放大,适合做屏幕用图。",
      rules: [
        "4 档:720p / 1080p / 1440p / 2160p,默认 1080p;用下拉选择。",
        "按短边对齐目标档,长边按原比例推算:横图 1,536×1,024 选 2160p → 3,240×2,160;竖图 1,024×1,536 → 2,160×3,240(保持方向)。",
        "切到 Target 时提示「Max 2160p. For print, use Factor.」—— 2160p 长边只有约 3,840px,远达不到印刷线。",
        "倍数滑杆只在 Factor 显示;分辨率下拉只在 Target 显示。",
      ],
    },
    {
      title: "Noise scale / Format(照 fal 平铺)",
      what: "2026-11-05 按 fal(fal-ai/seedvr/upscale/image)的参数表平铺，不再折叠 Advanced:顺序是 Upscale mode → Upscale factor(Factor)/ Target resolution(Target,对应 fal 的 upscale_mode = target)→ Noise scale → Format。Seed 2026-11-05 去掉，不开放，每次随机。每项标题旁有 ⓘ,悬停或聚焦出一句说明。",
      rules: [
        "Noise scale:0–1,步长 0.001,默认 0.1;滑杆 + 数字框，超出范围夹到边界;改过后右边出现橡皮擦「重置」按钮(Upscale factor 同理)。",
        "Seed:非负整数,只收纯数字;留空 = 随机(占位文案「Random」);右边骰子按钮随机填一个。输入负数、1e3、0x10、小数等,失焦后回到上一次的值。结果卡会显示这次实际用的 seed,便于复现。",
        "Format(PNG / JPG / WEBP)默认 PNG(fal 默认 jpg,产品为印刷无损定 PNG)。",
        "安全检查(enable_safety_checker)和 sync_mode 是系统参数,固定开 / 关,不开放给用户。",
      ],
    },
    {
      title: "处理中",
      what: "点「Upscale」后,右侧结果列表最上面多一张卡:标题行是源图缩略图 + 这次参数(如「8.1x · 12,442 × 8,294 px」),下方按输出比例占位的处理中动画「Upscaling...」。",
      rules: [
        "提交即扣积分(顶栏余额 35,600 → 35,589)。",
        "提交后左栏清空源图、参数保留,可以马上换一张图继续放大;多单并行,每单一张卡,列表回到顶部。",
        "处理中不显示预计时长(Monica 决定);真实一单约 101 秒。",
      ],
    },
    {
      title: "结果",
      what: "放大完成的结果卡:Before / After 拖动对比 + 一行输出信息 + 操作按钮。",
      rules: [
        "对比滑块两边都直接渲染原图,不做缩略图降级(Monica 决定:先看原图效果,真机卡顿再讨论降级)。",
        "信息行:实际宽高、文件大小、格式、seed;长边 ≥ 10,000px 带「Print-ready」。",
        "「Download · 文件大小」:下载原文件、原格式(如 upscaled-12442x8294.png),下载中按钮显示百分比。",
        "「Favorites」收藏 / 取消,顶部 toast 提示;「Open in canvas」把结果图带进画布(本页切到顶部「画布」)。",
      ],
      errors: ["下载失败:顶部 toast「Download failed — try again」+ Retry 重下。大图下载慢:按钮上一直显示进度。"],
    },
    {
      title: "再次放大(Upscale again)",
      what: "点结果卡的「Upscale again」:结果图(原尺寸,如 12,442×8,294)作为新源图放回左栏上传位;窄屏时左栏滚回可见处。",
      rules: [
        "倍数重置为 2x(Factor),免得 8.1x 再乘一次直接爆尺寸;格式、Noise scale、Seed 沿用上一单。尺寸预览和积分按新源图重新算(2x → 24,884×16,588,42 credits)。",
        "原来的结果卡保留在列表里,不覆盖。",
      ],
      errors: ["待定(spec §9):单次最大输出尺寸 fal 没写明,已知 ~103 MP 能跑通;上限实测确定后在尺寸预览处拦截。"],
    },
    {
      title: "异常情况",
      what: "Upscale Image 工具页的异常分支汇总。",
      rules: [
        "未上传图片:「Upscale」按钮禁用,悬停提示「Upload an image to upscale.」;按钮里先不显示积分(还不知道尺寸,不估算)。结果区是空态「Your upscaled images show up here」。",
        "积分不足:点「Upscale」→ 弹「Not enough credits」,列出 Needed / Your balance,「Nothing was charged.」;不扣费、不建任务,关掉弹窗后参数不变。",
        "离开后回来:任务在后台继续,回来接着等结果;只在提交时扣一次,不重复扣费。开发原型里任务和余额存在 sessionStorage;本页不存,刷新即重来。",
      ],
      errors: [
        "格式不支持(如 .bmp / .tiff / .pdf):上传时就拦截,不进上传位;顶部 toast「This format isn't supported. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.」。支持 jpg、jpeg、png、webp、gif、avif、heic、heif,文件选择框也只列这些。",
        "格式对但读不出图(文件损坏):toast「We couldn't read this image. Try another file.」。",
        "处理失败 / 超时:结果卡显示「Upscale failed. Your credits have been refunded.」+「Retry」;失败即全额退积分,Retry 按同一张图、同一组参数重跑并重新扣积分,余额不够弹积分不足弹窗。",
        "安全检查不通过:结果卡显示「This image can't be processed.」,全额退积分,不提供 Retry(同一张图重跑结果一样),用户可在左栏换一张图。",
      ],
    },
    {
      title: "Upscale Video 工具页",
      what: "入口 Video › Upscale Video(2026-11-05 加，模型 fal-ai/seedvr/upscale/video)。页面和交互全部照 Upscale Image:左栏上传 + 参数 +「Generate ✦ 积分」;右侧没有记录时是功能演示，有记录时是生成历史。",
      rules: [
        "上传：MP4 / MOV / WEBM / M4V,最长 60 秒(上限待确认);上传后显示视频预览、文件名 · 宽 × 高 · 时长，可 Replace / ×。",
        "参数(字段对照 fal schema):Upscale Mode Factor / Target;Upscale Factor 1–10(滑杆 + 数字框，步长 0.1,默认 2,改过后出橡皮擦重置);Target Resolution 720p / 1080p / 1440p / 2160p(默认 1080p,只在 Target 显示);Noise Scale 0–1(默认 0.1);Output Format MP4 / WEBM / MOV / GIF(对应 X264 / VP9 / PRORES4444 / GIF,默认 MP4);Output Quality Low / Medium / High / Max(默认 High);Output Write Mode Fast / Balanced / Small(默认 Balanced)。Seed 不开放;安全检查和 sync_mode 后端写死。每项标题旁 ⓘ 有一句说明。",
        "积分:fal 按输出视频像素量收费($0.001 / 百万像素，宽 × 高 × 帧数),和 Upscale Image 同一个换算(0.1 credit / MP);帧数按 30fps 估。",
        "空状态：标题「Sharper videos, up to 4K」+ 一句描述 + 可拖动的前后对比视频(同一条视频，左边加模糊模拟低清),整体在结果区居中。",
        "生成历史：每条一张卡，参考视频封面在上，一行「SeedVR · 参数」,右上角删除;生成中是 Generating 占位(最高 260px);成功直接放结果视频 + Download / Favorites / Upscale again(结果当新源视频，倍数回到 2x)。",
      ],
      errors: [
        "格式不支持:toast「This format isn't supported. Use MP4, MOV, WEBM or M4V.」;读不出:「We couldn't read this video. Try another file.」;超过 60 秒:「Videos can be up to 60 seconds for now.」。",
        "生成失败：卡片显示「Upscale failed. Your credits have been refunded.」+ Retry(重新扣积分);积分不足弹「Not enough credits」。",
        "原型限制：结果视频就是原视频(fixture),不调真实模型。",
      ],
    },
    {
      title: "模型加工类工具页(Motion Control / Character Swap / 3D to Video / Lip Sync / Talking Avatar)",
      what: "2026-11-05 从 Video Gen 的模式里拆出来：这些都是「拿一个现成素材做一件固定的事」,做成和 Upscale Image 一样的工具页(左栏素材 + 选项 + 积分 + 主按钮，右侧结果)。一套页面按配置驱动(model-tools/specs.ts),每个字段和取值都按 fal API 核对过;标题旁的小标是用的模型。",
      rules: [
        "Video › Motion Control(Kling 3.0 Motion Control):Character 照片 + Motion video;Character orientation「Like the video」(复杂动作，视频 ≤30s)/「Like the image」(跟镜头，≤10s);Quality Standard / Pro(两个端点);Keep original sound 开关;提示词选填。",
        "Video › Video Character Swap(MiniMax H3 Max recast):Video 5–30s + New people 1–4 张(从左到右替换);Enhance realism 开关;Resolution 768p / 1080p;提示词选填(谁换谁)。",
                "Video › 3D to Video(MiniMax H3 Max 3d-to-video):3D render ≤15s + 可选 Look references ≤8;Looks to generate(没给参考图时 AI 生成几张);Resolution 480p–1080p;提示词选填。",
        "Avatar › Lip Sync:顶部模型下拉(2026-11-06 加 MiniMax H3 Max)= Kling LipSync(默认，能打字生成语音，视频 2–10s)/ MiniMax H3 Max(视频对口型接口 lip-sync/video-to-video,和 Talking Avatar 用的照片接口是两个;视频 5s–15 分钟，只能上传音频，选项 If Lengths Differ(音视频不一样长时:Trim 裁到较短 / Loop 视频循环 / Bounce 来回播放 / Pad 音频补静音)和 Resolution 480p / 768p)。Kling LipSync:先传 Video 2–10s,紧跟着问「What should they say?」:Upload audio(传 2–60s 音频)/ Type a script(Script 框不显示字数 → Voice → Speed 步进器 − 1x +)。Voice 一行显示当前音色(名字 + 性别 · 语言 · 风格),点了打开产品的音色弹窗「Select a voice」(2026-11-06,同 Audio 生成的弹窗：音色卡片可试听，右上 Gender / Language / Style 筛选，选中打勾，点卡片即选中并关闭)。Kling Lip Sync 只认 fal 枚举里的固定 voice_id,不支持克隆音色，所以弹窗只有 Preset Voice,没有 Clone voice / My Voice;列的是枚举里的 7 个英文音色(Commercial lady、Reader、UK man、Calm narrator、Global man、UK boy、UK grandpa)。",
        "Avatar › Talking Avatar:顶部模型下拉(2026-11-06 由两张卡改成下拉，选项下一行只写模型特点)= Kling AI Avatar v2 Pro(表情和头部动作自然，可写表演提示词，音频最长 5 分钟)/ MiniMax H3 Max(一张照片做长讲话视频，音频最长 15 分钟,下拉说明 2026-11-06 改成「Long talking videos from one photo」,原来的「Tight lip sync」像在说改口型,Read the speech first 开关、Resolution 480p–2K,没有提示词框);积分在 Generate 按钮上(没传音频时显示每秒价);换模型时已放的照片和音频保留。",
        "Insert Shot(H3 Max insert-video,在视频中间插一个新镜头)2026-11-05 评审后去掉：剪辑器里就能做(生成一个镜头再剪进去),不单独做工具页。",
        "Video Reframe 不单独做页：它和 Video Resize 的「Expand」是同一件事(MiniMax H3 Max reframe-video),菜单里去掉了 Video Reframe。",
        "共用交互：每个素材格是 72×72 缩略图，右上角 ✕ 删除(鼠标悬停出现;手机等触屏设备常显，点击区 32px);未满时有「+」格;只有一个素材的工具(Voice Clone)用大拖放区，主按钮不跳);也可以把文件拖进左栏，一次可拖多个(每个放进第一个类型对得上、还有空位的格子;放不下的提示「Added 5 of 7 files. There's no spot for the rest.」)。On / Off 类选项是开关行(标签 + 一句说明 + 开关),标签一律句首大写。按钮不能点时下方灰字写原因(如「Add a video.」「Type what they should say.」「Tick the box to confirm it's your voice.」)。提示词框占位文字加深;手机上输入框 16px(iOS 不自动放大);所有可点项有品牌色键盘焦点环。",
        "结果卡：卡头 = 这次用的素材缩略图 + 写结果的标题(Moves copied / New cast / Relit video / Rendered video / New words, synced / Your photo, talking)+ 人话摘要(如「Faces like the video · Pro quality · Original sound kept」)+ 积分;右上「Result / 原素材」切换对比;底部 Download、Save to Assets、Try other settings(把这次的素材和选项放回左栏),右边一行「API request」链接展开端点和请求 JSON。生成中可以 Cancel(积分退回)。手机上点生成后自动滚到结果。",
        ";用自己的文件时回放原素材(2026-11-06 去掉了「Demo · plays your upload」角标，结果和真实产品一样直接显示);Video Character Swap 暂无演示成片。",
      ],
      errors: [
        "素材时长超范围:按钮置灰 + 原因，如「Motion video can be up to 30s.」「Motion videos can be up to 10s when facing like the image.」「Voice audio needs to be at least 5s.」。",
        "生成失败：结果卡写「Generation failed. Your credits have been refunded.」+ Retry;积分不足弹「Not enough credits」。",
      ],
    },
    {
      title: "Remove Object / Inpaint 画笔页",
      what: "入口 Image › Remove Object(预选 Remove 模式)和 Image › Inpaint(预选 Replace 模式),两个菜单项打开同一个画笔页。上传图片 → 在图上用画笔涂要改的地方 → Remove:直接去掉(不用写字);Replace:再写一句「What should go here?」→ 生成 → Before / After 对比。依据调研第 4 轮:Remove 用 fal-ai/bria/eraser(只要图 + 遮罩),Replace 用 fal-ai/qwen-image-edit/inpaint(图 + 遮罩 + prompt)。",
      rules: [
        "标题跟着模式换:Remove =「Remove Object」,Replace =「Inpaint」;左栏「Mode」分段 Remove / Replace,切换后侧边栏选中项同步变成 Remove Object / Inpaint,已涂的遮罩保留。",
        "上传:点击或拖拽(JPG / PNG / WEBP / GIF / AVIF / HEIC),提示「Try brushing over the white circle behind her.」)。上传后右侧是画布:原图上叠半透明橙色遮罩层。",
        "画笔:鼠标按住拖、手指直接涂(画布上禁止页面滚动);鼠标悬停时显示圆形笔刷大小。工具「Brush / Eraser」切换(橡皮擦掉遮罩);「Brush size」滑块 1–100;「Undo / Redo / Clear mask」(清空也能撤销)。画布获焦时 Cmd/Ctrl+Z 撤销、Shift+Cmd/Ctrl+Z 重做、[ ] 调笔刷大小。",
        "画布下方实时显示「Mask covers N% of the image」;超过 50% 提示「Large areas may look less natural.」(不拦)。",
        "Replace 模式多一个输入框「What should go here?」(最多 300 字,右上角计数)。",
        "积分(占位价,待定价):Remove 每次 2 credits、Replace 每次 3 credits;原图大于 4 百万像素按 2 倍。没涂时显示「–」。按钮文案:「Remove」/「Replace」。",
        "结果(最新在上):标签「Removed」或「Replaced」+ 描述 + 尺寸;Before / After 拖动对比(与 Upscale Image 同一个组件,手指可拖);「Download」(PNG);「Edit this result」= 结果当新原图放回画布、遮罩清空,接着改下一处。",
        "生成中卡片显示原图半透明 + 动画「Removing… / Painting…」;离开页面任务继续;完成 toast「Object removed」/「Area replaced」。",
      ],
      errors: [
        "按钮禁用 + 悬停提示:没图「Upload an image first.」、没涂「Brush over what you want to remove.」/「Brush over the area to replace.」、Replace 没写描述「Describe what should go here.」。",
        "格式不支持 / 读不出来:toast,不扣费。积分不足:「Not enough credits」弹窗。",
        "处理失败:全额退积分,卡片「Editing failed. Your credits have been refunded.」+「Retry」(重新扣费)。下载失败:toast 带 Retry。",
        "原型限制:结果是前端现算的——Remove 用周围像素把遮罩区填平(纯色背景上看起来就是东西没了),Replace 在填平后叠一层按描述换色的图案,不是真的按描述画;导出遮罩的格式(黑底白遮罩、原图像素)已写在代码里,真实接入时传给模型。",
      ],
    },
    {
      title: "Virtual Try-On / Model Swap 工具页",
      what: "入口 Image › Virtual Try-On(预选 Try-On)和 Image › Model Swap(预选 Model Swap),两个菜单项打开同一页。Try-On:人物照 + 服装照 → 人物穿上这件衣服;Model Swap:原图(模特穿着这套衣服)+ 新模特照 → 衣服换到新模特身上。模型 FASHN v1.6(fal-ai/fashn/tryon/v1.6),Model Swap = 原图当服装图、garment_photo_type 固定 model。",
      rules: [
        "标题跟着模式换:「Virtual Try-On」/「Model Swap」;左栏顶部分段「Try-On / Model Swap」,切换后侧边栏选中项同步;两种模式各记各的两张图,来回切不丢。",
        "两个上传位并排(中间箭头):Try-On =「Person」→「Garment」;Model Swap =「Source photo」→「New model」。空位点击或把文件拖到该位上传;拖到左栏其他地方 = 放进第一个空位。已传的图右上 × 移除、底部「Replace」换图。。",
        "「Garment category」:Tops / Bottoms / One-piece(对应 FASHN category)。Try-On 多一个「Garment photo」:Flat-lay(单独的服装图)/ On model(别人穿着的图)(对应 garment_photo_type),下面一行说明;Model Swap 不显示这一项,改成灰底说明「The outfit is taken from the source photo…」。",
        "「Results」1 / 2 / 3 / 4:一次出几张(对应 num_samples)。积分(占位价):每张 3 credits,如 2 张 = 6。按钮「Try it on」/「Swap model」。",
        "结果按次分组(最新在上):组头是两张输入的缩略图 + 模式 + 类别 / 服装照类型 / 张数;每张生成中显示动画「Dressing…」,完成后「Download」(JPG)和「换一个用」按钮:Try-On 的结果放回 Person 位(再试下一件)、Model Swap 的结果放回 Source photo 位。整组完成后 toast「Your try-on is ready」/「Your model swap is ready」。",
        "样例:Try-On 人物 = 白色针织上衣的女生,服装 = 橙色罗纹背心(别人穿着,服装照类型自动切到 On model);Model Swap 原图 = 穿橙色背心的女生,新模特 = 穿米色毛衣的男生。都是仓库里的无品牌人像。",
      ],
      errors: [
        "按钮禁用 + 悬停提示:缺图时提示缺哪张(如「Add a garment.」),两个位放了同一张图「Use two different photos.」。",
        "类别选 Bottoms / One-piece 但人物照只有半身(样例图手标了半身):黄色提示「This photo doesn't show the lower body — use a full-body photo for bottoms.」/「Use a full-body photo for one-pieces.」,不拦。",
        "格式不支持 / 读不出来:toast,不扣费。积分不足:「Not enough credits」弹窗。单张失败:那一张全额退积分 +「Retry」,其他张不受影响。",
        "原型限制:结果是前端把服装区域的纹理叠到人物上身(羽化、正片叠底),看得出换了衣服但不是真实模型效果,结果区底部写明「Prototype preview…」;仓库里没有无品牌的平铺服装图,样例只有 On model;上传自己的图时上身位置按画面下半中间估算。",
      ],
    },
    {
      title: "Photo Angle Editor 工具页",
      what: "入口 Image › Photo Angle Editor。上传一张图 → 选预设或拖动相机 / 滑块定视角 → 一次最多生成 4 个视角。模型 fal-ai/qwen-image-edit-2511-multiple-angles,入参是数值:horizontal_angle、vertical_angle、zoom。",
      rules: [
        "预设(圆角 chip,当前视角是预设时高亮):Front(0°, 0°)、¾ Left(−45°)、¾ Right(+45°)、Top-down(垂直 +60°)、Low angle(垂直 −30°),缩放都是 1×。",
        "「Camera」小部件:中间是主体,地面一圈轨道,橙色相机点可以拖(左右 = 水平角、上下 = 垂直角),键盘方向键每次 5°。下面三个滑块:Horizontal angle −90°…+90°(步长 5°)、Vertical angle −30°…+60°(步长 5°)、Zoom 0.5×…2×(步长 0.1);从 0° / 1× 往两边填色。三者联动,标题右侧显示当前视角名(预设名,或「H +30° · V −10° · 1.2×」)。",
        "右侧「Preview」实时显示当前视角的粗略效果(原图做透视变换,角标「Preview」,说明「Rough preview — the model re-renders the scene from this angle.」)。",
        "「Add this angle」把当前视角加进「Angles to generate」列表(n/4);列表里点名字 = 载回控件,× 删除;已在列表里的显示「Added」,满 4 个显示「4 angles max」。列表为空时直接生成当前这一个。",
        "积分(占位价):每个视角 2 credits;按钮「Generate N angles」。结果按次分组,每个视角一张(标视角名),完成后「Download」和「Edit from this angle」(把这个视角载回控件)。完成 toast「New angles are ready」。",
      ],
      errors: [
        "没图:按钮禁用 + 提示「Upload an image first.」。重复加同一视角 / 超过 4 个:toast 说明。",
        "格式不支持 / 读不出来:toast,不扣费。积分不足:「Not enough credits」弹窗。单张失败:全额退那一张的积分 +「Retry」。",
        "原型限制:结果是原图 + CSS 透视变换(卡片角标「Preview」),不是真的换视角重绘;Download 拿到的是原图文件(按视角改名,如 portrait-h45-v0-z1.png)。",
      ],
    },
  ],
  canvas: [
    {
      title: "和视频生成模式共用一个画布",
      what: "2026-11-05 起本原型和「视频生成模式」(/prototypes/video-gen-modes)是同一个画布：最上面一行「Image」是图片节点(工具页 Open in canvas 带来的图，没有就用样图),下面每家公司一行视频模型节点，每个节点下的输入框都展开。",
      rules: [
        "图片节点的 toolbar、Upscale 浮层、计价和下面几节一样;放大结果出现在右边并用连线连上，结果还能再放大。",
        "视频节点的交互见「视频生成模式」原型的画布说明。",
        "2026-11-06 起第二行「Video」:视频 / 音频节点，工具栏上能用 Upscale、Lip Sync、Character Swap、Motion Control、3D to Video;图片节点工具栏多一个 Talking Avatar。浮层和工具页同一套配置，当前节点自动填进素材位，详见「视频生成模式」画布说明的「Video 分组」。",
      ],
    },
    {
      title: "图片 toolbar",
      what: "画布(扩展自 v1.12 hybrid-reel 画布)里的图片节点。选中就绪的图片节点 → 节点上方浮出 toolbar:Upscale / Download Image / Favorites / 删除。",
      rules: [
        "Upscale 的位置参照竞品位置,放在 toolbar 第一个。",
        "图片像素还没读到时 Upscale 置灰,提示「Image size isn't available yet.」(从工具页带进来的图自带像素,不用等加载)。",
        "Download Image 下载原文件、原格式;放大结果悬停提示带文件大小(如「Download Image · 38.2 MB」),下载中按钮显示「Downloading NN%」。",
        "Favorites(心形)收藏 / 取消,顶部提示「Added to Favorites」/「Removed from Favorites」,和工具页一致。",
        "hybrid-reel 原画布不出现这条 toolbar,原流程不受影响。",
        "画布不加新侧边栏:画布是整屏 + 浮动顶栏(真实产品画布也没有侧边栏);左上角 logo 按钮回到产品首页(本页切回「主页」)。",
      ],
    },
    {
      title: "参数浮层",
      what: "点 toolbar 的 Upscale → 锚在节点右侧弹出参数浮层「Upscale · SeedVR」,内容和工具页同一套参数区 + 尺寸预览 + 预计积分。",
      rules: [
        "浮层记住上一次的参数;点浮层外 / 按 Esc 关闭(下拉开着时 Esc 先收下拉)。",
        "点浮层里的「Upscale」→ 浮层关闭,在原节点右侧生成新节点,原图不覆盖。",
      ],
    },
    {
      title: "生成中",
      what: "确认放大后,原节点右侧新增一个放大节点(处理中),以连线连到原图。",
      rules: [
        "确认即扣积分(10x = 16 credits,右上角余额 35,600 → 35,584)。",
        "处理中节点显示「Upscaling…」,不显示进度百分比和预计时长。",
        "放大节点不进剪辑器:选中时右侧没有「+ → Video Editor」菜单。",
        "原型限制:工具页和画布的余额不互相同步——进画布时带的是当时工具页的余额,画布里扣的积分不会回写。",
      ],
      errors: ["处理中删掉节点:请求取消,扣的积分退回。"],
    },
    {
      title: "完成与连线",
      what: "放大完成:新节点显示结果图,标题「Upscaled · 10x」,连线 原图 → 结果。",
      rules: [
        "节点直接渲染原图(如 15,360×10,240),不做缩略图。",
        "结果节点本身也是图片节点:选中后 toolbar 同样有 Upscale / Download Image / 删除。",
      ],
    },
    {
      title: "链式放大",
      what: "对结果节点再放大一次:源图 → 2x(3,072×2,048)→ 再 2x(6,144×4,096)。",
      rules: [
        "第二次的源是第一次的结果节点,连线 源 → 结果 1 → 结果 2,不连回最早的源。",
        "积分按「当前这个源」的像素算:第一次 1 credit,第二次 3 credits。",
      ],
    },
    {
      title: "异常情况",
      what: "画布入口的异常分支汇总。",
      rules: ["积分不足:浮层里点 Upscale 余额不够 → 画布沿用画布现有的积分不足弹窗,不扣费、不建节点。"],
      errors: [
        "放大失败:节点显示标题「Upscale failed」+「Your credits have been refunded.」,积分全额退回;节点上有「Retry」→ 同一张源图、同一组参数重跑,重新扣积分(余额不够弹画布的积分不足弹窗)。源图节点已被删除时不显示 Retry。",
        "安全检查不通过:节点显示「Upscale failed」+「This image can't be processed.」,积分退回,不提供 Retry。",
        "放大中撤销掉节点再重做回来:那次请求已作废,节点显示失败态,可 Retry。",
        "画布不存工程(persist=false):刷新会丢掉画布里进行中的放大节点,余额回到从工具页带进来的数;画布续跑随 T10 一起做。",
      ],
    },
  ],
};
