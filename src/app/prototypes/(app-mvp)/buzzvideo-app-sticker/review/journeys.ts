import { INITIAL2, type JobS, type State2 } from "../app/store";
import { DEMO_EDIT_DRAFT } from "../app/screens/Editor";
import type { AnyAction } from "../../buzzvideo-app/app/demo";

/** 一步旅程 = 一组预置状态 + 这一屏的交互说明 */
export type Step = {
  id: string;
  title: string;
  /** 第二版状态的覆盖项 */
  preset?: Partial<State2>;
  /** 第一版状态:out = 未登录(走第一版的引导和登录) */
  auth?: "out";
  /** 借第一版评审原型某一步的预置状态和页面(登录、付费、设置这些状态还是第一版在管) */
  v1?: string;
  /** 借第一版那一步之后再多做的几步(第一版没有单独一步的状态，如弹相机权限) */
  v1Extra?: AnyAction[];
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
const QUIET: Partial<State2> = quiet;
const CREATE: Partial<State2> = { ...quiet, tab: "create" };

/** 每一步的内容(按功能写);左栏的分组和顺序见下面的 GROUPS */
const SRC: Group[] = [
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
        notes: ["双列瀑布流，视频卡片静音自动循环播放;顶部分类 Trending / Pets / Dance / Cinematic / Funny / Effects(组件库 KChip)，Trending 按做同款次数排序。", "卡片(组件库 KDiscoverCard):封面带 Hot 标和做同款次数，下面标题、作者、点赞;朋友做过的卡片下面多一行橙字「Lily +2 made this」。", "点卡片进单条视频，上下滑的顺序和当前分类一致。"],
        edge: ["某个分类没有内容:显示空状态并引导回 Trending。"],
      },
      {
        id: "following",
        title: "Following(还没关注创作者)",
        preset: { ...quiet, homeTab: "following" },
        notes: ["先从认识的人开始：顶部是朋友(互相关注的人)的新作品故事圈(渐变圈 = 没看过，灰圈 = 看过)，点进去看他的新视频。", "下面「Creators your friends follow」:推荐创作者卡片，每张写哪个朋友关注了他;点 Follow 后这一页变成他们的全屏视频流。"],
        edge: ["还没有互关的朋友：故事圈不显示，只显示热门创作者。(不请求通讯录授权，「朋友」= 互相关注的人)"],
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
          "激励只给「在 BuzzVideo 公开发布」——For You 里的视频全部是用户真实发布的作品。主按钮「Post to BuzzVideo · +20 credits」(每天第一条 +20,占位);发布后进 For You,任何人都能做同款。",
          "「Who can see this」:Everyone(默认，进 For You,有积分)/ Only me(只出现在「我的 › Videos」带锁，不进 For You、没有积分和火苗;选了之后隐藏外部同步，按钮变「Post privately」)。", "下面一行「Also post to (optional)」:TikTok / Reels / WhatsApp / 存相册，默认不勾，只是顺手同步，没有奖励。",
          "按钮下面一行「Goes to For You」+ 做过这条的朋友会先看到。右上「Try another」回到做同款重来;左上 × 不发，留在「我的」当草稿。",
        ],
        edge: ["发布奖励每天一次;今天拿过后按钮只写「Post to BuzzVideo」。", "内容审核不通过:不发布，提示原因，草稿保留。"],
      },
      {
        id: "celebrate",
        title: "发完 · 第一批反应",
        preset: { ...quiet, twin: "ready", tab: "me", xp: 80, postStreak: 7, postedToday: true, posts: [myPost], claimed: ["firstPost"], progress: { ...INITIAL2.progress, firstPost: 1 }, celebrate: { myId: "my-demo", postId: "scooter", srcId: "poodle", bonus: 20, xp: 50, levelUp: false } },
        notes: [
          "作品卡片弹出来，红色「LIVE ON BUZZVIDEO」;下面播放数、点赞数实时往上跳，旁边是到账积分。",
          "火苗 +1,并和朋友比:「You beat Max (5). Lily is on 9.」",
          "告诉用户通知了谁:「We told Lily, Max and Zoe. They made this too.」;再下面是等级条和这次涨的经验值。这次让等级升级时，标题换成「Level up!」加新称号。",
          "主按钮回首页接着刷;下面文字按钮去看自己主页。不再推「分享到外部平台拿积分」。",
        ],
        edge: ["今天已经发过：火苗不再 +1。", "今天的发布奖励已拿完：第三个数字显示经验值而不是积分。"],
      },
      {
        id: "remix-low",
        title: "积分不足 → 付费墙",
        v1: "low-free",
        preset: { ...quiet, twin: "ready", stack: [{ name: "remix", postId: "poodle" }], toast: "Not enough credits" },
        notes: ["点中间大圆时积分不够这一次：顶部红色提示「Not enough credits」,同时打开付费墙(Free 用户);会员先给积分包(沿用第一版)。", "买好回来留在做同款，主角和剧情都还在。"],
      },
      {
        id: "remix-failed",
        title: "生成失败",
        preset: { ...quiet, twin: "ready", jobs: [{ ...job("done", 1), failed: "Our servers were too busy to finish it. Give it another go." } as JobS], stack: [{ name: "result", jobId: "job-demo" }] },
        notes: ["生成中途失败：原版封面上贴一颗红色「Didn't work」,写清原因，下面一颗黄油色「N credits back」——这次扣的积分已经退回。", "Try again 用同样的主角和剧情重新做;Back to feed 回首页。"],
      },
      {
        id: "post-blocked",
        title: "审核不通过",
        preset: { ...quiet, twin: "ready", jobs: [job("done", 1)], stack: [{ name: "result", jobId: "job-demo" }], toast: "Couldn't post. This video may break our community guidelines. It's saved in your drafts." },
        notes: ["点 Post 后内容审核没过：不发布，顶部红色提示写原因，成品留在「我的」当草稿，可以 Try another 换一个再做。"],
      },
      {
        id: "c-create",
        title: "Create · 空状态",
        v1: "create",
        preset: CREATE,
        notes: [
          "底部 Create 是唯一的创作入口(「我的」空状态、任务中心的 Go、官方消息也都跳到这里)。流程沿用第一版的对话式创作，样式换成新版设计。",
          "最上面「Trending」热门玩法轮播：宠物电影明星、房子飘走、名画走上街、1920s 派对、一起跳舞、水果肥皂剧，点中间那张把提示词和模式填进输入框。",
          "下面是工具：AI Director / 生成图片 / 生成视频 / 配音和音乐 / 照片变视频 / 会说话的照片 / 换装 / 去背景…(去掉了 Link to Ad、Product Photo 这类商家工具);再下面「Or remix a video from Home」，可以带分身、宠物、朋友出镜。",
          "两句一键提示词:「Turn my cat into a Renaissance painting」「Make my selfie dance like a K-pop idol」。",
        ],
        edge: ["左上 ☰ 历史对话：长按置顶 / 重命名 / 删除(沿用第一版)。"],
      },
      {
        id: "c-plan",
        title: "AI Director 出计划 → 确认",
        v1: "agent-plan",
        preset: CREATE,
        notes: ["写一句话(如「Turn my dog into a 1920s movie star」)发送，AI Director 先给三个镜头的计划，点 Confirm 才扣积分开始做。", "第一次发送要同意 AI 数据授权;第一次生成会问要不要推送(都沿用第一版)。"],
        edge: ["Free 用户计划里有视频：点 Confirm 弹付费墙。", "断网：发送置灰，草稿保留。"],
      },
      {
        id: "c-video-result",
        title: "结果卡 → Post",
        v1: "video-result",
        preset: CREATE,
        notes: ["做好了在对话里出结果卡，点开全屏看;点 Post 进发布页——和做同款是同一个发布页，同样有平台奖励和发完的庆祝页。"],
        edge: ["生成失败：积分自动退回，结果卡上 Retry。"],
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
      {
        id: "twin-camera",
        title: "录分身 · 相机权限",
        v1: "acct-free",
        v1Extra: [{ type: "requestPermission", kind: "camera" }],
        preset: { ...quiet, stack: [{ name: "twin" }] },
        notes: ["说明页点 Agree and continue:第一次弹系统相机权限框(照真机，不改);允许后直接进录制。"],
      },
      {
        id: "twin-denied",
        title: "相机被拒绝 → 去设置",
        v1: "acct-free",
        v1Extra: [{ type: "setPermission", kind: "camera", value: "denied" }, { type: "showSettingsAlert", kind: "camera" }],
        preset: { ...quiet, stack: [{ name: "twin" }] },
        notes: ["之前拒绝过相机：不能再弹系统框，改弹「去设置里打开相机」的系统提示，点 Settings 跳到 iOS 设置(沿用第一版)。"],
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
        id: "comment-blocked",
        title: "评论违规 · 不发出",
        preset: { ...quiet, sheet: { name: "comments", postId: "poodle" }, toast: "Couldn't post your comment. It may break our community guidelines." },
        notes: ["评论里有违规内容：不发出，顶部红色提示写原因;输入框里的字保留，改一改可以再发。"],
      },
      {
        id: "share",
        title: "分享",
        preset: { ...quiet, sheet: { name: "share", postId: "poodle" } },
        notes: ["三排：第一排直接发给朋友(头像);第二排外部平台 TikTok / Instagram / WhatsApp / 复制链接;第三排操作 Remix / 存视频 / 不感兴趣 / 举报。", "分享到外部平台没有奖励(激励只给在 BuzzVideo 公开发布)。"],
      },
      {
        id: "profile",
        title: "创作者主页",
        preset: { ...quiet, stack: [{ name: "profile", userId: "mochi" }] },
        notes: ["渐变圈头像、@名字、简介;「Followed by Lily and Max」(朋友也关注了)。", "数据三栏:Followers / Likes / Remixed(被做同款的总次数，用主色)。", "关注按钮就在 @名字 旁边：橙色 Follow,关注后变灰色 Following。作品网格，热门的带「N remixes」角标，点作品看单条、再做同款。"],
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
          "新手任务(一次性：创建分身、邀请好友)和每日任务(零点重置：发布、点赞 5 条、做同款 3 条;没有分享到外部平台的任务)。按钮 Go → Claim → Done(组件库 KMissionRow)。发布类在发布时自动到账，这里直接是 Done。",
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
    label: "剪辑器",
    color: "#0d9488",
    steps: [
      {
        id: "ed-pick",
        title: "选素材 · 系统相册",
        preset: { ...quiet, stack: [{ name: "editor", seed: "pick" }] },
        notes: ["从 Create 的「Edit」模式，或工具条 Video Editor / Auto Captions / AI B-roll、结果卡和成品页的「Edit」进来;先弹 iOS 系统照片选择器(照真机)，多选实拍片段，右上 Add (n)。", "导入后自动(免费)开始看素材找缺口;第一次导入两段以上，先问要不要「AI 一键成片」。"],
        edge: ["没给相册权限：系统权限框;拒绝过 → 去设置提示(沿用第一版)。", "片段超过 10 分钟：只用前 10 分钟并提示。"],
      },
      {
        id: "ed-autoedit",
        title: "AI 一键成片 · 问一次",
        preset: { ...quiet, stack: [{ name: "editor", seed: "autoedit" }] },
        notes: ["第一次导入两段以上弹出：「Let AI make the first cut?」——按音乐卡点剪、配转场和字幕，之后什么都能改，免费。", "Auto edit / I'll edit myself 二选一;一级工具栏最前面也有「Auto edit」随时再用。"],
      },
      {
        id: "ed-autoedited",
        title: "AI 一键成片 · 出第一版",
        preset: { ...quiet, stack: [{ name: "editor", seed: "autoedited" }] },
        notes: ["每段剪到 4 秒内卡点、片段之间配 Zoom / Swipe 转场(按钮变橙)、Vivid 滤镜、音乐 Runway Strut,字幕开始识别;顶部提示「Here's a first cut」。", "时间线上同时出现天蓝「+ AI shot」标记：AI 觉得还缺的镜头。"],
      },
      {
        id: "ed-main",
        title: "剪辑器主界面(剪映版式)",
        preset: { ...quiet, stack: [{ name: "editor", seed: "main" }] },
        notes: ["顶栏：✕(退出，自动存草稿)· 分辨率胶囊(720P / 1080P,点了进导出设置)· 橙色 Export。", "预览下面一行：左边时间码 00:02 / 00:17,中间播放，右边撤销 / 重做 / 全屏。", "时间线：刻度(时间 · 点);刻度下面一排天蓝「+ AI shot」是导入后 AI 免费找到的缺镜头位置，点了打开 AI B-roll。主轨最左是「关闭原声」和「封面」,片段是帧条，片段之间是领结形转场按钮，末尾白色 +;下面是「Add text」「Add audio」空轨。中间白色播放头;右下 −/+ 缩放时间线(也支持双指捏合)。", "底部一级工具栏：Auto edit · Edit · AI B-roll(右上角数字 = 还没补的缺口)· Audio · Text · Captions · Filters · Ratio,横滑，右边渐隐提示还有;点 Edit / Audio / Text 进二级工具栏(左边 « 返回)。"],
        edge: ["离开剪辑器：自动存草稿，「我的」里继续。", "断网：AI 功能提示需要联网，手动剪辑照常。"],
      },
      {
        id: "ed-clip",
        title: "选中片段 · 二级工具",
        preset: { ...quiet, stack: [{ name: "editor", seed: "clip" }] },
        notes: ["点主轨片段：白框 + 两头白色裁切把手，按住拖动裁头尾(最多拖回原长);长按片段进排序。二级工具栏：Split(在播放头处切开)· Speed · Volume · Filters · Reverse · Duplicate · Replace(重新从相册选)· Delete。所有操作都能撤销 / 重做。"],
        edge: ["播放头不在片段中间点 Split:提示先把播放头移进片段。"],
      },
      {
        id: "ed-reorder",
        title: "长按排序",
        preset: { ...quiet, stack: [{ name: "editor", seed: "reorder" }] },
        notes: ["长按任意片段：片段都缩成一样大的方块(剪映的样子)，按住拖到新位置松手;右下「Drag to reorder · Done」。排序能撤销。"],
      },
      {
        id: "ed-speed",
        title: "变速",
        preset: { ...quiet, stack: [{ name: "editor", seed: "speed" }] },
        notes: ["0.5× / 1× / 1.5× / 2× / 3×,时间线上片段长度跟着变，片段左上角标「2×」;人声保持音调。", "Volume 面板同样形式：静音 / 50% / 100% / 150% / 200%。"],
      },
      {
        id: "ed-transition",
        title: "转场",
        preset: { ...quiet, stack: [{ name: "editor", seed: "transition" }] },
        notes: ["点片段之间的白色按钮：None / Fade / Zoom / Swipe / Spin / Glitch,右上「Apply to all」;选了转场的按钮变橙色(AI morph 是天蓝)。", "最后一个是「AI morph · 20」:用前一段的结尾和后一段的开头生成一段过渡镜头(扣积分，占位)。"],
        edge: ["积分不足：红色提示 + 付费墙。"],
      },
      {
        id: "ed-filters",
        title: "滤镜",
        preset: { ...quiet, stack: [{ name: "editor", seed: "filters" }] },
        notes: ["一排缩略图预览：None / Vivid / Warm / Film / B&W / Pastel / Cinema,点了预览立刻换;右上「Apply to all」。片段左上角标滤镜名。"],
      },
      {
        id: "ed-broll-start",
        title: "AI B-roll · 开始",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-start" }] },
        notes: ["同网页版 Hybrid Reel 的思路：一句话说明「我们会看完你的 N 段素材，找出故事里缺的镜头，用 AI 补上;每段约 4 秒、50 积分」+ 按钮 Find missing shots(找缺口免费)。"],
      },
      {
        id: "ed-broll-analyzing",
        title: "AI B-roll · 正在看素材",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-analyzing" }] },
        notes: ["「Watching your clips…」:检查开头、剪接点和结尾。免费。"],
      },
      {
        id: "ed-broll",
        title: "AI B-roll · 找到的缺口",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll" }] },
        notes: ["导入后已经免费分析好，打开就是缺口列表(时间线上的「+ AI shot」点进来也是这里)。每个缺口一行：角色(Hook / Cutaway / Ending)+ 位置(开头 / 第 2 段后 / 结尾)+ 为什么缺 + 镜头描述(可以改)+ 右边「Preview」免费先看一帧。默认勾选重要的。", "底部按钮实时写「Make 2 shots · 100 credits」,点了扣积分，AI 镜头按位置插进主轨。"],
        edge: ["积分不足：红色提示 + 付费墙(会员 → 积分包，沿用第一版)。"],
      },
      {
        id: "ed-broll-preview",
        title: "AI B-roll · 免费预览一帧",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-preview" }] },
        notes: ["花积分前先看样子：点 Preview 出一张静帧缩略图(免费);改了镜头描述，预览清空重新看。", "每段 AI 镜头还送一次免费重做。"],
      },
      {
        id: "ed-broll-making",
        title: "AI B-roll · 生成中",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-making" }] },
        notes: ["插进主轨的位置先出现天蓝描边的占位片段，写进度百分比;预览里显示「Making AI shot N%」。可以继续剪别的。"],
      },
      {
        id: "ed-broll-ready",
        title: "AI B-roll · 插好了",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-ready" }] },
        notes: ["生成好的镜头变成正常帧条，左上角标「AI」，预览左上贴「AI shot」。可以像普通片段一样剪、变速、加滤镜;二级工具多一个 Remake:第一次免费(「Remake · free」),之后 50 积分。"],
      },
      {
        id: "ed-broll-failed",
        title: "AI B-roll · 生成失败",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll-failed" }] },
        notes: ["失败的片段红色描边写 Failed,积分自动退回;选中后二级工具「Retry · 50」重新生成。"],
      },
      {
        id: "ed-captions-start",
        title: "自动字幕 · 开始",
        preset: { ...quiet, stack: [{ name: "editor", seed: "captions-start" }] },
        notes: ["Text → Auto captions(标 FREE):先选说话的语言(Auto-detect / English / Spanish / French)，可以打开「Add Spanish translation」双语字幕，再点 Make captions。识别中显示「Listening… N%」。"],
      },
      {
        id: "ed-captions",
        title: "自动字幕 · 选样式",
        preset: { ...quiet, stack: [{ name: "editor", seed: "captions" }] },
        notes: ["字幕铺在文字轨上(白色块、黑字);8 套样式横向滑(Classic / Yellow box / Hormozi / Karaoke / Pop by word / Black box / Neon / Bubble),点了预览立刻换。下面按钮「Edit N captions」进剪字幕。"],
      },
      {
        id: "ed-bilingual",
        title: "双语字幕",
        preset: { ...quiet, stack: [{ name: "editor", seed: "bilingual" }] },
        notes: ["打开「Add Spanish translation」:每句字幕下面多一行小一号的西语(欧美市场常见英西双语)。"],
      },
      {
        id: "ed-captions-edit",
        title: "剪字幕",
        preset: { ...quiet, stack: [{ name: "editor", seed: "captions-edit" }] },
        notes: ["逐句列出，直接改字;播放头所在那句高亮。每句右边：剪刀 = 在播放头处切成两句，垃圾桶 = 删掉这句。", "调时间：点左边的时间进入这句，出现 Start / End 各一组 −/+(每次 0.1 秒);时间线上这句字幕块外圈变橙、两头出白色把手，也能直接拖。点文字轨上的字幕块也进这里。"],
        edge: ["播放头不在这句里点剪刀：提示先把播放头移进这句。"],
      },
      {
        id: "ed-nospeech",
        title: "自动字幕 · 没听到人声",
        preset: { ...quiet, stack: [{ name: "editor", seed: "nospeech" }] },
        notes: ["视频里没人说话：写「No speech found」,按钮 Add text 去加文字。"],
      },
      {
        id: "ed-text",
        title: "添加文字",
        preset: { ...quiet, stack: [{ name: "editor", seed: "text" }] },
        notes: ["输入一句话点 Add,在播放头位置加 3 秒文字(白色块，放在文字轨);预览里大字显示在画面上方。可以删除。"],
      },
      {
        id: "ed-audio",
        title: "音频 · 二级工具",
        preset: { ...quiet, stack: [{ name: "editor", seed: "audio" }] },
        notes: ["Music · Sound FX(Whoosh / Pop / Record scratch…,加在播放头位置)· Voiceover(点一下录，再点停)· Extract audio(从视频里提取声音)。音效和录音是粉色小块，叠在音频轨上。"],
      },
      {
        id: "ed-music",
        title: "音乐",
        preset: { ...quiet, stack: [{ name: "editor", seed: "music" }] },
        notes: ["4 首示例曲(写情绪和时长)，点 Use 加到音频轨(黄油色波形)，再点取消。", "每首标版权：「Safe for TikTok & Reels」或黄色「BuzzVideo only」(发到其他 APP 可能被静音)。"],
      },
      {
        id: "ed-export",
        title: "导出设置 · 去水印",
        preset: { ...quiet, stack: [{ name: "editor", seed: "export" }] },
        notes: ["分辨率 720p / 1080p(Free 选 1080p 带 PAID → 付费墙)、帧率 30 / 60、「Remove watermark」开关(会员默认打开;Free 带 PAID,点了弹付费墙)、预计大小;含 AI 镜头 / AI 转场时写「labeled “Contains AI” when posted」。"],
        edge: ["断网：提示导出需要联网。"],
      },
      {
        id: "ed-exporting",
        title: "导出中",
        preset: { ...quiet, stack: [{ name: "editor", seed: "exporting" }] },
        notes: ["全屏百分比 + 进度条，可以取消;草稿一直保存着。"],
      },
      {
        id: "ed-export-failed",
        title: "导出失败",
        preset: { ...quiet, stack: [{ name: "editor", seed: "export-failed" }] },
        notes: ["进度条变红，写「Your draft is safe」，Try again / Cancel。"],
      },
      {
        id: "ed-exported",
        title: "导出完成(Free · 带水印)",
        preset: { ...quiet, stack: [{ name: "editor", seed: "exported" }] },
        notes: ["成片预览右下角「Made with BuzzVideo」水印，下面写分辨率 / 帧率 / 时长 / with watermark,再一行紫色「Remove watermark with Starter ›」直接去付费墙。", "主按钮「Post to BuzzVideo · +20 credits」进发布页(同做同款)，公开发布才有积分;「Share to…」弹 iOS 系统分享面板、「Save」存相册——发到其他 APP 没有奖励。"],
      },
      {
        id: "ed-exported-clean",
        title: "导出完成(去水印)",
        preset: { ...quiet, stack: [{ name: "editor", seed: "exported-clean" }] },
        notes: ["会员或开了去水印：成片没有水印，信息行写 no watermark。"],
      },
      {
        id: "ed-exported-music",
        title: "导出完成 · 音乐版权提醒",
        preset: { ...quiet, stack: [{ name: "editor", seed: "exported-music" }] },
        notes: ["用了「BuzzVideo only」的曲子：按钮下面黄色提醒「这首只授权 BuzzVideo,发到 TikTok / Instagram 可能被静音」。发到 BuzzVideo 不受影响。"],
      },
      {
        id: "ed-post",
        title: "发布页(剪辑作品)",
        preset: { ...quiet, twin: "ready", jobs: [{ ...job("done", 1), id: "job-edit", postId: "poodle", title: "My edit", withTwin: false, fromCreate: true, fromEdit: true, hasAi: true } as JobS], stack: [{ name: "result", jobId: "job-edit" }] },
        notes: ["和做同款同一个发布页，但按剪辑作品改：右上「Back to edit」回到时间线(没有 Try another 和「原版」贴纸);文案默认空，提示「Say something about it」;底部写「Goes to For You. Anyone can remix it.」。", "含 AI 镜头 / AI 转场：画面右下自动贴天蓝「Contains AI」(TikTok / IG 也在做 AI 内容标识)。", "公开发布才有积分;勾的外部平台只是顺手同步，没有奖励。发布后草稿里的剪辑工程自动删掉。"],
      },
      {
        id: "ed-draft",
        title: "我的 · 剪辑草稿",
        preset: { ...quiet, tab: "me", edits: [DEMO_EDIT_DRAFT] },
        notes: ["点 ✕ 离开剪辑器：自动存成草稿，顶部提示「Saved to your drafts in Me」。", "「我的」作品格子最前面是剪辑草稿，贴天蓝「Editing」;点了回到原来的时间线(片段、字幕、音乐都在)。"],
      },
      {
        id: "ed-share",
        title: "分享到其他 APP · 系统分享面板",
        preset: { ...quiet, stack: [{ name: "editor", seed: "share" }] },
        notes: ["iOS 系统分享面板(照真机):文件名和时长、TikTok / Instagram / WhatsApp / 信息，下面 Copy / Save Video / Save to Files。"],
      },
      {
        id: "ed-low",
        title: "AI 功能 · 积分不足",
        v1: "low-free",
        preset: { ...quiet, stack: [{ name: "editor", seed: "broll" }], toast: "Not enough credits" },
        notes: ["AI B-roll / AI 转场积分不够：顶部红色提示，Free 打开付费墙(会员先给积分包，沿用第一版);买好回来剪辑器的内容都还在。"],
      },
    ],
  },
  {
    label: "我的",
    color: "#64748b",
    steps: [
      {
        id: "me-private",
        title: "我的 · 作品(公开 + 仅自己可见)",
        preset: { ...quiet, twin: "ready", tab: "me", postStreak: 7, posts: [{ id: "my-private", postId: "poodle", caption: "Mochi's movie debut", likes: 0, remixes: 0, shared: [], private: true }, myPost], edits: [DEMO_EDIT_DRAFT] },
        notes: ["Videos 里按时间排：剪辑草稿(天蓝 Editing)→ 仅自己可见的作品(白色 Only me + 锁)→ 公开作品(做同款数 / 置顶)。", "仅自己可见的作品不进 For You、不算粉丝和里程碑。"],
      },
      {
        id: "me-empty",
        title: "我的(新用户)",
        preset: { ...quiet, tab: "me", postStreak: 0 },
        notes: [
          "顶部：左边积分胶囊(点了进任务中心);右边任务中心(可领奖励数)、消息(未读数)、设置(沿用第一版)。",
          "渐变圈头像(没发过作品是灰圈)、名字旁火苗天数、渐变等级徽章「LV 1 · NEWCOMER」和离下一级还差多少 XP。",
          "数据三栏:Following / Followers / Remixed you(被做同款次数，主色)——做内容的人最在乎的是影响力。两个按钮：创建分身、邀请好友(沿用第一版)。",
          "Daily credits 一行七格，点了进任务中心。",
          "三栏 Tab:Videos / Saved / Likes。Videos 是自己的全部作品：公开发布的、仅自己可见的(白色「Only me」带锁贴纸)、草稿;分身做的视频也在这里，不单独一栏。Saved 和 Likes 仅自己可见。空状态写「Your friends are already remixing — join in」+ 按钮。",
        ],
      },
      { id: "acct-free", title: "Free 用户", v1: "acct-free", preset: { ...quiet, tab: "me" }, notes: ["名字旁一颗白色「Free」身份贴纸;左上积分胶囊是注册送的积分。", "设置里 Subscription 显示 Free,点进去是付费墙。"] },
      { id: "acct-starter", title: "Starter 用户", v1: "acct-starter", preset: { ...quiet, tab: "me" }, notes: ["名字旁天蓝色「Starter」贴纸;左上是会员每月积分。"] },
      { id: "acct-pro", title: "Pro 用户", v1: "acct-pro", preset: { ...quiet, tab: "me" }, notes: ["名字旁橙色「Pro」贴纸。"] },
      { id: "acct-ultra", title: "Ultra 用户", v1: "acct-ultra", preset: { ...quiet, tab: "me" }, notes: ["名字旁黑色「Ultra」贴纸(白模切边)。"] },
      { id: "acct-enterprise", title: "Enterprise 用户", v1: "acct-enterprise", preset: { ...quiet, tab: "me" }, notes: ["在组织空间时名字旁是黑色「Enterprise」贴纸，积分是组织积分;切回 Personal 显示个人套餐。", "工作区切换、成员管理沿用第一版。"] },
      {
        id: "me-posts",
        title: "我的(有作品和草稿)",
        preset: { ...quiet, tab: "me", twin: "ready", postStreak: 7, posts: [myPost], jobs: [job("done", 1)], likes: ["kings", "fruit", "collie"], saves: ["poodle", "museum"], xp: 90 },
        notes: ["有生成好没发的草稿时出现提醒条(组件库 KNudge)「1 draft ready to post」，写现在发能拿多少积分，点 Post 回到成品页发布。", "网格(组件库 KGridCell):草稿带 Draft，生成中带进度;最新一条作品带 Pinned，被做过同款的带「23 remixes」角标。", "点已发布的作品进单条视频，分享面板里带当天的外部平台奖励。"],
      },
    ],
  },
  {
    label: "登录",
    color: "#0f766e",
    steps: [
      {
        id: "login",
        title: "引导页",
        auth: "out",
        notes: [
          "从桌面点图标 → 启动页 → 引导页。背景片是信息流往上刷 3 条 AI 视频(梦核飘浮房子 → 名画走上街 → 头巾小狗)。主标题「Bring any idea to life」，副标题「Type an idea or drop a photo. Watch it become a video in seconds.」，橙底白字 Get started 进登录。",
          "背景片：信息流卡片往上刷 3 条设计感强的 AI 视频(梦核房子、20 年代舞会、爱丽丝)，点赞爆心、评论气泡，6 秒无缝循环。",
        ],
        edge: ["弱网 / 视频加载失败：只显示首帧封面，按钮照常可点。", "系统开了「减少动态效果」:文案和按钮直接出现。"],
      },
      {
        id: "login-page",
        title: "登录页",
        auth: "out",
        v1: "login-page",
        notes: ["三种登录:Continue with Apple / Google / email。Apple、Google 弹的是系统样式的授权面板(照真机，不改)。", "底部写服务条款和隐私政策链接。登录成功后按身份分流：新用户看首登付费墙，老用户 / 会员直接进首页。"],
        edge: ["登录失败 / 断网：顶部提示，可重试。"],
      },
      {
        id: "email-login",
        title: "邮箱登录 · 输入邮箱",
        auth: "out",
        v1: "email-login",
        notes: ["输入邮箱，格式对了 Continue 才能点，发 6 位验证码。"],
        edge: ["邮箱格式不对：输入框下面一行红字。"],
      },
      {
        id: "email-code",
        title: "邮箱登录 · 验证码",
        auth: "out",
        v1: "email-code",
        notes: ["6 格验证码，填满自动校验;60 秒后可以重发，也可以改邮箱。"],
        edge: ["验证码错误 / 过期：提示并可重发。"],
      },
    ],
  },
  {
    label: "付费",
    color: "#b45309",
    steps: [
      { id: "first-paywall", title: "首登付费墙", v1: "first-paywall", preset: QUIET, notes: ["新 Free 用户登录后弹出，默认选 Starter 年付;Starter / Pro / Ultra 三档，月付 / 年付切换。", "Free 用户的 ✕ 3 秒后才出现;Restore purchases 在底部。"], edge: ["拉不到 App Store 价格：显示重试，不显示价格。"] },
      { id: "exit-offer", title: "挽留页", v1: "exit-offer", preset: QUIET, notes: ["关首登付费墙时满足条件就弹：限时优惠价 + 倒计时(24 小时内有效)。"], edge: ["优惠过期：不再弹;拉价失败：显示重试。"] },
      { id: "p-video", title: "付费墙 · Free 想做视频", v1: "video-locked", preset: CREATE, notes: ["Create 里 Free 用户切到 Video 模式会弹付费墙，标题按入口写清为什么要升级。"] },
      { id: "p-low", title: "付费墙 · 积分不足", v1: "low-free", preset: CREATE, notes: ["Free 积分不够这次生成：弹付费墙;会员积分不足先给积分包。"] },
      { id: "p-iap", title: "App Store 确认", v1: "first-paywall-iap", preset: QUIET, notes: ["点 Continue 后弹系统的 App Store 确认面板(照真机，不改)，双击侧边按钮 / Face ID 付款。"], edge: ["内购失败：顶部提示，留在付费墙。"] },
      { id: "p-bought", title: "购买成功", v1: "first-paywall-bought", preset: { ...QUIET, tab: "me" }, notes: ["付款成功回到「我的」，积分和会员标签换档。"] },
      { id: "p-topup", title: "积分包", v1: "low-member", preset: CREATE, notes: ["会员积分不足时弹：几档积分包，买完立刻到账。"] },
    ],
  },
  {
    label: "设置",
    color: "#475569",
    steps: [
      { id: "settings", title: "设置页", v1: "settings", preset: { ...QUIET, tab: "me" }, notes: ["「我的」右上 ⚙ 进来：订阅、恢复购买、通知、邀请好友、帮助与反馈、条款隐私、退出登录、删除账号。"] },
      { id: "sub-manage", title: "订阅管理", v1: "sub-manage", preset: { ...QUIET, tab: "me" }, notes: ["当前套餐、续费日、升级 / 降级、管理订阅(跳 App Store)。"], edge: ["网页订阅的会员：提示去网页管理。"] },
      { id: "invite", title: "邀请好友", v1: "invite", preset: { ...QUIET, tab: "me" }, notes: ["分享邀请链接，好友注册后双方都拿积分;显示已邀请人数和奖励进度。"], edge: ["奖励已满 10 位：继续能邀请，但不再加积分。"] },
    ],
  },
];

/** 左栏分组和顺序跟「完整用户旅程图」一致(Monica:这边也要按照顺序) */
const ORDER: { label: string; color: string; ids: string[] }[] = [
  { label: "1 · 首次打开 APP", color: "#2f6fed", ids: ["login", "login-page", "email-login", "email-code", "first-paywall", "exit-offer", "daily"] },
  { label: "2 · 刷视频", color: "#ff5e1a", ids: ["foryou", "inspiration", "following", "comments", "comment-blocked", "share", "profile"] },
  { label: "3 · 做同款 Remix", color: "#8b5cf6", ids: ["template", "remix", "generating", "result", "celebrate", "remix-low", "remix-failed", "post-blocked", "twin", "twin-ready", "twin-camera", "twin-denied"] },
  { label: "4 · 创作 Create", color: "#0891b2", ids: ["c-create", "c-plan", "c-video-result"] },
  { label: "5 · 剪辑器 Editor", color: "#0d9488", ids: ["ed-pick", "ed-autoedit", "ed-autoedited", "ed-main", "ed-clip", "ed-reorder", "ed-speed", "ed-transition", "ed-filters", "ed-broll-start", "ed-broll-analyzing", "ed-broll", "ed-broll-preview", "ed-broll-making", "ed-broll-ready", "ed-broll-failed", "ed-low", "ed-captions-start", "ed-captions", "ed-bilingual", "ed-captions-edit", "ed-nospeech", "ed-text", "ed-audio", "ed-music", "ed-export", "ed-exporting", "ed-export-failed", "ed-exported", "ed-exported-clean", "ed-exported-music", "ed-share", "ed-post", "ed-draft"] },
  { label: "6 · 付费", color: "#16a34a", ids: ["p-video", "p-low", "p-iap", "p-bought", "p-topup"] },
  { label: "7 · 签到与激励", color: "#ca8a04", ids: ["rewards", "challenges", "challenge"] },
  { label: "8 · 社交与消息", color: "#db2777", ids: ["inbox"] },
  { label: "9 · 我的与设置", color: "#64748b", ids: ["me-empty", "me-posts", "me-private", "acct-free", "acct-starter", "acct-pro", "acct-ultra", "acct-enterprise", "settings", "sub-manage", "invite"] },
];
const SRC_STEPS = SRC.flatMap((g) => g.steps);
export const GROUPS: Group[] = ORDER.map(({ label, color, ids }) => ({ label, color, steps: ids.map((id) => SRC_STEPS.find((x) => x.id === id)!) }));
if (SRC_STEPS.length !== ORDER.reduce((n, g) => n + g.ids.length, 0)) console.warn("review/journeys: 有步骤没放进左栏分组");

export const ALL_STEPS = GROUPS.flatMap((g) => g.steps.map((s) => ({ ...s, group: g })));
