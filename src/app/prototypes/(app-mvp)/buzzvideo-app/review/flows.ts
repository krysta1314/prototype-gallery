/**
 * 每个一级模块第一项的「用户旅程图」(2026-10-20 定):像 Figma 原型连线——每一屏是真机截图，屏和屏之间用箭头连，箭头上写交互。
 * 一张图可以分几段(section),每段一块画布，段内 col / row 是格子位置;节点 = 旅程 id(截图就是这条旅程的预置状态)。
 * 连线：同一行 → 横向箭头;下方同一列 → 竖向箭头;下方右边的列 → 先往下再往右的折线。
 * 往下拐的竖线会穿过中间行同一列的位置，那些格子要空着。只有文字节点的行会自动压矮。
 */
/** 截图上的标注：x / y 是被标元素中心的手机屏幕坐标(402×874 点),w / h 是它的大小;图上用描边框框住元素(不遮挡),引线连到截图上方的标注文字 */
export type FlowAnno = { x: number; y: number; w?: number; h?: number; text: string };
export type FlowNode = {
  id: string;
  col: number;
  row: number;
  /** 不放截图，只画一个文字框(说明去处或异常提示) */
  text?: string;
  /** 文字框是异常(暖橙) */
  edge?: boolean;
  /** 不对应旅程的系统屏(如启动页)直接画这个组件 */
  screen?: "splash";
  /** screen 节点的屏名 */
  title?: string;
  /** 判断节点(菱形):写问题，出去的每条线写条件 */
  decision?: string;
  /** 变体组：同一屏因身份 / 状态不同的几张截图并排，每张带标签;title 是组名 */
  variants?: { id: string; label: string; annos?: FlowAnno[] }[];
  /** 截图上的标注(单屏节点) */
  annos?: FlowAnno[];
  /** 截图上方的身份 / 状态标签(如「新 Free」) */
  tag?: string;
};
export type FlowEdge = {
  from: string;
  to: string;
  label: string;
  /** 异常分支：虚线 + 暖橙 */
  edge?: boolean;
  /** 汇合线：从右边出来，沿目标前一列的竖线(汇合总线)走到目标那一行再进去;用于几条路径汇到同一屏 */
  merge?: boolean;
  /** 右侧绕线：从右边出来，沿第 busCol 列左边的竖线走到目标行，再往右进目标;用来绕开下方的判断线。文字写在最后一段 */
  busCol?: number;
  /** 分叉线：从出发屏右侧同一点分出去(往上拐 / 往下拐),再往右进目标;用于一屏有几个并列出口 */
  fork?: boolean;
};
/** 条件卡片：放在某条横向箭头的上方，用虚线指到箭头 */
export type FlowCard = { from: string; to: string; title: string; lines: string[]; /** 要特别提醒的一句，高亮显示 */ emphasis?: string };
export type FlowSection = {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  cards?: FlowCard[];
  /** 某个节点之后接的去处(不画截图，只写一句) */
  tails?: { after: string; label: string }[];
};
export type Flow = { title: string; desc: string; sections: FlowSection[] };

export const FLOW_PAGE_PREFIX = "@flow-";

export const FLOWS: Record<string, Flow> = {
  "@flow-first": {
    title: "首次安装",
    desc: "新用户从桌面点开 APP → 启动页 → 引导页 → ATT → 登录(Apple / Google / 邮箱)→ 按身份分流 → 新 Free 看首登付费墙 → 购买或挽留 → 回到首页。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    sections: [
      {
        title: "",
        nodes: [
          { id: "fresh-home", col: 0, row: 0 },
          { id: "splash", col: 1, row: 0 },
          { id: "onboarding", col: 2, row: 0 },
          { id: "login", col: 3, row: 0 },
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
              { id: "first-paywall", label: "新 Free · 默认 Starter 年付", annos: [{ x: 30, y: 84, w: 40, h: 40, text: "✕ 按钮 3 秒后才出现(Free 用户)" }] },
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
                ],
              },
              { id: "exit-offer-prices-failed", label: "拉不到价格" },
            ],
          },
          { id: "exit-offer-later", col: 16, row: 0 },

          { id: "media-failed", col: 2, row: 1 },
          { id: "att-deny", col: 3, row: 1, text: "同样进入登录页\n归因只有 SKAN 聚合数据" },
          { id: "apple-known", col: 5, row: 1 },
          { id: "returning-login", col: 11, row: 2, tag: "自动付费墙 · ✕ 后同右侧挽留判断" },
          { id: "exit-offer-iap", col: 14, row: 1 },
          { id: "exit-offer-bought", col: 15, row: 1, tag: "开通 Starter 月付 · 回到「我的」" },
          { id: "exit-offer-expired", col: 16, row: 1 },

          { id: "google-alert", col: 5, row: 2 },
          { id: "google-chooser", col: 6, row: 2 },
          { id: "returning-no-paywall", col: 11, row: 3, tag: "直接到 Inspire · 余额是原来的" },
          { id: "paywall-closed-plain", col: 14, row: 2, tag: "直接关闭付费墙 · 回到 Inspire" },

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
          { id: "email-resend", col: 8, row: 7, text: "发新验证码，旧码失效\n倒计时重新 60 秒" },
          { id: "email-change", col: 8, row: 8, text: "回到输入邮箱页\n邮箱保留" },
        ],
        edges: [
          { from: "fresh-home", to: "splash", label: "点击 BuzzVideo AI 图标" },
          { from: "splash", to: "onboarding", label: "logo 放大约 1 秒后自动进入" },
          { from: "onboarding", to: "login", label: "点击 Get started → 弹 ATT 框" },
          { from: "login", to: "login-page", label: "点击 Allow" },
          { from: "login-page", to: "apple-first", label: "Continue with Apple(第一次)" },
          { from: "apple-first", to: "apple-faceid", label: "点击 Continue" },
          { from: "apple-faceid", to: "d-identity", label: "验证通过 · 登录成功" },
          { from: "d-identity", to: "d-free", label: "Free(没有订阅)" },
          { from: "d-free", to: "g-paywall", label: "新账号 · 发 500 积分" },
          { from: "g-paywall", to: "d-exit", label: "点击 ✕" },
          { from: "d-exit", to: "g-exit", label: "是" },
          { from: "g-exit", to: "exit-offer-later", label: "点击 Maybe later / ✕" },

          { from: "onboarding", to: "media-failed", label: "广告片加载失败", edge: true },
          { from: "login", to: "att-deny", label: "点击 Ask App Not to Track" },
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
          { from: "email-code", to: "email-resend", label: "点击 Resend code" },
          { from: "email-code", to: "email-change", label: "点击 Change" },

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
              "③ 生成视频、锁定模型、积分不足、运营弹窗触发的，不受 24 小时限制",
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
        tails: [
        ],
      },
    ],
  },
  "@flow-create": {
    title: "开始创作",
    desc: "从 Inspire 进 Create → 输入提示词点发送 → 判断能不能提交 → 第一次发送依次问 AI 数据授权、推送授权 → 生成 → 第一条成片弹营销轻问 → 打开成片保存 → 评分。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    sections: [
      {
        title: "",
        nodes: [
          {
            id: "g-inspire",
            col: 0,
            row: 0,
            title: "Inspire 首页",
            variants: [
              { id: "inspire-free", label: "Free" },
              { id: "inspire", label: "会员" },
              { id: "inspire-org-admin", label: "Enterprise Owner / Admin · 看得到组织积分" },
              { id: "inspire-org", label: "Enterprise 成员 · 看不到组织积分" },
            ],
          },
          {
            id: "g-create",
            col: 3,
            row: 0,
            title: "Create 输入",
            variants: [
              { id: "create", label: "Free · 选 Video 有付费提示" },
              { id: "create-member", label: "会员" },
            ],
          },
          { id: "d-send", col: 5, row: 0, decision: "点发送\n能提交吗？" },
          { id: "ai-consent", col: 6, row: 0 },
          { id: "first-gen-push", col: 7, row: 0 },
          { id: "generating", col: 8, row: 0 },
          { id: "marketing-optin", col: 9, row: 0 },
          {
            id: "g-work",
            col: 10,
            row: 0,
            title: "成片详情",
            variants: [
              { id: "watermark", label: "Free · 带水印" },
              { id: "work-member", label: "会员 · 无水印" },
            ],
          },
          { id: "rating", col: 12, row: 0 },

          { id: "use-case", col: 2, row: 1 },
          { id: "sessions", col: 4, row: 1 },
          { id: "offline", col: 6, row: 1 },
          { id: "push-denied-login", col: 7, row: 1 },
          { id: "gen-failed", col: 8, row: 1 },
          { id: "push-denied-optin", col: 9, row: 1 },

          { id: "attach", col: 4, row: 2 },
          {
            id: "g-locked",
            col: 6,
            row: 2,
            title: "付费墙(功能锁定)",
            variants: [
              { id: "video-locked", label: "Free 选 Video" },
              { id: "agent-locked", label: "Free 用 Agent 到视频那步" },
            ],
          },
          { id: "free-retry", col: 8, row: 2 },

          { id: "model-locked", col: 6, row: 3, tag: "Starter 选 Seedance 2.0" },
          {
            id: "g-low",
            col: 6,
            row: 4,
            title: "积分不足",
            variants: [
              { id: "low-free", label: "Free → 付费墙" },
              { id: "low-member", label: "会员 → 积分包" },
              { id: "org-low", label: "组织空间 → 联系管理员" },
            ],
          },
          { id: "parallel-limit", col: 6, row: 5, tag: "Free 上限 1 条" },
          { id: "member-cap", col: 6, row: 6, tag: "组织成员本月额度用完" },
        ],
        edges: [
          { from: "g-inspire", to: "g-create", label: "点模式入口(Agent / Image / Video / Audio)" },
          { from: "g-create", to: "d-send", label: "输入提示词 → 点发送" },
          { from: "d-send", to: "ai-consent", label: "能 · 账号第一次发送" },
          { from: "ai-consent", to: "first-gen-push", label: "点击同意 → 提交" },
          { from: "first-gen-push", to: "generating", label: "允许 / 不允许都开始生成" },
          { from: "generating", to: "marketing-optin", label: "生成成功 · 第一条成片" },
          { from: "marketing-optin", to: "g-work", label: "点开成片" },
          { from: "g-work", to: "rating", label: "点击 Save → 保存成功(第一次)" },

          { from: "g-inspire", to: "use-case", label: "点 Use Case" },
          { from: "g-create", to: "sessions", label: "点左上角 → 会话抽屉" },
          { from: "g-create", to: "attach", label: "点「+」→ 第一次弹相册授权" },

          { from: "d-send", to: "offline", label: "断网 → 发送置灰", edge: true },
          { from: "d-send", to: "g-locked", label: "Free 要生成视频 → 付费墙" },
          { from: "d-send", to: "model-locked", label: "选了锁定模型 → 付费墙 Pro tab" },
          { from: "d-send", to: "g-low", label: "积分不够这一次" },
          { from: "d-send", to: "parallel-limit", label: "同时生成数到上限 → 提示等待" },
          { from: "d-send", to: "member-cap", label: "组织成员本月额度用完 → 找管理员" },

          { from: "first-gen-push", to: "push-denied-login", label: "以前拒绝过推送 → 不弹，直接生成" },
          { from: "generating", to: "gen-failed", label: "生成失败(积分自动退回)", edge: true },
          { from: "gen-failed", to: "free-retry", label: "Free 对视频点 Retry → 付费墙" },
          { from: "marketing-optin", to: "push-denied-optin", label: "点 Turn on · 系统推送已拒绝" },
        ],
        cards: [
          {
            from: "d-send",
            to: "ai-consent",
            title: "点发送后的判断(按顺序，命中一条就停)",
            lines: [
              "① 断网 → 发送置灰，草稿保留",
              "② Free 选 Video / Agent 到生成视频那步 → 付费墙(不扣积分)",
              "③ 选了锁定模型 → 付费墙 Pro tab",
              "④ 积分不够 → Free 付费墙 / 会员积分包 / 组织找管理员",
              "⑤ 同时生成数到上限 · ⑥ 组织成员额度用完 → 提示",
              "都没命中才提交;AI 授权和推送授权只在第一次问",
            ],
          },
        ],
        tails: [{ after: "use-case", label: "Try it now → 带着提示词进 Create" }],
      },
    ],
  },
};
