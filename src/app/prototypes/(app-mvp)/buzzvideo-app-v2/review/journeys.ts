import { INITIAL2, type State2 } from "../v2/store";

/** 一步旅程 = 一组预置状态 + 这一屏的交互说明 */
export type Step = {
  id: string;
  title: string;
  /** 第二版状态的覆盖项 */
  preset?: Partial<State2>;
  /** 第一版状态:out = 未登录(走第一版的引导和登录) */
  auth?: "out";
  /** 功能说明 */
  notes: string[];
  /** 异常与边界 */
  edge?: string[];
};
export type Group = { label: string; color: string; steps: Step[] };

const job = (status: "running" | "done", progress: number) => ({ id: "job-demo", postId: "poodle", title: "She said she's not doing interviews today", prompt: "A poodle in white sunglasses poses like a movie star", withTwin: true, progress, status });
const myPost = { id: "my-demo", postId: "scooter", caption: "My version 👀 @lily your turn", likes: 128, remixes: 23, shared: ["tiktok" as const] };
/** 其他步骤里不再触发签到横幅和新手提示 */
const quiet = { claimedToday: true, streak: 3, coach: false };

export const GROUPS: Group[] = [
  {
    label: "打开 APP",
    color: "#2f6fed",
    steps: [
      {
        id: "daily",
        title: "签到自动到账",
        preset: { claimedToday: false, streak: 2, coach: false },
        notes: [
          "签到不弹窗:每天第一次回到首页，积分自动到账，顶部滑下一条横幅「Day 3 · 15 credits added」，写明明天能拿多少，4 秒后自己收起;点横幅进任务中心。",
          "7 天奖励依次为 10 / 10 / 15 / 15 / 20 / 20 / 50(占位，待运营定)，第 7 天领完从头开始。进度在「我的 › Daily credits」一行七格里看。",
          "签到天数和「火苗」(连续发作品天数)是两件事：签到只管领积分，火苗只有发作品才涨。",
        ],
        edge: ["断签:任意一天没打开，签到天数归零，从第 1 天重新算。", "付费墙、挽留面板开着时不到账，关掉后再到账，横幅不盖在它们上面。", "断网:不到账也不出横幅;任务中心里显示「Claim」按钮可以手动补领。"],
      },
      {
        id: "foryou",
        title: "For You · 社交证明",
        preset: { ...quiet, coach: true },
        notes: [
          "一屏一条视频，上下滑切换，只播放当前这条。9:16 铺满;16:9、4:3、1:1 按原比例居中、上下留黑，不裁切。单击暂停，双击点赞冒大爱心。",
          "顶栏:左边消息(带未读数)，三个频道 Following / Inspiration / For You 在整屏宽度居中，右边搜索。积分不放首页，画面留给内容。",
          "右侧操作列(组件库):作者头像 + 关注加号 · 点赞 · 评论 · 收藏 · 分享 · Remix 小卡(封面白边小卡 + 渐变笔角标，照即梦「拍同款」)。",
          "左下从上到下：橙色趋势标签「#1 Trending in Pets」(只有热门视频有)、作者名、文案和标签，最后一条「Lily + 2 friends made this」——认识的人在做，比数字更让人想点。没有朋友做过时显示「N remixes」。",
          "点 Remix 小卡或「friends made this」都进同款页(像 TikTok 点音乐碟进音乐页)。",
          "第一次进来在 Remix 小卡旁边显示提示「Tap to see everyone's version」，进任意二级页后不再出现。",
          "底部栏(组件库方案 A):贴底黑条 Home / Create / Me，内容区底部 16pt 圆角;Create 是渐变描边胶囊，点了进 Create 页。有可领奖励时 Me 上有红点。",
        ],
        edge: ["视频加载失败:显示封面图 + 重试。", "已关注的作者不显示关注加号。", "作者关闭了「允许做同款」:不显示 Remix 小卡和朋友那一条。"],
      },
      {
        id: "inspiration",
        title: "Inspiration 瀑布流",
        preset: { ...quiet, homeTab: "inspiration" },
        notes: ["双列瀑布流，顶部分类 Trending / Pets / Dance / Cinematic / Funny / Effects(组件库 KChip)，Trending 按做同款次数排序。", "卡片(组件库 KDiscoverCard):封面带 Hot 标和做同款次数，下面标题、作者、点赞;朋友做过的卡片下面多一行橙字「Lily +2 made this」。", "点卡片进单条视频，上下滑的顺序和当前分类一致。"],
        edge: ["某个分类没有内容:显示空状态并引导回 Trending。"],
      },
      {
        id: "following",
        title: "Following(还没关注创作者)",
        preset: { ...quiet, homeTab: "following" },
        notes: ["先从认识的人开始：顶部是朋友的新作品故事圈(渐变圈 = 没看过，灰圈 = 看过)，点进去看他的新视频。", "下面「Creators your friends follow」:推荐创作者卡片，每张写哪个朋友关注了他;点 Follow 后这一页变成他们的全屏视频流。"],
        edge: ["没有朋友(没授权通讯录、也没有互关):故事圈不显示，只显示热门创作者。"],
      },
    ],
  },
  {
    label: "做同款 Remix",
    color: "#8b5cf6",
    steps: [
      {
        id: "template",
        title: "同款页 · 一个梗的所有版本",
        preset: { ...quiet, stack: [{ name: "template", postId: "poodle" }] },
        notes: [
          "头图:原视频封面(点了播放)、标题、原作者、做同款总数和播放数，「+392 today」写今天又多了多少人做。",
          "朋友行:「Lily, Max and 1 more friend made this」。",
          "三栏 Top / Friends / New;有朋友做过时默认 Friends。第一格永远是「Your turn」(自己的头像 + 加号)，点了直接开做。朋友的版本带橙色 Friend 标。",
          "底部固定渐变按钮「Remix this」。右上分享整个同款页(发给朋友一起做)。",
        ],
        edge: ["没有朋友做过：不显示朋友行和 Friends 栏，默认 Top。", "原视频被删：同款页保留，头图显示「Original removed」，已有版本照常展示。"],
      },
      {
        id: "remix",
        title: "做同款 · 主角轮盘",
        preset: { ...quiet, twin: "ready", stack: [{ name: "remix", postId: "poodle" }] },
        notes: [
          "像拍照选滤镜：上面是原视频预览，标签写当前选的主角(「Starring you」);底部一排圆形主角——原角色 / 我(分身) / 我的宠物 / 上传照片。",
          "选中的那个放大到中间，外圈品牌渐变，轻轻呼吸;再点一下它就是生成。下面一行小字写消耗的积分和预计时间。",
          "剧情一句话(可选):直接改，或点 Shuffle 换一句建议;风格一排胶囊(Original / Anime / Claymation / Cinematic / Y2K)。全程可以不打字。",
          "右上是积分胶囊。模型、比例、时长不出现，用默认值。",
        ],
        edge: ["还没建分身时「我」上有「+50」角标，点了进分身创建，建好回来自动选中「我」。", "积分不足:toast 提示并打开付费墙(沿用第一版)。", "键盘弹起时轮盘收起，右下出现 Generate 按钮。"],
      },
      {
        id: "generating",
        title: "生成中",
        preset: { ...quiet, twin: "ready", jobs: [job("running", 0.42)], stack: [{ name: "result", jobId: "job-demo" }] },
        notes: ["中间是渐变圈里的主角头像(换成了自己就是自己)，下面百分比和一句当前在做什么。", "再推一把:「Lily's version got 2.1K likes. Yours is next.」", "「Keep scrolling」回首页接着刷，任务在后台继续;做好了在「我的 › Posts」最前面，带进度。"],
        edge: ["生成失败:退回积分，显示失败原因和 Try again。", "生成中杀掉 APP:再打开时在「我的」里能看到结果。"],
      },
      {
        id: "result",
        title: "成品 · 发布并拿出去炫",
        preset: { ...quiet, twin: "ready", jobs: [job("done", 1)], stack: [{ name: "result", jobId: "job-demo" }] },
        notes: [
          "成品全屏播放，左上固定一个原版小窗(「原版 vs 我的」)，右下水印「Made with BuzzVideo」——分享出去的视频都带，回流新用户。",
          "文案默认「My version 👀 @lily your turn」,@ 的是做过这条的朋友;右边 @ 按钮再加人。",
          "下面一排圆形平台:TikTok、Reels 各带「+30」角标，WhatsApp、存相册没有奖励;默认勾 TikTok。按钮上实时写「Post & earn 50 credits」(发布 +20,每个平台 +30，均为占位)。",
          "按钮下面一行:做过这条的朋友会先看到。右上「Try another」回到做同款重来;左上 × 不发，留在「我的」当草稿。",
        ],
        edge: ["奖励每天各一次;今天拿过的平台不再显示 +30,都拿过时按钮只写 Post。", "外部平台分享被用户取消:该平台的奖励不发。", "内容审核不通过:不发布，提示原因，草稿保留。"],
      },
      {
        id: "celebrate",
        title: "发完 · 第一批反应",
        preset: { ...quiet, twin: "ready", tab: "me", xp: 80, postStreak: 7, postedToday: true, posts: [myPost], claimed: ["firstPost", "shareTikTok"], progress: { ...INITIAL2.progress, firstPost: 1, shareTikTok: 1 }, celebrate: { myId: "my-demo", postId: "scooter", srcId: "poodle", bonus: 50, xp: 50, levelUp: false } },
        notes: [
          "作品卡片弹出来，红色「LIVE ON BUZZVIDEO」;下面播放数、点赞数实时往上跳，旁边是到账积分。",
          "火苗 +1,并和朋友比:「You beat Max (5). Lily is on 9.」",
          "告诉用户通知了谁:「We told Lily, Max and Zoe. They made this too.」;再下面是等级条和这次涨的经验值。这次让等级升级时，标题换成「Level up!」加新称号。",
          "主按钮继续推还没拿过奖励的平台(「Also share to Instagram · +30」);次按钮回首页;最下面文字按钮去看自己主页。",
        ],
        edge: ["今天已经发过：火苗不再 +1。", "今天的发布奖励已拿完：第三个数字显示经验值而不是积分。"],
      },
      {
        id: "play",
        title: "Create 页",
        preset: { ...quiet, stack: [{ name: "play" }] },
        notes: [
          "底部栏 Create 进来。最上面是「Trending now」热门玩法网格(像滤镜货架):封面、Hot / New 标、做过的人数，朋友做过的右下角有头像。点任一个 = 带着示例进做同款。",
          "中间两张横卡：分身(没建时写 +50)、正在进行的挑战(投稿数、奖励、Live 标)。",
          "下面「Or start from scratch」:自由输入框，左边加图、出镜，右边渐变 Generate(写消耗积分)。最下面 Pro mode 入口(第一版的 Marketing Agent)。",
        ],
        edge: ["自由输入为空时 Generate 置灰。"],
      },
    ],
  },
  {
    label: "分身 My Twin",
    color: "#0891b2",
    steps: [
      {
        id: "twin",
        title: "创建分身",
        preset: { ...quiet, stack: [{ name: "twin" }] },
        notes: ["三步：说明和同意 → 对着镜头读三个数字(约 3 秒) → 生成分身。说明页写「Lily, Max and Zoe already have one」。", "建好后奖励 50 积分(在任务中心领)，之后做同款时在轮盘里选「我」。", "分身只有本人能用，可以在设置里删除。"],
        edge: ["没给相机 / 麦克风权限：弹系统权限框，拒绝后引导去系统设置(沿用第一版)。", "检测不到人脸或读错数字：提示重录。"],
      },
      {
        id: "twin-ready",
        title: "分身已建好",
        preset: { ...quiet, twin: "ready", progress: { ...INITIAL2.progress, twin: 1 }, stack: [{ name: "twin" }] },
        notes: ["显示分身头像，两个操作：去找视频出镜、重新录制。"],
      },
    ],
  },
  {
    label: "社交",
    color: "#db2777",
    steps: [
      {
        id: "comments",
        title: "评论",
        preset: { ...quiet, sheet: { name: "comments", postId: "poodle" } },
        notes: ["贴底面板(组件库):视频在后面继续播。朋友的评论排最前，名字后面带「Friend」;作者回复带橙色「Creator」。", "底部输入条，有内容时右侧出现主色发送键，发出后排在最前面。"],
        edge: ["评论含违规内容：不发出，提示原因。"],
      },
      {
        id: "share",
        title: "分享",
        preset: { ...quiet, sheet: { name: "share", postId: "poodle" } },
        notes: ["三排：第一排直接发给朋友(头像);第二排外部平台 TikTok / Instagram / WhatsApp / 复制链接;第三排操作 Remix / 存视频 / 不感兴趣 / 举报。", "分享自己的作品时，TikTok、Instagram 上带当天还能拿的「+30」角标。"],
      },
      {
        id: "profile",
        title: "创作者主页",
        preset: { ...quiet, stack: [{ name: "profile", userId: "mochi" }] },
        notes: ["渐变圈头像、@名字、简介;「Followed by Lily and Max」(朋友也关注了)。", "数据三栏:Followers / Likes / Remixed(被做同款的总次数，用主色)。", "Follow(关注后变灰色 Following) + 「Remix their top video」直接进他最火那条的同款页。作品网格，热门的带「N remixes」角标。"],
      },
      {
        id: "inbox",
        title: "消息 Activity",
        preset: { ...quiet, posts: [myPost], postStreak: 7, stack: [{ name: "inbox" }] },
        notes: [
          "首页左上铃铛、「我的」右上铃铛进来;标题右边是自己的火苗天数。",
          "顶部朋友新作品故事圈;下面里程碑卡(橙色渐变)「Your remix hit 1K views」。",
          "挑战入口固定一行，副标题写朋友参加了哪个。",
          "通知按人合并:「Lily, Zoe and 21 others remixed your video」(带 +5 积分);「Max challenged you」直接带 Remix 按钮;「Lily posted for the 9th day in a row」;新关注带 Follow back。最下面是官方消息。",
        ],
        edge: ["还没发过作品：没有里程碑卡和「我的作品」相关通知，只有朋友动态和官方消息。"],
      },
    ],
  },
  {
    label: "激励",
    color: "#16a34a",
    steps: [
      {
        id: "rewards",
        title: "任务中心",
        preset: { ...quiet, postStreak: 6, progress: { ...INITIAL2.progress, like5: 5, remix3: 2 }, stack: [{ name: "rewards" }] },
        notes: [
          "最上面是签到七格(已自动到账，只看进度);当天没到账时(比如断网)这里出现 Claim 按钮补领。",
          "「Posting streak with friends」:和朋友比连续发作品天数的小排行，自己的名字用主色;下面一句提醒今天发没发。",
          "新手任务(一次性：创建分身、邀请好友)和每日任务(零点重置：发布、分享到 TikTok / Instagram、点赞 5 条、做同款 3 条)。按钮 Go → Claim → Done(组件库 KMissionRow)。发布和分享类在发布时自动到账，这里直接是 Done。",
        ],
        edge: ["每日任务跨天未领：作废，不累计。"],
      },
      {
        id: "challenges",
        title: "挑战活动列表",
        preset: { ...quiet, stack: [{ name: "challenges" }] },
        notes: ["进行中的排前面：封面带 Live / Ended 标，标题、奖励;底部写投稿数和日期，朋友参加了的前面带头像。"],
      },
      {
        id: "challenge",
        title: "挑战活动详情",
        preset: { ...quiet, stack: [{ name: "challenge", id: "pets" }] },
        notes: ["大封面、标题、时间和投稿数;朋友行「Lily, Max, Zoe are in. Lily is ranked #214.」;奖励卡、说明、规则。", "「Top entries」带排名角标 #1 #2…，点进去上下滑看。", "底部渐变按钮「Join the challenge」:报名并进第一个示例的同款页;报名后变成「Make my entry」。"],
        edge: ["活动已结束：不显示底部按钮，只能看。"],
      },
    ],
  },
  {
    label: "我的",
    color: "#64748b",
    steps: [
      {
        id: "me-empty",
        title: "我的(新用户)",
        preset: { ...quiet, tab: "me", postStreak: 0 },
        notes: [
          "顶部：左边积分胶囊(点了进任务中心);右边任务中心(可领奖励数)、消息(未读数)、设置(沿用第一版)。",
          "渐变圈头像(没发过作品是灰圈)、名字旁火苗天数、渐变等级徽章「LV 1 · NEWCOMER」和离下一级还差多少 XP。",
          "数据三栏:Following / Followers / Remixed you(被做同款次数，主色)——做内容的人最在乎的是影响力。两个按钮：创建分身、邀请好友(沿用第一版)。",
          "Daily credits 一行七格，点了进任务中心。",
          "四栏图标 Tab:Posts / Twin / Saved / Likes;Saved 和 Likes 仅自己可见。空状态写「Your friends are already remixing — join in」+ 按钮。",
        ],
      },
      {
        id: "me-posts",
        title: "我的(有作品和草稿)",
        preset: { ...quiet, tab: "me", twin: "ready", postStreak: 7, posts: [myPost], jobs: [job("done", 1)], likes: ["kings", "fruit", "collie"], saves: ["poodle", "museum"], xp: 90 },
        notes: ["有生成好没发的草稿时出现提醒条(组件库 KNudge)「1 draft ready to post」，写现在发能拿多少积分，点 Post 回到成品页发布。", "网格(组件库 KGridCell):草稿带 Draft，生成中带进度;最新一条作品带 Pinned，被做过同款的带「23 remixes」角标。", "点已发布的作品进单条视频，分享面板里带当天的外部平台奖励。"],
      },
    ],
  },
  {
    label: "沿用第一版",
    color: "#374151",
    steps: [
      {
        id: "login",
        title: "引导页 · 登录 · 付费墙 · 设置",
        auth: "out",
        notes: [
          "引导页是第二版自己的(2026-11-11):主标题「Bring any idea to life」，副标题「Watch and create fun AI videos.」，渐变按钮 Get started 进登录。",
          "背景片沿用第一版的结构和动效(信息流卡片往上刷 3 条、点赞爆心、评论气泡，6 秒无缝循环)，换成 3 条设计感强的 AI 视频：梦核飘浮的房子、20 年代舞会、爱丽丝;去掉 Sponsored / Shop now,左下改成创作者 +「Made with BuzzVideo」，评论改成对作品的反应(How is this AI?! / Making mine tonight)。",
          "登录、系统权限框、付费墙、订阅管理、设置、邀请好友直接用第一版的设计，详细说明看第一版评审原型:/prototypes/buzzvideo-app/review。",
        ],
        edge: ["弱网 / 视频加载失败：只显示首帧封面，按钮照常可点。", "系统开了「减少动态效果」:文案和按钮直接出现，不做淡入。"],
      },
    ],
  },
];

export const ALL_STEPS = GROUPS.flatMap((g) => g.steps.map((s) => ({ ...s, group: g })));
