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
                  { x: 28, y: 82, w: 44, h: 44, text: "✕ 进页面 3 秒后才出现(和付费墙一样)" },
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
    desc: "一张图串起来(2026-10-23):Inspire / Use Case → Create → 创作模式面板 → 按模式分叉。第一行是 Marketing Agent 的完整主线(发送判断 → 授权 → 生成计划 → 生成 → 通知 → 成片 → 下载 → 评分);往下依次是 Image / Video / Audio / Hybrid Reel 各自的线，发送判断、下载分享和第一行一样。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常，灰色文字框是去向说明。",
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
            title: "Create 输入框(默认 Marketing Agent)",
            variants: [
              { id: "create-member", label: "会员" },
              { id: "create", label: "Free · 右上角积分带 Upgrade" },
            ],
          },
          { id: "mode-sheet", col: 5, row: 0 },
          { id: "d-mode", col: 6, row: 0, decision: "选了哪个\n创作模式？" },

          // 第一行:Marketing Agent 完整主线
          { id: "agent-compose", col: 7, row: 0, tag: "写需求 + 带素材" },
          { id: "d-send", col: 8, row: 0, decision: "点发送\n能提交吗？" },
          { id: "ai-consent", col: 9, row: 0, tag: "账号第一次发送" },
          { id: "first-gen-push", col: 10, row: 0 },
          { id: "agent-plan", col: 11, row: 0 },
          { id: "generating", col: 12, row: 0 },
          {
            id: "g-done-push",
            col: 13,
            row: 0,
            title: "生成完成通知",
            variants: [
              { id: "done-push-app", label: "在 APP 别的页面 · 顶部横幅" },
              { id: "done-push-home", label: "在桌面 · 系统通知" },
            ],
          },
          {
            id: "g-work",
            col: 15,
            row: 0,
            title: "成片详情",
            variants: [
              { id: "watermark", label: "Free · 右下角水印" },
              { id: "work-member", label: "会员 · 无水印" },
            ],
          },
          { id: "watermark-ask", col: 17, row: 0, tag: "Free 点 Download" },
          { id: "rating", col: 18, row: 0, tag: "第一次保存成功" },

          // 入口和 Agent 的分支
          { id: "use-case", col: 0, row: 1 },
          { id: "sessions", col: 3, row: 1 },
          { id: "sessions-menu", col: 4, row: 1 },
          { id: "sessions-select", col: 5, row: 1 },
          { id: "sessions-pinned", col: 4, row: 2 },
          { id: "attach", col: 7, row: 1 },
          { id: "offline", col: 9, row: 1 },
          { id: "push-denied-login", col: 10, row: 1 },
          { id: "push-denied-settings", col: 10, row: 2 },
          { id: "agent-locked", col: 11, row: 1, tag: "Free · 计划里有视频" },
          { id: "gen-failed", col: 12, row: 1 },
          { id: "marketing-optin", col: 13, row: 1 },
          { id: "push-denied-optin", col: 15, row: 1 },
          {
            id: "g-low",
            col: 9,
            row: 3,
            title: "积分不足",
            variants: [
              { id: "low-free", label: "Free → 付费墙" },
              { id: "low-member", label: "会员 → 积分包" },
              { id: "org-low", label: "组织空间 → 联系管理员" },
            ],
          },
          { id: "free-retry", col: 12, row: 2 },
          { id: "member-cap", col: 9, row: 4, tag: "组织成员本月额度用完" },

          // Image
          { id: "image-compose", col: 7, row: 5 },
          { id: "model-settings", col: 8, row: 5, tag: "点模型名" },
          { id: "d-send-img", col: 9, row: 5, decision: "点发送\n能提交吗？" },
          { id: "image-result", col: 10, row: 5 },
          { id: "image-work", col: 11, row: 5 },
          { id: "image-saved", col: 12, row: 5 },
          { id: "quality-locked", col: 10, row: 6, tag: "Free 点 2K / 4K" },

          // Video
          { id: "d-video", col: 7, row: 7, decision: "点 Video\n是会员吗？" },
          { id: "video-compose", col: 8, row: 7 },
          { id: "d-send-video", col: 9, row: 7, decision: "点发送\n谁在发？" },
          { id: "video-result", col: 10, row: 7 },
          { id: "video-work", col: 11, row: 7 },
          { id: "video-locked", col: 8, row: 8, tag: "Free 点 Video" },
          { id: "model-locked", col: 10, row: 9, tag: "Starter 选 Seedance 2.0" },

          // Audio
          { id: "audio-voice", col: 7, row: 10 },
          { id: "audio-result", col: 8, row: 10 },
          { id: "audio-saved", col: 9, row: 10 },

          // Hybrid Reel
          { id: "d-hybrid", col: 7, row: 11, decision: "Hybrid Reel\n是 Enterprise 吗？" },
          { id: "hybrid-enterprise", col: 8, row: 11, tag: "Enterprise · 组织空间" },
          { id: "hybrid-generating", col: 9, row: 11 },
          { id: "hybrid-contact", col: 8, row: 12, tag: "Free / 个人会员" },
        ],
        edges: [
          { from: "g-inspire", to: "g-create", label: "点工具入口 / 底部 Create(工具会预填提示词)" },
          { from: "g-create", to: "mode-sheet", label: "点输入框里的模式名" },
          { from: "mode-sheet", to: "d-mode", label: "选一个模式" },
          { from: "g-inspire", to: "use-case", label: "点 Use Case" },
          { from: "g-create", to: "sessions", label: "点左上角 → 会话抽屉(历史对话)" },
          { from: "sessions", to: "sessions-menu", label: "长按一条 → Rename / Pin / Select / Delete" },
          { from: "sessions-menu", to: "sessions-select", label: "点 Select → 多选，底部 Pin | Delete" },
          { from: "sessions-menu", to: "sessions-pinned", label: "点 Pin → 排到最前、带图钉" },

          { from: "d-mode", to: "agent-compose", label: "Marketing Agent" },
          { from: "agent-compose", to: "d-send", label: "点发送" },
          { from: "d-send", to: "ai-consent", label: "能 · 账号第一次发送" },
          { from: "ai-consent", to: "first-gen-push", label: "点 Allow → 提交" },
          { from: "first-gen-push", to: "agent-plan", label: "允许 / 不允许都继续" },
          { from: "agent-plan", to: "generating", label: "点 Confirm · N credits(这时才扣积分)" },
          { from: "generating", to: "g-done-push", label: "离开这一屏 / 回桌面 · 生成完成" },
          { from: "g-done-push", to: "g-work", label: "点通知 → 成片详情" },
          { from: "g-work", to: "watermark-ask", label: "Free 点 Download → 先问去不去水印" },
          { from: "watermark-ask", to: "rating", label: "带水印保存 / 会员直接保存 · 第一次" },

          { from: "agent-compose", to: "attach", label: "点「+」→ 第一次弹相册授权" },
          { from: "d-send", to: "offline", label: "断网 → 发送置灰", edge: true },
          { from: "d-send", to: "g-low", label: "积分不够这一次" },
          { from: "d-send", to: "member-cap", label: "组织成员本月额度用完 → 找管理员" },
          { from: "first-gen-push", to: "push-denied-login", label: "以前拒绝过推送 → 不弹，直接继续" },
          { from: "push-denied-login", to: "push-denied-settings", label: "点卡片下的 Turn on → 跳 iOS 设置" },
          { from: "agent-plan", to: "agent-locked", label: "Free 点 Confirm · 计划要生成视频 → 付费墙" },
          { from: "generating", to: "gen-failed", label: "生成失败(积分自动退回)", edge: true },
          { from: "gen-failed", to: "free-retry", label: "Free 对视频点 Retry → 付费墙" },
          { from: "g-done-push", to: "marketing-optin", label: "第一条成片完成 · 推送还没决定 → 系统授权框" },
          { from: "marketing-optin", to: "push-denied-optin", label: "推送已拒绝时开营销推送 → 去设置" },

          { from: "d-mode", to: "image-compose", label: "Image" },
          { from: "image-compose", to: "model-settings", label: "点 Image · 模型名" },
          { from: "model-settings", to: "d-send-img", label: "选好模型、比例、清晰度、张数 → 点发送" },
          { from: "d-send-img", to: "image-result", label: "能 · 直接出结果卡(不出计划)" },
          { from: "image-result", to: "image-work", label: "点图片" },
          { from: "image-work", to: "image-saved", label: "点 Download all (2)" },
          { from: "d-send-img", to: "quality-locked", label: "Free 选了带钻石的清晰度 → 付费墙", edge: true },

          { from: "d-mode", to: "d-video", label: "Video" },
          { from: "d-video", to: "video-compose", label: "会员 → 进 Video 模式" },
          { from: "d-video", to: "video-locked", label: "Free(卡片带钻石标)→ 不切模式，直接弹付费墙" },
          { from: "video-compose", to: "d-send-video", label: "写提示词 → 点发送" },
          { from: "d-send-video", to: "video-result", label: "模型在自己档位内" },
          { from: "video-result", to: "video-work", label: "点全屏" },
          { from: "d-send-video", to: "model-locked", label: "选了更高档的模型 → 付费墙 Pro tab" },

          { from: "d-mode", to: "audio-voice", label: "Audio · 点音色" },
          { from: "audio-voice", to: "audio-result", label: "选好音色、写文案 → 点发送" },
          { from: "audio-result", to: "audio-saved", label: "点下载" },

          { from: "d-mode", to: "d-hybrid", label: "Hybrid Reel" },
          { from: "d-hybrid", to: "hybrid-enterprise", label: "是 · 点「+」放实拍片段 → 发送" },
          { from: "hybrid-enterprise", to: "hybrid-generating", label: "点 Confirm(扣组织积分)" },
          { from: "d-hybrid", to: "hybrid-contact", label: "不是 → 不切模式，打开 Contact Sales" },
        ],
        cards: [
          {
            from: "d-send",
            to: "ai-consent",
            title: "点发送后的判断(五个模式通用，按顺序，命中一条就停)",
            lines: [
              "① 断网 → 发送置灰，草稿保留",
              "② Free 用 Agent 做视频：确认计划时拦(点 Video 模式在面板里就拦了)",
              "③ 选了锁定模型 / 清晰度 → 付费墙",
              "④ 积分不够 → Free 付费墙 / 会员积分包 / 组织找管理员",
              "⑤ 组织成员额度用完 → 提示找管理员",
              "都没命中才提交;AI 授权和推送授权只在第一次问",
            ],
          },
        ],
        tails: [{ after: "use-case", label: "Use this template → 带着提示词、模式、参考图进 Create" }],
      },
    ],
  },
  "@flow-pay": {
    title: "付费转化",
    desc: "一张图串起来(2026-10-23):先看是谁、从哪里进来 → Free 从各种触发进付费墙 → App Store 确认 → 开通;会员看自己的档位、升降级、买积分包、管理订阅;网页订阅;恢复购买。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常。",
    sections: [
      {
        title: "",
        nodes: [
          { id: "d-who", col: 0, row: 0, decision: "谁、从哪里\n进来？" },
          {
            id: "g-trigger",
            col: 1,
            row: 0,
            title: "付费墙(从哪里弹出来)",
            variants: [
              { id: "daily-paywall", label: "冷启动 · 距上次满 24 小时" },
              { id: "video-locked", label: "创作模式里点带钻石的 Video" },
              { id: "agent-locked", label: "Agent 确认计划 · 要生成视频" },
              { id: "model-locked", label: "Starter 选 Seedance 2.0 · 开 Pro tab" },
              { id: "low-free", label: "积分不足" },
              { id: "promo-paywall", label: "运营弹窗 · 带加赠角标" },
            ],
          },
          { id: "first-paywall-iap", col: 5, row: 0, tag: "选档位 + 年付 / 月付 → Continue" },
          { id: "purchase-success", col: 6, row: 0 },
          { id: "paid-me", col: 7, row: 0 },
          { id: "iap-failed", col: 5, row: 1 },
          { id: "prices-failed", col: 5, row: 2 },
          { id: "region-other", col: 5, row: 3 },
          { id: "exit-offer", col: 5, row: 4, tag: "Free 第一次关付费墙" },

          { id: "sub-app", col: 1, row: 5, tag: "当前档位禁用 · 标 Current plan" },
          { id: "d-change", col: 2, row: 5, decision: "切到别的档位\n高还是低？" },
          { id: "sub-downgrade", col: 3, row: 5, tag: "选低档" },
          { id: "sub-upgrade", col: 3, row: 6 },
          { id: "low-member", col: 1, row: 7 },
          { id: "topup-done", col: 2, row: 7 },
          { id: "sub-manage", col: 1, row: 8, tag: "设置 → Subscription" },
          { id: "sub-cancelled", col: 2, row: 8 },
          { id: "sub-ended", col: 3, row: 8 },
          { id: "billing-retry", col: 1, row: 9 },

          { id: "sub-web", col: 1, row: 10, tag: "在 buzzvideo.ai 订阅" },
          { id: "sub-duplicate", col: 2, row: 10 },

          { id: "d-restore", col: 1, row: 11, decision: "点 Restore\n这个 Apple ID 有订阅吗？" },
          { id: "restore-success", col: 2, row: 11 },
          { id: "restore-none", col: 2, row: 12 },
          { id: "restore-other", col: 2, row: 13 },
        ],
        edges: [
          { from: "d-who", to: "g-trigger", label: "Free 用户 · 被拦下或冷启动" },
          { from: "g-trigger", to: "first-paywall-iap", label: "点 Continue → App Store 确认框" },
          { from: "first-paywall-iap", to: "purchase-success", label: "双击侧边按钮 / Face ID 确认" },
          { from: "purchase-success", to: "paid-me", label: "关掉成功页 · 回到 Me" },
          { from: "first-paywall-iap", to: "iap-failed", label: "扣款失败(卡被拒 / 断网)→ 留在付费墙", edge: true },
          { from: "g-trigger", to: "prices-failed", label: "拉不到 App Store 价格", edge: true },
          { from: "g-trigger", to: "region-other", label: "非美区 · 没有网页订阅外链" },
          { from: "g-trigger", to: "exit-offer", label: "点 ✕ · 第一次 → 挽留页(首月 50% off)" },

          { from: "d-who", to: "sub-app", label: "APP 会员打开付费墙" },
          { from: "sub-app", to: "d-change", label: "点 Starter / Ultra tab" },
          { from: "d-change", to: "sub-downgrade", label: "低档 → 下个续费日生效" },
          { from: "d-change", to: "sub-upgrade", label: "高档 → 立即生效" },
          { from: "d-who", to: "low-member", label: "会员积分不够这一次" },
          { from: "low-member", to: "topup-done", label: "选一档 → Continue → 确认" },
          { from: "d-who", to: "sub-manage", label: "会员进 设置 → Subscription" },
          { from: "sub-manage", to: "sub-cancelled", label: "在 App Store 取消自动续费" },
          { from: "sub-cancelled", to: "sub-ended", label: "到续费日" },
          { from: "sub-manage", to: "billing-retry", label: "续费扣款失败 → 宽限期", edge: true },
          { from: "d-who", to: "sub-web", label: "网页订阅的用户" },
          { from: "sub-web", to: "sub-duplicate", label: "又在 App Store 订一份", edge: true },
          { from: "d-who", to: "d-restore", label: "换机 / 重装后点 Restore" },
          { from: "d-restore", to: "restore-success", label: "有 · 属于当前账号 → 恢复" },
          { from: "d-restore", to: "restore-none", label: "没买过", edge: true },
          { from: "d-restore", to: "restore-other", label: "订阅属于其他账号", edge: true },
        ],
      },
    ],
  },
  "@flow-account": {
    title: "账号与设置",
    desc: "一张图串起来(2026-10-23):先看是什么账号 → 个人账号的 Me 页(按套餐)→ 设置 → 订阅管理 / 退出 / 删除;Enterprise 的工作区切换和成员管理;组织空间生成时被额度拦下。菱形是判断，虚线框是同一屏的身份 / 状态变体，橙色虚线是异常，灰色文字框是去向说明。",
    sections: [
      {
        title: "",
        nodes: [
          { id: "d-acct", col: 0, row: 0, decision: "点 Me\n是什么账号？" },
          {
            id: "g-me",
            col: 1,
            row: 0,
            title: "Me 页(按套餐)",
            variants: [
              { id: "acct-free", label: "Free · 积分卡是 Upgrade" },
              { id: "acct-starter", label: "Starter" },
              { id: "acct-pro", label: "Pro" },
              { id: "acct-ultra", label: "Ultra" },
              { id: "me", label: "会员 · Buy credits / 邀请好友" },
            ],
          },
          { id: "settings", col: 5, row: 0, tag: "点右上角齿轮" },
          { id: "sub-manage", col: 6, row: 0 },
          { id: "t-sub-next", col: 7, row: 0, text: "跳到 App Store\n订阅管理" },
          { id: "empty-assets", col: 1, row: 1 },
          { id: "sign-out", col: 6, row: 1 },
          { id: "delete-account", col: 6, row: 2 },

          { id: "acct-enterprise", col: 1, row: 3 },
          { id: "workspace-switch", col: 2, row: 3 },
          { id: "workspace-personal", col: 3, row: 3 },
          { id: "members", col: 1, row: 4, tag: "Owner / Admin" },
          { id: "member-limit", col: 2, row: 4 },
          { id: "d-org", col: 1, row: 5, decision: "在组织空间点发送\n额度够吗？" },
          { id: "org-low", col: 2, row: 5, tag: "组织积分不够" },
          { id: "member-cap", col: 2, row: 6, tag: "自己本月上限用完" },
        ],
        edges: [
          { from: "d-acct", to: "g-me", label: "个人账号" },
          { from: "g-me", to: "settings", label: "点齿轮" },
          { from: "settings", to: "sub-manage", label: "点 Subscription" },
          { from: "sub-manage", to: "t-sub-next", label: "Manage in App Store" },
          { from: "g-me", to: "empty-assets", label: "新用户 · 还没生成过" },
          { from: "settings", to: "sign-out", label: "点 Sign out → 确认" },
          { from: "settings", to: "delete-account", label: "点 Delete account → 确认(不可恢复)", edge: true },
          { from: "d-acct", to: "acct-enterprise", label: "Enterprise 用户" },
          { from: "acct-enterprise", to: "workspace-switch", label: "点名字下的工作区名" },
          { from: "workspace-switch", to: "workspace-personal", label: "选 Personal" },
          { from: "acct-enterprise", to: "members", label: "Owner / Admin 点 Members" },
          { from: "members", to: "member-limit", label: "点某人的额度 → 设每月上限" },
          { from: "d-acct", to: "d-org", label: "在组织空间生成" },
          { from: "d-org", to: "org-low", label: "组织积分不够 → 提示联系管理员", edge: true },
          { from: "d-org", to: "member-cap", label: "超过管理员给的上限 → 提示找管理员", edge: true },
        ],
      },
    ],
  },
};
