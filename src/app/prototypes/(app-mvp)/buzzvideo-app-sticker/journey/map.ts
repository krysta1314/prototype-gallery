/**
 * 新版设计 · 完整用户旅程图(2026-11-11,Monica:「像之前 Figma 一样，在一个页面上看完所有用户旅程，分组式的」)。
 * 一页一张大画布，按组从上到下排：首次打开 → 刷视频 → 做同款 → 创作 → 付费 → 签到与激励 → 社交与消息 → 我的与设置。
 * 每组一块画布(格子 col / row,画法同第一版的旅程图 FlowPage):每个节点是一台缩小的真机，挂这一步的预置状态;
 * 线上写点了什么 / 什么条件。节点 id = 步骤 id(见 STEPS)。
 */
import { FLOWS, type FlowSection } from "../../buzzvideo-app/review/flows";
import { INITIAL2, type State2 } from "../app/store";
import { ALL_STEPS } from "../review/journeys";
import { JOURNEYS as V1 } from "../../buzzvideo-app/review/journeys";
import type { AnyAction } from "../../buzzvideo-app/app/demo";

/** 一步 = 一张截图的预置状态 */
export type MapStep = {
  id: string;
  title: string;
  /** 借第一版旅程的预置状态(登录、付费、创作这些还是第一版在管) */
  v1?: string;
  /** 借第一版那一步之后再多做的几步(第一版没有单独一步的状态，如重发验证码) */
  v1Extra?: AnyAction[];
  /** 截图里弹起的键盘(默认用第一版那一步的) */
  keyboard?: "email" | "number";
  /** 第一版没登录(引导、登录页) */
  out?: boolean;
  /** 第二版 / 新版设计的状态覆盖 */
  v2?: Partial<State2>;
  /** 对应评审原型里的哪一步(点截图跳过去);没有就不跳 */
  review?: string;
};

/** 其他步骤里不出现签到横幅和新手提示 */
const QUIET: Partial<State2> = { claimedToday: true, streak: 3, coach: false };
const CREATE: Partial<State2> = { ...QUIET, tab: "create" };

/** 新版设计原型自己的步骤:直接用评审原型的预置 */
// v1 一定要带上：评审步骤和下面借第一版的步骤同 id,STEPS.find 先找到这里，丢了 v1 截图就会退回引导页 / 首页
const OWN: MapStep[] = ALL_STEPS.map((s) => ({ id: s.id, title: s.title, v1: s.v1, v1Extra: s.v1Extra, out: s.auth === "out", v2: s.preset, review: s.id }));

/** 借第一版的步骤(登录 / 付费 / 创作 / 设置) */
const BORROWED: MapStep[] = [
  { id: "onboarding", title: "引导页", v1: "onboarding", out: true, review: "login" },
  // 「login」在评审原型里是引导页那一步，ATT 这屏换个 id 借第一版的 login
  { id: "att", title: "登录页 + ATT", v1: "login", out: true },
  { id: "media-failed", title: "背景片加载失败", v1: "media-failed", out: true },
  { id: "login-page", title: "登录页", v1: "login-page", out: true, review: "login-page" },
  { id: "email-login", title: "邮箱登录 · 输入邮箱", v1: "email-login", out: true, review: "email-login" },
  { id: "email-code", title: "邮箱登录 · 验证码", v1: "email-code", out: true, review: "email-code" },
  { id: "first-paywall", title: "首登付费墙", v1: "first-paywall", v2: QUIET, review: "first-paywall" },
  { id: "exit-offer", title: "挽留页", v1: "exit-offer", v2: QUIET, review: "exit-offer" },
  { id: "c-create", title: "Create · 空状态", v1: "create", v2: CREATE },
  { id: "c-agent", title: "写需求(Agent)", v1: "agent-compose", v2: CREATE },
  { id: "c-image", title: "Image 模式", v1: "image-compose", v2: CREATE },
  { id: "c-video", title: "Video 模式", v1: "video-compose", v2: CREATE },
  { id: "c-audio", title: "Audio 选音色", v1: "audio-voice", v2: CREATE },
  { id: "c-consent", title: "第一次发送 · AI 数据授权", v1: "ai-consent", v2: CREATE },
  { id: "c-plan", title: "生成计划 → 确认", v1: "agent-plan", v2: CREATE },
  { id: "c-generating", title: "生成中", v1: "generating", v2: CREATE },
  { id: "c-video-result", title: "Video 结果", v1: "video-result", v2: CREATE },
  { id: "c-image-result", title: "Image 结果", v1: "image-result", v2: CREATE },
  { id: "c-audio-result", title: "Audio 结果", v1: "audio-result", v2: CREATE },
  { id: "p-video", title: "Free 想做视频", v1: "video-locked", v2: CREATE, review: "p-video" },
  { id: "p-low", title: "积分不足", v1: "low-free", v2: CREATE, review: "p-low" },
  { id: "p-model", title: "选会员模型", v1: "model-locked", v2: CREATE },
  { id: "p-daily", title: "满 24 小时冷启动", v1: "daily-paywall", v2: QUIET },
  { id: "p-iap", title: "App Store 确认", v1: "first-paywall-iap", v2: QUIET, review: "p-iap" },
  { id: "first-paywall-bought", title: "首登付费墙购买成功", v1: "first-paywall-bought", v2: { ...QUIET, tab: "me" } },
  { id: "exit-offer-bought", title: "挽留页购买成功", v1: "exit-offer-bought", v2: { ...QUIET, tab: "me" } },
  { id: "p-bought", title: "购买成功", v1: "first-paywall-bought", v2: QUIET, review: "p-bought" },
  { id: "p-topup", title: "会员积分不足 → 积分包", v1: "low-member", v2: CREATE, review: "p-topup" },
  { id: "p-topup-done", title: "积分包到账", v1: "topup-done", v2: QUIET },
  { id: "settings", title: "设置", v1: "settings", v2: { ...QUIET, tab: "me" }, review: "settings" },
  { id: "sub-manage", title: "订阅管理", v1: "sub-manage", v2: { ...QUIET, tab: "me" }, review: "sub-manage" },
  { id: "invite", title: "邀请好友", v1: "invite", v2: { ...QUIET, tab: "me" }, review: "invite" },
];

const ME: Partial<State2> = { ...QUIET, tab: "me" };
const myPost = { id: "my-demo", postId: "scooter", caption: "My version 👀 @lily your turn", likes: 128, remixes: 23, shared: ["tiktok" as const] };
const job = (status: "running" | "done", progress: number) => ({ id: "job-demo", postId: "poodle", title: "She said she's not doing interviews today", prompt: "A poodle in white sunglasses poses like a movie star", withTwin: true, progress, status });

/** 旅程图里补的状态(评审原型里没有单独一步，只在异常 / 分支里出现) */
const EXTRA: MapStep[] = [
  { id: "foryou-q", title: "For You", v2: QUIET },
  { id: "post-insp", title: "单条视频(从瀑布流点进)", v2: { ...QUIET, homeTab: "inspiration", stack: [{ name: "post", postId: "poodle", list: ["poodle", "museum", "fruit"] }] } },
  { id: "share-mine", title: "分享自己的作品", v2: { ...QUIET, posts: [myPost], sheet: { name: "share", postId: "scooter", mine: "my-demo" } } },
  { id: "profile-followed", title: "创作者主页 · 已关注", v2: { ...QUIET, follows: ["mochi"], stack: [{ name: "profile", userId: "mochi" }] } },
  { id: "following-feed", title: "Following · 关注之后", v2: { ...QUIET, homeTab: "following", follows: ["mochi", "reel", "oddhistory"] } },
  { id: "template-solo", title: "同款页 · 没有朋友做过", v2: { ...QUIET, stack: [{ name: "template", postId: "gatsby" }] } },
  { id: "remix-new", title: "做同款 · 还没建分身", v2: { ...QUIET, twin: "none", stack: [{ name: "remix", postId: "poodle" }] } },
  { id: "me-running", title: "我的 · 任务在后台继续", v2: { ...ME, twin: "ready", postStreak: 7, posts: [myPost], jobs: [job("running", 0.42)] } },
  { id: "me-drafts", title: "我的 · 有作品和草稿", v2: { ...ME, twin: "ready", postStreak: 7, posts: [myPost], jobs: [job("done", 1)], xp: 90, progress: { ...INITIAL2.progress } } },
  { id: "rewards-claim", title: "任务中心 · 当天没到账", v2: { claimedToday: false, streak: 2, coach: false, stack: [{ name: "rewards" }] } },
  { id: "challenge-joined", title: "挑战详情 · 已报名", v2: { ...QUIET, joined: ["pets"], stack: [{ name: "challenge", id: "pets" }] } },
  { id: "challenge-ended", title: "挑战详情 · 已结束", v2: { ...QUIET, stack: [{ name: "challenge", id: "dance" }] } },
  { id: "c-post", title: "发布页(Create 做的)", v2: { ...QUIET, jobs: [{ ...job("done", 1), id: "job-c", fromCreate: true, title: "Iced Latte Summer Pour" }], stack: [{ name: "result", jobId: "job-c" }] } },
  { id: "email-resent", title: "重发验证码", v1: "email-expired", out: true, v1Extra: [{ type: "resendEmailCode", now: Date.now() }] },
  { id: "email-changed", title: "返回改邮箱 · 邮箱保留", v1: "email-code", out: true, v1Extra: [{ type: "emailBack" }], keyboard: "email" },
  { id: "inbox-new", title: "消息 · 还没发过作品", v2: { ...QUIET, stack: [{ name: "inbox" }] } },
];

/** 借第一版的屏，但要停在新版设计的某个 Tab 上(付费墙从 Create 里弹、购买成功回「我的」) */
const OVERRIDE: Record<string, Partial<State2>> = {
  "video-locked": CREATE,
  "agent-locked": CREATE,
  "model-locked": CREATE,
  "low-free": CREATE,
  "low-member": CREATE,
  "daily-paywall": QUIET,
  "promo-paywall": QUIET,
  "purchase-success": ME,
  "paid-me": ME,
  // 恢复购买成功 → 回到「我的」，套餐和积分换档
  "restore-success": ME,
};

export const STEPS: MapStep[] = [...OWN, ...BORROWED, ...EXTRA];
/**
 * 找不到就直接借第一版同名旅程(登录 / 付费 / 创作的各种分支、异常都在第一版里，截图用新版设计的 APP 画)。
 * groupV2 = 这一组的默认停留位置(创作组停在 Create、付费 / 设置组停在「我的」)
 */
export const step = (id: string, groupV2?: Partial<State2>): MapStep | undefined => {
  const own = STEPS.find((s) => s.id === id);
  if (own) return own;
  const v = V1.find((j) => j.id === id);
  return v ? { id, title: v.title, v1: id, v2: OVERRIDE[id] ?? groupV2 ?? QUIET } : undefined;
};

export type MapGroup = FlowSection & { key: string; color: string; desc: string; /** 借第一版的屏默认停在哪(见 step) */ v2?: Partial<State2> };

/** 第一版「开始创作」「付费转化」整张图搬过来(创作组去掉 Inspire 首页，新版首页是 For You,入口改成底部 Create) */
const V1_CREATE = FLOWS["@flow-create"].sections[0];
const V1_PAY = FLOWS["@flow-pay"].sections[0];
/** 第一版的成片详情 / 去水印 / 评分 / 下载页新版设计里没有：结果卡直接 Post 进发布页(同做同款)。生成完成的 APP 内横幅新版也不显示 */
const CREATE_DROP = ["g-inspire", "use-case", "g-work", "watermark-ask", "rating", "image-work", "image-saved", "video-work", "push-denied-optin"];

export const GROUPS: MapGroup[] = [
  {
    key: "open",
    title: "1 · 首次打开 APP",
    color: "#2f6fed",
    desc: "从桌面点开 APP → 启动页 → 引导页 → ATT → 登录(Apple / Google / 邮箱)→ 按身份分流 → 新 Free 看首登付费墙 → 购买或挽留 → 回到首页，签到积分自动到账。细度对齐第一版「首次安装」旅程图;菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    nodes: [
      { id: "fresh-home", col: 0, row: 0 },
      { id: "splash", col: 1, row: 0 },
      { id: "onboarding", col: 2, row: 0 },
      { id: "att", col: 3, row: 0 },
      { id: "login-page", col: 4, row: 0 },
      { id: "apple-first", col: 5, row: 0 },
      { id: "apple-faceid", col: 6, row: 0 },
      { id: "d-identity", col: 8, row: 0, decision: "登录成功\n是什么身份？" },
      { id: "d-free", col: 9, row: 0, decision: "Free 用户\n新账号还是老账号？" },
      { id: "d-paid", col: 9, row: 4, decision: "已付费\nAPP / 网页会员\n还是 Enterprise？" },
      {
        id: "g-paywall",
        col: 10,
        row: 0,
        title: "首登付费墙",
        variants: [
          { id: "first-paywall", label: "新 Free · 默认 Starter 年付", annos: [{ x: 30, y: 84, w: 40, h: 40, text: "✕ 进页面 3 秒后才出现(Free 用户)" }] },
          { id: "prices-failed", label: "拉不到 App Store 价格" },
        ],
      },
      { id: "d-exit", col: 13, row: 0, decision: "点 ✕ 时\n满足挽留条件？" },
      {
        id: "g-exit",
        col: 14,
        row: 0,
        title: "挽留页",
        variants: [
          {
            id: "exit-offer",
            label: "倒计时中",
            annos: [
              { x: 200, y: 459, w: 209, h: 54, text: "真实 24 小时倒计时，到期后不再显示这个页面" },
              { x: 28, y: 82, w: 44, h: 44, text: "✕ 进页面 3 秒后才出现(和付费墙一样)" },
            ],
          },
          { id: "exit-offer-prices-failed", label: "拉不到价格" },
        ],
      },
      { id: "exit-offer-later", col: 16, row: 0 },
      { id: "daily", col: 17, row: 0, tag: "签到积分自动到账 · 横幅 4 秒收起" },

      { id: "media-failed", col: 2, row: 1 },
      { id: "att-deny", col: 3, row: 1, text: "同样进入登录页\n归因只有 SKAN 聚合数据" },
      { id: "apple-known", col: 5, row: 1 },
      { id: "returning-login", col: 11, row: 2, tag: "自动付费墙 · ✕ 后同右侧挽留判断" },
      { id: "exit-offer-iap", col: 14, row: 1 },
      { id: "exit-offer-bought", col: 15, row: 1, tag: "开通 Starter 月付 · 回到「我的」" },
      { id: "exit-offer-expired", col: 16, row: 1 },

      { id: "google-alert", col: 5, row: 2 },
      { id: "google-chooser", col: 6, row: 2 },
      { id: "returning-no-paywall", col: 11, row: 3, tag: "直接到首页 · 余额是原来的" },
      { id: "paywall-closed-plain", col: 14, row: 2, tag: "直接关闭付费墙 · 回到首页" },

      {
        id: "g-email",
        col: 5,
        row: 3,
        title: "邮箱登录 · 输入邮箱",
        variants: [
          { id: "email-login", label: "默认" },
          { id: "email-invalid", label: "格式不对" },
        ],
      },
      { id: "email-code", col: 7, row: 3 },
      { id: "d-daily", col: 10, row: 2, decision: "这台手机距上次\n自动弹出满 24 小时？" },
      { id: "member-login", col: 10, row: 4, tag: "会员 · 右上角是会员积分" },

      { id: "login-failed", col: 5, row: 4, tag: "顶部 toast · 可重试" },
      { id: "enterprise-login", col: 10, row: 5, tag: "Enterprise · 进组织空间" },

      { id: "email-wrong", col: 8, row: 5 },
      { id: "first-paywall-iap", col: 12, row: -1 },
      { id: "first-paywall-bought", col: 13, row: -1, tag: "回到「我的」· Free → Starter" },
      { id: "email-expired", col: 8, row: 6 },
      { id: "restore-success", col: 12, row: 1 },
      { id: "email-resent", col: 8, row: 7, tag: "旧码失效 · 倒计时重新 60 秒" },
      { id: "email-changed", col: 8, row: 8 },
    ],
    edges: [
      { from: "fresh-home", to: "splash", label: "点击 BuzzVideo AI 图标" },
      { from: "splash", to: "onboarding", label: "logo 放大约 1 秒后自动进入" },
      { from: "onboarding", to: "att", label: "点击 Get started → 弹 ATT 框" },
      { from: "att", to: "login-page", label: "点击 Allow" },
      { from: "login-page", to: "apple-first", label: "Continue with Apple(第一次)" },
      { from: "apple-first", to: "apple-faceid", label: "点击 Continue" },
      { from: "apple-faceid", to: "d-identity", label: "验证通过 · 登录成功" },
      { from: "d-identity", to: "d-free", label: "Free(没有订阅)" },
      { from: "d-free", to: "g-paywall", label: "新账号 · 发 500 积分" },
      { from: "g-paywall", to: "d-exit", label: "点击 ✕" },
      { from: "d-exit", to: "g-exit", label: "是" },
      { from: "g-exit", to: "exit-offer-later", label: "点击 Maybe later / ✕" },
      { from: "exit-offer-later", to: "daily", label: "回到首页 · 今天第一次打开" },

      { from: "onboarding", to: "media-failed", label: "背景片加载失败", edge: true },
      { from: "att", to: "att-deny", label: "点击 Ask App Not to Track" },
      { from: "login-page", to: "apple-known", label: "Continue with Apple(登录过)" },
      { from: "apple-known", to: "d-identity", label: "Continue → Face ID 通过", merge: true },
      { from: "login-page", to: "google-alert", label: "Continue with Google" },
      { from: "google-alert", to: "google-chooser", label: "点击 Continue" },
      { from: "google-chooser", to: "d-identity", label: "选账号", merge: true },
      { from: "login-page", to: "g-email", label: "Continue with email" },
      { from: "g-email", to: "email-code", label: "输入正确邮箱 → Continue" },
      { from: "email-code", to: "d-identity", label: "输对 6 位", merge: true },
      { from: "login-page", to: "login-failed", label: "登录失败 / 断网", edge: true },

      { from: "d-free", to: "d-daily", label: "老账号(换手机 / 重装 / 退出后重新登录)" },
      { from: "d-daily", to: "returning-login", label: "满 24 小时(或从没弹过)" },
      { from: "d-daily", to: "returning-no-paywall", label: "不满 24 小时" },
      { from: "d-identity", to: "d-paid", label: "已付费(有订阅)" },
      { from: "d-paid", to: "member-login", label: "APP / 网页会员 → 不弹付费墙" },
      { from: "d-paid", to: "enterprise-login", label: "Enterprise 成员 → 组织空间" },

      { from: "email-code", to: "email-wrong", label: "验证码输错", edge: true },
      { from: "email-code", to: "email-expired", label: "验证码过期", edge: true },
      { from: "email-code", to: "email-resent", label: "点击 Resend code" },
      { from: "email-code", to: "email-changed", label: "点击 Change" },
      { from: "g-paywall", to: "first-paywall-iap", label: "点击 Continue", fork: true },
      { from: "first-paywall-iap", to: "first-paywall-bought", label: "双击侧边按钮 → Face ID → Done" },
      { from: "g-paywall", to: "restore-success", label: "点击 Restore(这个 Apple ID 有订阅)", fork: true },
      { from: "d-exit", to: "paywall-closed-plain", label: "否" },
      { from: "g-exit", to: "exit-offer-iap", label: "点击 Get my 50% off now" },
      { from: "exit-offer-iap", to: "exit-offer-bought", label: "双击侧边按钮 → Face ID → Done" },
      { from: "exit-offer-later", to: "exit-offer-expired", label: "过了 24 小时", edge: true },
    ],
    cards: [
      {
        from: "d-free",
        to: "g-paywall",
        title: "付费墙什么时候自动弹(只对 Free)",
        lines: [
          "① 新账号登录成功 → 立刻弹一次(trigger = first_login)",
          "② 之后冷启动时，距上次自动弹出满 24 小时才再弹(daily);时间记在设备本地，换手机 / 重装后清空",
          "③ 生成视频、积分不足、运营弹窗触发的，不受 24 小时限制",
        ],
      },
      {
        from: "d-exit",
        to: "g-exit",
        title: "挽留条件(同时满足才算「是」)",
        lines: [
          "① 挽留功能开关开启(服务端配置)",
          "② Free 用户：不是 APP / 网页会员，不在 Enterprise 组织",
          "③ 这个 Apple ID 没用过 Starter 首期优惠",
          "④ 这台手机没领过挽留;或领过、还在 24 小时内(倒计时接着走)",
        ],
        emphasis: "任何付费墙点 ✕ 都按这个判断，不只是首登",
      },
    ],
  },
  {
    key: "watch",
    title: "2 · 刷视频",
    color: "#ff5e1a",
    v2: QUIET,
    desc: "首页三个频道：For You(全屏视频，上下滑)、Inspiration(双列瀑布流)、Following(关注的人;还没关注时推荐创作者)。视频上可以点赞、评论、收藏、分享、进作者主页;点 Remix 小卡进「3 · 做同款」。作者关闭了「允许做同款」时不显示 Remix 小卡和朋友那一行;已关注的作者不显示关注加号。",
    nodes: [
      {
        id: "g-foryou",
        col: 0,
        row: 0,
        title: "For You(默认落在这里)",
        variants: [
          { id: "foryou", label: "第一次 · Remix 小卡旁有新手提示" },
          { id: "foryou-q", label: "之后 · 没有提示" },
        ],
      },
      { id: "inspiration", col: 2, row: -1 },
      { id: "post-insp", col: 3, row: -1 },
      { id: "comments", col: 2, row: 0 },
      { id: "comment-blocked", col: 3, row: 0 },
      { id: "share", col: 2, row: 1 },
      {
        id: "g-profile",
        col: 2,
        row: 2,
        title: "创作者主页",
        variants: [
          { id: "profile", label: "未关注" },
          { id: "profile-followed", label: "已关注 · 名字旁 Following 变灰" },
        ],
      },
      {
        id: "g-following",
        col: 2,
        row: 3,
        title: "Following",
        variants: [
          { id: "following", label: "还没关注任何人 · 推荐朋友关注的创作者" },
          { id: "following-feed", label: "关注之后 · 关注的人的视频流" },
        ],
      },
      { id: "e-media", col: 0, row: 1, edge: true, text: "显示封面图 + 重试" },
    ],
    edges: [
      { from: "g-foryou", to: "inspiration", label: "顶部切到 Inspiration", fork: true },
      { from: "inspiration", to: "post-insp", label: "点卡片" },
      { from: "g-foryou", to: "comments", label: "点评论" },
      { from: "comments", to: "comment-blocked", label: "评论含违规内容", edge: true },
      { from: "g-foryou", to: "share", label: "点分享", fork: true },
      { from: "g-foryou", to: "g-profile", label: "点作者头像", fork: true },
      { from: "g-foryou", to: "g-following", label: "顶部切到 Following", fork: true },
      { from: "g-foryou", to: "e-media", label: "视频加载失败", edge: true },
    ],
    tails: [
      { after: "post-insp", label: "上下滑同一分类;分类没内容 → 空状态，引导回 Trending" },
      { after: "share", label: "发给朋友 / TikTok / Instagram / 存视频;分享到外部没有奖励" },
      { after: "g-profile", label: "点作品 → 单条视频 → 做同款" },
      { after: "g-following", label: "还没有互关的朋友 → 不显示故事圈，只推热门创作者(不要通讯录授权)" },
    ],
  },
  {
    key: "remix",
    title: "3 · 做同款 Remix",
    color: "#8b5cf6",
    v2: QUIET,
    desc: "刷到喜欢的 → 点 Remix 小卡进同款页(所有人的版本;原视频被删时头图显示 Original removed,已有版本照常展示)→ Remix this → 选主角(原角色 / 我 / 我的宠物 / 上传)，点中间大圆 → 积分够就生成 → 成品页「Post to BuzzVideo」公开发布(每天第一条有积分;同步 TikTok / Instagram 可选、没有奖励)→ 发完看第一批反应。生成中可以 Keep scrolling,任务在后台继续;成品页点 ✕ 不发 = 留在「我的」当草稿;今天已经发过时火苗不再 +1。",
    nodes: [
      { id: "foryou-q", col: 0, row: 0 },
      {
        id: "g-template",
        col: 1,
        row: 0,
        title: "同款页",
        variants: [
          { id: "template", label: "朋友做过 · 默认 Friends 栏" },
          { id: "template-solo", label: "没有朋友做过 · 默认 Top" },
        ],
      },
      {
        id: "g-remix",
        col: 3,
        row: 0,
        title: "做同款 · 主角轮盘",
        variants: [
          { id: "remix", label: "分身已建好 · Starring you" },
          { id: "remix-new", label: "还没建分身 · 「我」上带 +50" },
        ],
      },
      { id: "d-credits", col: 5, row: 0, decision: "点中间大圆\n积分够吗？" },
      { id: "generating", col: 6, row: 0 },
      { id: "result", col: 7, row: 0 },
      { id: "celebrate", col: 8, row: 0 },
      { id: "me-posts", col: 9, row: 0 },
      { id: "me-running", col: 7, row: -1, tag: "做好了在「我的 › Posts」最前面" },

      { id: "remix-low", col: 5, row: 1 },
      { id: "remix-failed", col: 6, row: 1 },
      { id: "post-blocked", col: 7, row: 1 },

      { id: "twin", col: 3, row: 2 },
      { id: "twin-ready", col: 4, row: 2 },
      { id: "twin-camera", col: 3, row: 3 },
      { id: "twin-denied", col: 4, row: 3 },
    ],
    edges: [
      { from: "foryou-q", to: "g-template", label: "点 Remix 小卡 / 朋友做过那一行" },
      { from: "g-template", to: "g-remix", label: "Remix this / Your turn" },
      { from: "g-remix", to: "d-credits", label: "选好主角" },
      { from: "d-credits", to: "generating", label: "够 · 扣积分" },
      { from: "d-credits", to: "remix-low", label: "不够", edge: true },
      { from: "generating", to: "result", label: "做好了" },
      { from: "generating", to: "me-running", label: "Keep scrolling", fork: true },
      { from: "generating", to: "remix-failed", label: "生成失败", edge: true },
      { from: "result", to: "celebrate", label: "Post(勾选同步平台)" },
      { from: "result", to: "post-blocked", label: "审核不通过", edge: true },
      { from: "celebrate", to: "me-posts", label: "See my profile" },
      { from: "g-remix", to: "twin", label: "选「我」· 还没有分身" },
      { from: "twin", to: "twin-ready", label: "同意 → 读 3 个数字(约 3 秒)" },
      { from: "twin", to: "twin-camera", label: "Agree → 第一次要相机" },
      { from: "twin-camera", to: "twin-denied", label: "拒绝过", edge: true },
    ],
    tails: [
      { after: "twin-ready", label: "回到做同款，自动选中「我」" },
    ],
  },
  {
    key: "create",
    title: "4 · 创作 Create(第一版的创作流程，新版设计样式)",
    color: "#0891b2",
    v2: CREATE,
    desc: "整张图沿用第一版「开始创作」的细度：底部 Create → 创作模式面板 → 按模式分叉。第一行是 Marketing Agent 的完整主线(发送判断 → 授权 → 生成计划 → 生成 → 通知 → 成片 → 下载 → 评分);往下依次是 Image / Video / Audio / Hybrid Reel 各自的线。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    nodes: [
      { id: "foryou-q", col: 0, row: 0 },
      ...V1_CREATE.nodes
        .filter((n) => !CREATE_DROP.includes(n.id))
        .map((n) => ({
          ...n,
          id: n.id === "generating" ? "c-generating" : n.id,
          col: n.col - 2,
          variants: n.id === "g-done-push" ? n.variants?.filter((v) => v.id === "done-push-home") : n.variants,
          // 下面有竖线出去的屏不挂标签，不然线上的字会压到标签
          tag: n.id === "agent-compose" ? undefined : n.tag,
        })),
      { id: "c-post", col: 13, row: 0, tag: "结果卡点 Post · 同做同款的发布页" },
    ],
    edges: [
      { from: "foryou-q", to: "g-create", label: "点底部 Create(点热门玩法会预填提示词)" },
      ...V1_CREATE.edges
        .filter((e) => !CREATE_DROP.includes(e.from) && !CREATE_DROP.includes(e.to) && e.from !== "g-inspire")
        .map((e) => ({ ...e, from: e.from === "generating" ? "c-generating" : e.from, to: e.to === "generating" ? "c-generating" : e.to })),
      { from: "g-done-push", to: "c-post", label: "点通知 → 结果卡 → Post" },
    ],
    cards: V1_CREATE.cards,
    tails: [
      { after: "c-post", label: "发布、同步平台、拿奖励，后面同「3 · 做同款」" },
      { after: "image-result", label: "点 Post → 发布页;长按存相册" },
      { after: "video-result", label: "点 Post → 发布页" },
    ],
  },
  {
    key: "edit",
    title: "5 · 剪辑器 Editor",
    color: "#0d9488",
    v2: QUIET,
    desc: "剪映那种剪辑器：预览 + 时间码 / 播放 / 撤销重做 / 全屏;时间线最左是关闭原声和封面，主轨是帧条，片段之间是转场按钮;底部两级工具栏。手势：拖把手裁剪、长按排序、捏合缩放。导入两段以上先问要不要 AI 一键成片。AI B-roll 同网页版 Hybrid Reel:导入后 AI 免费看完找出缺的镜头(开头钩子 / 过渡 / 结尾),时间线上直接标「+ AI shot」→ 可先免费看一帧 → 生成匹配的镜头插进主轨(每段送一次免费重做)。还有转场(含 AI morph)、滤镜、变速、自动字幕 + 剪字幕、音乐 / 音效 / 录音、导出和去水印导出;导出后发到 BuzzVideo(公开发布 +20)或用系统分享面板发到其他 APP(没有奖励)。",
    nodes: [
      { id: "c-create", col: 0, row: 0, tag: "模式面板 Edit · 工具 Video Editor / Auto Captions / AI B-roll" },
      { id: "ed-pick", col: 1, row: 0 },
      { id: "ed-main", col: 2, row: 0 },
      {
        id: "g-ed-auto",
        col: 2,
        row: 1,
        title: "AI 一键成片(免费)",
        variants: [
          { id: "ed-autoedit", label: "导入两段以上先问一次" },
          { id: "ed-autoedited", label: "出第一版 · 卡点 / 转场 / 音乐 / 字幕" },
        ],
      },
      { id: "ed-export", col: 3, row: 0 },
      { id: "ed-exporting", col: 4, row: 0 },
      {
        id: "g-ed-done",
        col: 5,
        row: 0,
        title: "导出完成",
        variants: [
          { id: "ed-exported", label: "Free · 带水印" },
          { id: "ed-exported-clean", label: "去水印(会员)" },
          { id: "ed-exported-music", label: "音乐只授权 BuzzVideo · 提醒" },
        ],
      },
      { id: "ed-post", col: 7, row: 0, tag: "Back to edit · 含 AI 自动标 Contains AI · 公开发布 +20" },
      { id: "ed-draft", col: 1, row: 2, tag: "✕ 离开自动存草稿 · 点了回到时间线" },
      { id: "ed-export-failed", col: 4, row: 1 },
      { id: "ed-share", col: 5, row: 1, tag: "没有分享奖励" },
      {
        id: "g-ed-clip",
        col: 3,
        row: 2,
        title: "选中片段 · 二级工具",
        variants: [
          { id: "ed-clip", label: "拖把手裁剪 · Split / Speed / Volume / Filters / Reverse / Duplicate / Replace / Delete" },
          { id: "ed-reorder", label: "长按排序" },
          { id: "ed-speed", label: "变速(音量同样形式)" },
          { id: "ed-filters", label: "滤镜 · 可应用到全部" },
        ],
      },
      { id: "ed-transition", col: 3, row: 3, tag: "含 AI morph · 20 积分" },
      {
        id: "g-ed-broll",
        col: 3,
        row: 4,
        title: "AI B-roll · 找缺口(免费)",
        variants: [
          { id: "ed-broll-start", label: "开始" },
          { id: "ed-broll-analyzing", label: "看素材中" },
          { id: "ed-broll", label: "找到的缺口 · 默认勾选" },
          { id: "ed-broll-preview", label: "免费先看一帧" },
        ],
      },
      {
        id: "g-ed-broll2",
        col: 6,
        row: 4,
        title: "AI 镜头插进主轨(50 积分 / 段)",
        variants: [
          { id: "ed-broll-making", label: "生成中 · 可以继续剪" },
          { id: "ed-broll-ready", label: "插好了 · 标 AI" },
        ],
      },
      { id: "ed-low", col: 3, row: 5, tag: "红色提示 + 付费墙" },
      { id: "ed-broll-failed", col: 6, row: 5, tag: "积分退回 · Retry" },
      {
        id: "g-ed-caps",
        col: 3,
        row: 6,
        title: "字幕(免费)",
        variants: [
          { id: "ed-captions-start", label: "Auto captions · 选语言" },
          { id: "ed-captions", label: "8 套样式" },
          { id: "ed-bilingual", label: "双语字幕" },
          { id: "ed-captions-edit", label: "剪字幕 · 改字 / 切开 / 删除 / 调时间" },
        ],
      },
      { id: "ed-nospeech", col: 6, row: 6 },
      { id: "ed-text", col: 3, row: 7 },
      {
        id: "g-ed-audio",
        col: 3,
        row: 8,
        title: "音频",
        variants: [
          { id: "ed-audio", label: "Music / Sound FX / Voiceover / Extract audio" },
          { id: "ed-music", label: "音乐" },
        ],
      },
    ],
    edges: [
      { from: "c-create", to: "ed-pick", label: "Edit 模式 / 剪辑类工具" },
      { from: "ed-pick", to: "ed-main", label: "选好实拍片段 → Add" },
      { from: "ed-pick", to: "g-ed-auto", label: "两段以上", fork: true },
      { from: "g-ed-auto", to: "ed-main", label: "Auto edit / 自己剪" },
      { from: "ed-main", to: "ed-draft", label: "✕ 离开" },
      { from: "ed-main", to: "ed-export", label: "Export / 分辨率胶囊" },
      { from: "ed-export", to: "ed-exporting", label: "Export video" },
      { from: "ed-exporting", to: "g-ed-done", label: "完成" },
      { from: "g-ed-done", to: "ed-post", label: "Post to BuzzVideo" },
      { from: "ed-exporting", to: "ed-export-failed", label: "导出失败", edge: true },
      { from: "g-ed-done", to: "ed-share", label: "Share to…" },
      { from: "ed-main", to: "g-ed-clip", label: "点片段 / Edit", fork: true },
      { from: "ed-main", to: "ed-transition", label: "点片段之间的按钮", fork: true },
      { from: "ed-main", to: "g-ed-broll", label: "AI B-roll", fork: true },
      { from: "g-ed-broll", to: "g-ed-broll2", label: "Make N shots" },
      { from: "g-ed-broll", to: "ed-low", label: "积分不够", edge: true },
      { from: "g-ed-broll2", to: "ed-broll-failed", label: "生成失败", edge: true },
      { from: "ed-main", to: "g-ed-caps", label: "Captions / Text", fork: true },
      { from: "g-ed-caps", to: "ed-nospeech", label: "没听到人声", edge: true },
      { from: "ed-main", to: "ed-text", label: "Text → Add text", fork: true },
      { from: "ed-main", to: "g-ed-audio", label: "Audio", fork: true },
    ],
    tails: [{ after: "ed-post", label: "发布后同「3 · 做同款」(庆祝页、第一批反应)" }],
  },
  {
    key: "pay",
    title: "6 · 付费",
    color: "#16a34a",
    v2: ME,
    desc: "整张图沿用第一版「付费转化」的细度：先看是谁、从哪里进来 → Free 从各种触发进付费墙 → App Store 确认 → 开通;会员看自己的档位、升降级、买积分包、管理订阅;网页订阅;恢复购买。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    nodes: V1_PAY.nodes.map((n) => (n.id === "first-paywall-iap" || n.id === "sub-manage" ? { ...n, tag: undefined } : n)),
    edges: V1_PAY.edges,
  },
  {
    key: "reward",
    title: "7 · 签到与激励",
    color: "#ca8a04",
    v2: QUIET,
    desc: "每天第一次回首页积分自动到账(不弹窗，付费墙 / 挽留开着时等关掉再到账);任务中心看签到 7 天、和朋友比发作品火苗、新手 / 每日任务;挑战活动报名后进同款页投稿。",
    nodes: [
      { id: "daily", col: 0, row: 0 },
      {
        id: "g-rewards",
        col: 1,
        row: 0,
        title: "任务中心",
        variants: [
          { id: "rewards", label: "已自动到账 · 只看进度" },
          { id: "rewards-claim", label: "当天没到账(断网)· Claim 补领" },
        ],
      },
      { id: "e-break", col: 0, row: 1, edge: true, text: "签到天数归零\n从第 1 天重新算" },
      { id: "challenges", col: 0, row: 2 },
      {
        id: "g-challenge",
        col: 1,
        row: 2,
        title: "挑战活动详情",
        variants: [
          { id: "challenge", label: "进行中 · Join the challenge" },
          { id: "challenge-joined", label: "已报名 · Make my entry" },
          { id: "challenge-ended", label: "已结束 · 只能看，没有按钮" },
        ],
      },
      { id: "template", col: 4, row: 2, tag: "带着活动示例进同款页" },
    ],
    edges: [
      { from: "daily", to: "g-rewards", label: "点签到横幅 / 「我的」右上礼物" },
      { from: "daily", to: "e-break", label: "有一天没打开", edge: true },
      { from: "challenges", to: "g-challenge", label: "点一个活动" },
      { from: "g-challenge", to: "template", label: "Join / Make my entry" },
    ],
    tails: [{ after: "g-rewards", label: "Go → 去完成任务;Claim → 领积分;每日任务跨天未领作废" }],
  },
  {
    key: "social",
    title: "8 · 社交与消息",
    color: "#db2777",
    v2: QUIET,
    desc: "首页左上 / 「我的」右上铃铛进 Activity:朋友新作品的故事圈、里程碑、谁做了你的同款、谁 @ 你挑战、谁关注了你;每条都能直接点过去。",
    nodes: [
      {
        id: "g-inbox",
        col: 0,
        row: 0,
        title: "消息 Activity",
        variants: [
          { id: "inbox", label: "发过作品 · 有里程碑和同款通知" },
          { id: "inbox-new", label: "还没发过作品 · 只有朋友动态和官方消息" },
        ],
      },
      { id: "template", col: 2, row: 0, tag: "Max challenged you → Remix" },
      { id: "comments", col: 2, row: 1, tag: "Zoe 评论了你的作品" },
      { id: "challenges", col: 2, row: 2 },
      { id: "profile", col: 2, row: 3, tag: "新关注 → Follow back / 看主页" },
      { id: "me-posts", col: 2, row: 4, tag: "里程碑「Your remix hit 1K views」" },
    ],
    edges: [
      { from: "g-inbox", to: "template", label: "点 Remix" },
      { from: "g-inbox", to: "comments", label: "点一条评论通知", fork: true },
      { from: "g-inbox", to: "challenges", label: "点 Challenges", fork: true },
      { from: "g-inbox", to: "profile", label: "点新关注的人", fork: true },
      { from: "g-inbox", to: "me-posts", label: "点里程碑卡", fork: true },
    ],
  },
  {
    key: "me",
    title: "9 · 我的与设置",
    color: "#64748b",
    v2: ME,
    desc: "「我的」按状态：新用户(引导做第一条、建分身)/ 有作品和草稿 / 有生成中的任务。右上设置沿用第一版：订阅管理、退出、删除账号、帮助、邀请好友。Enterprise 的工作区切换和成员管理沿用第一版，新版设计没改。",
    nodes: [
      {
        id: "g-me",
        col: 0,
        row: 0,
        title: "我的",
        variants: [
          { id: "me-empty", label: "新用户 · 没发过作品" },
          { id: "me-drafts", label: "有作品和草稿 · 草稿提醒条" },
          { id: "me-running", label: "有生成中的任务" },
        ],
      },
      { id: "settings", col: 3, row: 0, tag: "点右上 ⚙" },
      { id: "sub-manage", col: 4, row: 0 },
      { id: "t-sub-next", col: 5, row: 0, text: "跳到 App Store\n订阅管理" },
      { id: "sign-out", col: 4, row: 1 },
      { id: "delete-account", col: 4, row: 2 },
      { id: "feedback", col: 4, row: 3 },
      { id: "invite", col: 4, row: 4 },
      { id: "twin", col: 2, row: 1 },
      { id: "twin-ready", col: 2, row: 2 },
      { id: "result", col: 2, row: 3, tag: "草稿 → 回成品页发布" },
      {
        id: "g-plans",
        col: 0,
        row: 5,
        title: "「我的」· 按订阅身份(名字旁的身份贴纸 + 左上积分)",
        variants: [
          { id: "acct-free", label: "Free · 白色 Free" },
          { id: "acct-starter", label: "Starter · 天蓝" },
          { id: "acct-pro", label: "Pro · 橙色" },
          { id: "acct-ultra", label: "Ultra · 黑色" },
          { id: "acct-enterprise", label: "Enterprise · 组织空间" },
        ],
      },
    ],
    edges: [
      { from: "g-me", to: "settings", label: "点 ⚙" },
      { from: "settings", to: "sub-manage", label: "Subscription" },
      { from: "sub-manage", to: "t-sub-next", label: "Manage in App Store" },
      { from: "settings", to: "sign-out", label: "Sign out → 确认" },
      { from: "settings", to: "delete-account", label: "Delete account → 确认(不可恢复)", edge: true },
      { from: "settings", to: "feedback", label: "Help Center" },
      { from: "settings", to: "invite", label: "Invite friends" },
      { from: "g-me", to: "twin", label: "Create my Twin" },
      { from: "twin", to: "twin-ready", label: "录好" },
      { from: "g-me", to: "result", label: "草稿提醒 · Post" },
    ],
  },
];
