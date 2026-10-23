/**
 * 评审左栏的多级导航(最多 4 级),按用户旅程的先后排:一级 = 旅程阶段,二级 = 功能,三级 = 子流程,叶子 = 旅程 id。
 * 只有一条的分组直接拍平成叶子。
 * 每个模块的异常就放在该模块下面(旅程 group 是「异常与边界」的,导航里用警示样式标出)。
 * 新增旅程时记得挂到这里(只在旅程图里出现的 mapOnly 旅程不挂);tests/buzzvideo-app/journeys.test.ts 会检查每条旅程都恰好出现一次
 */
export type NavNode = { label: string; children: (NavNode | string)[]; /** 只有一级模块有:模块色,左栏标题、引导线和右栏路径都用它区分模块 */ color?: string };

/** 不是旅程、而是整页内容的导航项(点了中间换成这一页) */
export const EVENTS_PAGE = "@events";
export const isPage = (id: string) => id.startsWith("@");
/** 一级模块第一项的「用户旅程图」页(截图 + 箭头连线，见 flows.ts) */
export const FLOW_FIRST = "@flow-first";
export const FLOW_CREATE = "@flow-create";
export const FLOW_PAY = "@flow-pay";
export const FLOW_ACCOUNT = "@flow-account";
export const PAGE_TITLES: Record<string, string> = { [EVENTS_PAGE]: "埋点汇总", [FLOW_FIRST]: "用户旅程图", [FLOW_CREATE]: "用户旅程图", [FLOW_PAY]: "用户旅程图", [FLOW_ACCOUNT]: "用户旅程图" };

export const NAV_TREE: NavNode[] = [
  {
    label: "首次安装",
    color: "#2f6fed",
    children: [
      FLOW_FIRST,
      { label: "安装与引导", children: ["fresh-home", "splash", "onboarding", "media-failed"] },
      {
        label: "登录",
        children: [
          "login",
          "login-page",
          "login-failed",
          { label: "Apple 登录", children: ["apple-first", "apple-known"] },
          { label: "Google 登录", children: ["google-alert", "google-chooser"] },
          { label: "邮箱登录", children: ["email-login", "email-invalid", "email-code", "email-wrong", "email-expired"] },
        ],
      },
      { label: "首登付费墙与挽留", children: ["first-paywall", "first-paywall-iap", "first-paywall-bought", "exit-offer", "exit-offer-prices-failed", "exit-offer-iap", "exit-offer-bought", "exit-offer-later", "exit-offer-expired"] },
    ],
  },
  {
    label: "开始创作",
    color: "#8b5cf6",
    children: [
      FLOW_CREATE,
      { label: "首页", children: ["inspire-free", "inspire", "inspire-org-admin", "inspire-org", "use-case"] },
      { label: "Create", children: ["create", "create-member", "mode-sheet", "sessions", "sessions-menu", "sessions-pinned", "sessions-select", "attach", "model-settings", "ai-consent", "first-gen-push", "push-denied-login", "generating", "gen-failed", "free-retry"] },
      { label: "各创作模式", children: ["agent-plan", "image-compose", "image-result", "image-work", "video-compose", "video-result", "audio-voice", "audio-result", "hybrid-contact", "hybrid-enterprise"] },
      { label: "成片", children: ["done-push-app", "done-push-home", "marketing-optin", "push-denied-optin", "watermark", "watermark-ask", "work-member", "rating"] },
    ],
  },
  {
    label: "付费转化",
    color: "#16a34a",
    children: [
      FLOW_PAY,
      { label: "付费墙触发", children: ["daily-paywall", "video-locked", "agent-locked", "model-locked", "low-free", "low-member"] },
      { label: "购买", children: ["purchase-success", "iap-failed", "prices-failed"] },
      { label: "订阅状态", children: ["sub-app", "sub-web", "sub-manage", "sub-downgrade", "sub-cancelled", "sub-duplicate", "region-other", "billing-retry"] },
      { label: "恢复购买", children: ["restore-success", "restore-none", "restore-other"] },
    ],
  },
  {
    label: "留存与增长",
    color: "#db2777",
    children: [
      { label: "运营活动", children: ["promo-popup", "promo-paywall", "promo-push", "promo-capped"] },
      { label: "邀请好友", children: ["invite", "invite-capped"] },
    ],
  },
  {
    label: "账号与设置",
    color: "#0891b2",
    children: [
      FLOW_ACCOUNT,
      { label: "个人账号", children: ["acct-free", "acct-starter", "acct-pro", "acct-ultra"] },
      { label: "Enterprise", children: ["acct-enterprise", "team-publish", "members", "org-low", "member-cap"] },
      { label: "Me 与设置", children: ["me", "settings", "feedback", "empty-assets"] },
      { label: "退出与删除", children: ["sign-out", "delete-account"] },
    ],
  },
  {
    label: "全局",
    color: "#64748b",
    children: ["offline"],
  },
  {
    label: "埋点",
    color: "#374151",
    children: [EVENTS_PAGE],
  },
];

/** 这条旅程所在一级模块的颜色 */
export function moduleColorOf(id: string): string | undefined {
  return NAV_TREE.find((m) => navLeaves(m.children).includes(id))?.color;
}

/** 叶子(旅程 id)按导航顺序展开 */
export function navLeaves(nodes: (NavNode | string)[] = NAV_TREE): string[] {
  return nodes.flatMap((n) => (typeof n === "string" ? [n] : navLeaves(n.children)));
}

/** 某条旅程所在的各级分组标签(用来自动展开当前路径) */
export function navPathOf(id: string, nodes: (NavNode | string)[] = NAV_TREE, trail: string[] = []): string[] | null {
  for (const n of nodes) {
    if (typeof n === "string") {
      if (n === id) return trail;
      continue;
    }
    const hit = navPathOf(id, n.children, [...trail, n.label]);
    if (hit) return hit;
  }
  return null;
}
