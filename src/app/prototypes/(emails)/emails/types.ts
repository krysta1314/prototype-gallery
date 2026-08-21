/** 邮件模板数据 —— 产品文案全英文,分类/触发说明等演示辅助文案用中文 */

export type Block =
  | { t: "p"; text: string }
  | { t: "bullets"; items: string[] }
  | { t: "stat"; rows: { k: string; v: string }[] }
  | { t: "cta"; text: string }
  | { t: "callout"; tone: "warn" | "info"; text: string }
  | { t: "note"; text: string }
  /* ↓ 以下为营销邮件版式(对齐 BytePlus 发布邮件结构) */
  /**
   * 顶部主视觉:背景图 + 标题字艺术。
   * art 是字标图片素材;没有现成字标时改用 wordmark(纯文字字标) + 可选 tagline。
   */
  | {
      t: "banner";
      /** 占位态不需要背景图 */
      bg?: string;
      /** true = 还没有主视觉,先占个位,之后把图放进来 */
      placeholder?: boolean;
      /** 整张主视觉图(16:9),直接通栏铺满,不叠字标与标签 */
      image?: string;
      art?: string;
      /** 没有字标图片时,用这段文字排成字标 */
      wordmark?: string;
      /** 字标下方的一行小字 */
      tagline?: string;
      alt: string;
      /** 裁掉字标顶部的百分比,用于去掉素材自带的 COMING SOON */
      cropTop?: number;
      /** 字标上方的状态标签 */
      label?: string;
    }
  /** 加粗大标题(支持 ==高亮== 与 **加粗**) */
  | { t: "h"; text: string }
  /** 大标题下的品牌色小标 */
  | { t: "kicker"; text: string }
  /** 左侧色条 + emoji 的卖点条 */
  | { t: "features"; items: { icon: string; text: string }[] }
  /** 浅色信息框:标题 + ✅ 清单 */
  | { t: "box"; title: string; items: string[] }
  /** 主按钮 + 次级文字链接 */
  | { t: "action"; button: string; link: string }
  /**
   * 编号分节:序号 + 标题 + 一句说明 + CTA + 产品配图(版式对齐 Artlist 的 What's new 邮件)。
   * shot 是画在邮件里的产品示意图,不是外链截图。
   */
  | {
      t: "section";
      no: string;
      title: string;
      text: string;
      button?: string;
      /** 按钮跳转地址 */
      href?: string;
      /** 配图占位:这里写这一格之后要放什么图,渲染成灰色占位框 */
      shot?: string;
      /** 配图地址;给了就替掉占位框 */
      image?: string;
    }
  /** 两列图标网格,如 What Creators Are Building */
  | { t: "grid"; title: string; items: { icon: string; label: string; text: string }[] }
  /** 落款;title 是署名下方的头衔行(人工回信用) */
  | { t: "signoff"; line: string; team: string; title?: string }
  /** 分割线 */
  | { t: "hr" }
  /** 分割线 + 斜体 P.S. */
  | { t: "ps"; text: string }
  /**
   * 邮件页脚:一行说明 + 下划线链接。
   * hidden: 页脚保留在模板数据与「复制文案」导出里(开发接邮件系统、合规都需要),
   * 但预览里不渲染 —— 人工回信要看起来干干净净。
   */
  | { t: "footer"; text?: string; links: string[]; hidden?: boolean };

export type Category = "成员与权限" | "额度与用量" | "自动充值" | "企业与合同" | "客服与支持" | "产品与发布";

export type Template = {
  id: string;
  /** 侧边栏中文名(演示用) */
  name: string;
  category: Category;
  tone: "normal" | "warn" | "alert";
  /** 什么动作触发 */
  trigger: string;
  /** 收件人 */
  to: string;
  subject: string;
  /** true = 这封已经实际发出去了(演示标记) */
  shipped?: boolean;
  /** 邮件正文最上方的大标题;营销邮件用 banner 起头,可留空 */
  heading?: string;
  blocks: Block[];
};

/** 「填充示例数据」模式下变量的取值 */
export const SAMPLE: Record<string, string> = {
  team_name: "PressLogic Growth",
  inviter_name: "Monica Zhou",
  inviter_email: "monica.zhou@presslogic.com",
  invitee_name: "Vera Lam",
  actor_name: "Monica Zhou",
  member_name: "Ken Ho",
  new_owner_name: "Ada Wong",
  previous_owner: "Monica Zhou",
  role: "Member",
  plan_name: "Team",
  old_role: "Member",
  new_role: "Admin",
  card_brand: "Visa",
  card_last4: "4242",
  reset_date: "Sep 1, 2026",
  used: "40,000",
  remaining: "10,000",
  total: "50,000",
  limit: "5,000",
  member_used: "4,000",
  pool_remaining: "12,400",
  amount: "10,000",
  spent: "30,000",
  cap: "30,000",
  attempt: "1",
  decline_reason: "Insufficient funds",
  launch_date: "Aug 14",
  days_left: "3",
  user_name: "Lokyi",
  /* ---- 企业开户与合同 ---- */
  org_name: "Atlas Media Group",
  tier_name: "E2 · Growth",
  seats: "15",
  pool_credits: "253,500",
  effective_date: "Aug 21, 2026",
  expiry_date: "Aug 21, 2027",
  owner_email: "cfo@atlasmedia.com",
  sales_name: "Ryan Cheung",
  renewal_days_left: "30",
  auto_renew_state: "Off",
  term_used: "1,842,000",
  term_total: "3,042,000",
  active_members: "11",
};
export const CATEGORIES: Category[] = ["成员与权限", "额度与用量", "自动充值", "企业与合同", "客服与支持", "产品与发布"];
