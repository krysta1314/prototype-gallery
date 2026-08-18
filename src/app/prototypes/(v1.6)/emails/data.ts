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
      bg: string;
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

export type Category = "成员与权限" | "额度与用量" | "自动充值" | "客服与支持" | "产品与发布";

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
};

export const TEMPLATES: Template[] = [
  {
    id: "invite-member",
    name: "邀请加入团队",
    category: "成员与权限",
    tone: "normal",
    trigger: "Team Settings → Team Members → Invite user,发送成功后立即发出",
    to: "被邀请的邮箱地址",
    subject: "You're invited to join {{team_name}} on BuzzVideo",
    heading: "Join {{team_name}} on BuzzVideo",
    blocks: [
      { t: "p", text: "{{inviter_name}} ({{inviter_email}}) has invited you to join {{team_name}}'s workspace on the {{plan_name}} plan." },
      { t: "cta", text: "Join Team" },
      { t: "note", text: "The link expires in 7 days. Not expecting this? Ignore this email." },
    ],
  },
  {
    id: "invite-finance",
    name: "邀请成为账单联系人",
    category: "成员与权限",
    tone: "normal",
    trigger: "Plans and Billing → Billing contacts → 添加账单联系人后发出",
    to: "被邀请的账单联系人邮箱",
    subject: "{{inviter_name}} invited you to handle billing for {{team_name}}",
    heading: "Handle billing for {{team_name}}",
    blocks: [
      { t: "p", text: "{{inviter_name}} added you as a billing contact. You can change the plan, buy credits and download invoices." },
      { t: "p", text: "You won't see the team's projects or AI tools, and this doesn't use one of the team's paid seats." },
      { t: "cta", text: "Accept invitation" },
      { t: "note", text: "The link expires in 7 days. Not expecting this? Ignore this email." },
    ],
  },
  {
    id: "role-changed",
    name: "角色变更",
    category: "成员与权限",
    tone: "normal",
    trigger: "Owner / Admin 在成员列表里改了某人的角色",
    to: "被改角色的成员",
    subject: "You're now {{new_role}} in {{team_name}}",
    heading: "Your role changed",
    blocks: [
      { t: "p", text: "{{actor_name}} changed your role in {{team_name}} from {{old_role}} to {{new_role}}." },
      { t: "p", text: "Admins can invite and remove members, change roles and edit team details. Billing stays with the owner." },
      { t: "cta", text: "Open {{team_name}}" },
    ],
  },
  {
    id: "removed",
    name: "被移出团队",
    category: "成员与权限",
    tone: "warn",
    trigger: "Owner / Admin 在成员列表里执行 Remove from team",
    to: "被移除的成员",
    subject: "You've been removed from {{team_name}}",
    heading: "You've been removed from {{team_name}}",
    blocks: [
      { t: "p", text: "{{actor_name}} removed you from {{team_name}}. You no longer have access to the team's projects, assets or credits." },
      { t: "p", text: "Your personal space is untouched." },
      { t: "cta", text: "Go to BuzzVideo" },
      { t: "note", text: "Think this is a mistake? Ask {{actor_name}}." },
    ],
  },
  {
    id: "ownership-new",
    name: "Owner 转移 · 通知新 Owner",
    category: "成员与权限",
    tone: "warn",
    trigger: "原 Owner 在 Team Details 完成 Transfer ownership",
    to: "新 Owner",
    subject: "You're now the owner of {{team_name}}",
    heading: "You're the owner of {{team_name}}",
    blocks: [
      { t: "p", text: "{{previous_owner}} transferred {{team_name}} to you. You now manage its plan, seats and credits. {{previous_owner}} stays on the team as an admin." },
      { t: "callout", tone: "warn", text: "Billing still goes to {{card_brand}} {{card_last4}}. Change it if the team should be billed to you." },
      { t: "cta", text: "Check billing" },
    ],
  },
  {
    id: "ownership-previous",
    name: "Owner 转移 · 通知原 Owner",
    category: "成员与权限",
    tone: "normal",
    trigger: "同上,给发起转移的原 Owner 一封确认",
    to: "原 Owner",
    subject: "You transferred {{team_name}} to {{new_owner_name}}",
    heading: "Ownership transferred",
    blocks: [
      { t: "p", text: "{{new_owner_name}} now owns {{team_name}}. You're an admin, so you keep access to the team's work but no longer manage its plan." },
      { t: "callout", tone: "warn", text: "Billing still goes to {{card_brand}} {{card_last4}}. If that card is yours, ask {{new_owner_name}} to replace it." },
      { t: "cta", text: "Open team settings" },
    ],
  },
  {
    id: "team-deleted",
    name: "团队已解散",
    category: "成员与权限",
    tone: "alert",
    trigger: "Owner 在 Team Details → Danger zone 解散团队(需先取消订阅)",
    to: "团队全体成员与账单联系人",
    subject: "{{team_name}} was deleted",
    heading: "{{team_name}} was deleted",
    blocks: [
      { t: "p", text: "{{actor_name}} deleted {{team_name}}. Its shared projects, shared assets and remaining credits are gone and can't be restored." },
      { t: "p", text: "Your personal space is untouched." },
      { t: "cta", text: "Go to BuzzVideo" },
    ],
  },

  {
    id: "pool-80",
    name: "团队积分用到 80%",
    category: "额度与用量",
    tone: "warn",
    trigger: "团队积分池累计消耗达到本周期总量的 80%,每周期只发一次",
    to: "Owner + Admin + Finance",
    subject: "{{team_name}} has {{remaining}} credits left",
    heading: "{{remaining}} credits left this cycle",
    blocks: [
      { t: "p", text: "{{team_name}} has used {{used}} of {{total}} credits. Top up if the team needs more before they reset." },
      {
        t: "stat",
        rows: [
          { k: "Used", v: "{{used}} of {{total}}" },
          { k: "Left", v: "{{remaining}}" },
          { k: "Resets", v: "{{reset_date}}" },
        ],
      },
      { t: "cta", text: "Buy credits" },
      { t: "note", text: "Sent to owners, admins and billing contacts." },
    ],
  },
  {
    id: "pool-100",
    name: "团队积分已用尽",
    category: "额度与用量",
    tone: "alert",
    trigger: "团队积分池余额归零",
    to: "Owner + Admin + Finance",
    subject: "{{team_name}} is out of credits",
    heading: "{{team_name}} is out of credits",
    blocks: [
      { t: "p", text: "The team has used all its credits for this cycle. Nobody can start new jobs until you top up. Credits reset on {{reset_date}}." },
      { t: "p", text: "Jobs already running will finish." },
      { t: "cta", text: "Buy credits" },
      { t: "note", text: "Sent to owners, admins and billing contacts." },
    ],
  },
  {
    id: "member-limit-80",
    name: "成员额度用到 80%",
    category: "额度与用量",
    tone: "warn",
    trigger: "设了月度上限的成员,用量达到自身上限的 80%",
    to: "Owner + Admin",
    subject: "{{member_name}} is near their credit limit",
    heading: "{{member_name}} is near their limit",
    blocks: [
      { t: "p", text: "{{member_name}} has used {{member_used}} of the {{limit}} monthly credits set for them in {{team_name}}. At the limit they can't start new jobs." },
      { t: "p", text: "The team pool still has {{pool_remaining}} credits. Raise their limit if they need more before {{reset_date}}." },
      { t: "cta", text: "Adjust limit" },
    ],
  },
  {
    id: "member-limit-100",
    name: "成员额度已用满",
    category: "额度与用量",
    tone: "alert",
    trigger: "设了月度上限的成员,用量达到 100%(Soft / Hard 都发,只发给管理者,不发给成员本人)",
    to: "Owner + Admin",
    subject: "{{member_name}} hit their credit limit",
    heading: "{{member_name}} hit their limit",
    blocks: [
      { t: "p", text: "{{member_name}} has used all {{limit}} of their monthly credits in {{team_name}} and can't start new jobs. Their limit resets on {{reset_date}}." },
      { t: "p", text: "This isn't a team shortage. The pool still has {{pool_remaining}} credits." },
      { t: "cta", text: "Adjust limit" },
    ],
  },

  {
    id: "autotopup-failed",
    name: "自动充值扣款失败",
    category: "自动充值",
    tone: "warn",
    trigger: "自动充值触发但扣款被拒,每次失败发一封,间隔 24 小时最多重试三次",
    to: "Owner + Admin + Finance",
    subject: "Auto top-up failed for {{team_name}}",
    heading: "We couldn't charge your card",
    blocks: [
      { t: "p", text: "The auto top-up for {{team_name}} didn't go through." },
      {
        t: "stat",
        rows: [
          { k: "Amount", v: "{{amount}} credits" },
          { k: "Card", v: "{{card_brand}} {{card_last4}}" },
          { k: "Reason", v: "{{decline_reason}}" },
          { k: "Attempt", v: "{{attempt}} of 3" },
        ],
      },
      { t: "p", text: "We'll try again in 24 hours." },
      { t: "cta", text: "Update payment method" },
    ],
  },
  {
    id: "autotopup-paused",
    name: "自动充值已暂停",
    category: "自动充值",
    tone: "alert",
    trigger: "连续三次扣款失败后,自动充值被置为 Paused",
    to: "Owner + Admin + Finance",
    subject: "Auto top-up paused for {{team_name}}",
    heading: "Auto top-up is paused",
    blocks: [
      { t: "p", text: "Three attempts to charge {{card_brand}} {{card_last4}} failed ({{decline_reason}}), so we've paused auto top-up for {{team_name}}." },
      { t: "p", text: "Credits won't top up on their own until you update the card and switch it back on." },
      { t: "cta", text: "Update payment method" },
    ],
  },
  {
    id: "autotopup-cap",
    name: "自动充值达月度上限",
    category: "自动充值",
    tone: "warn",
    trigger: "本月自动充值累计金额达到设定的月度封顶(不是扣款失败,不进重试)",
    to: "Owner + Admin + Finance",
    subject: "{{team_name}} hit its auto top-up cap",
    heading: "Auto top-up is done for this month",
    blocks: [
      { t: "p", text: "Auto top-up has added {{spent}} credits to {{team_name}} this month, which is the {{cap}} cap you set. It won't run again until {{reset_date}}." },
      { t: "p", text: "Your card is fine. You can still buy credits manually, or raise the cap." },
      { t: "cta", text: "Review auto top-up" },
    ],
  },

  {
    id: "generation-blocked-apology",
    name: "生成失败道歉 + 补偿",
    category: "客服与支持",
    tone: "warn",
    trigger: "用户就「video generation failed / all video saying sensitive」提交反馈后,由 PM 人工回信(非系统自动发送)",
    to: "提交反馈的付费用户本人",
    subject: "BuzzVideo Feedback Response",
    blocks: [
      { t: "p", text: "Hi {{user_name}}," },
      { t: "p", text: "This is Monica, Product Manager at BuzzVideo." },
      { t: "p", text: "I received your feedback today regarding the issue where video generation failed with the error message \"all video saying sensitive.\" I am sincerely sorry for the frustrating experience this caused you." },
      { t: "p", text: "To help look into this, we checked the system logs with our downstream API provider. Their automated moderation flagged that the **4th reference image** submitted triggered a safety filter error (\"reference image contains sensitive information\"), which unfortunately halted the video generation process." },
      { t: "p", text: "Please also rest assured that whenever a generation fails, the credits for it are returned to your account immediately and automatically — you are never charged for a video/image you didn't get." },
      { t: "p", text: "If you would still like to generate this video, we recommend a couple of quick workarounds:" },
      { t: "p", text: "1. Swap the 4th reference image: try replacing it with a different photo that avoids elements that might inadvertently trigger strict content filters." },
      { t: "p", text: "2. Adjust or crop the image: making minor adjustments or cropping parts of the image can sometimes pass the automated check smoothly." },
      { t: "p", text: "We understand that automated AI moderation can sometimes be overly sensitive, and we deeply regret the inconvenience this caused. While we do not have a refund policy in place, we truly value you as part of our community." },
      { t: "p", text: "As a gesture of our appreciation and to help make things right, we have added **2,000 extra credits** directly to your account. You can start using them right away to try out new ideas and creations." },
      { t: "p", text: "Our team is constantly releasing updates, upgrading our AI models. We hope these bonus credits allow you to explore our latest features, and we are committed to providing you with a much smoother experience moving forward." },
      { t: "p", text: "If you have any further questions, concerns, or feedback, please feel free to reply directly to this email — I'll be glad to help personally." },
      { t: "signoff", line: "Best regards,", team: "Monica", title: "Product Manager@BuzzVideo" },
      { t: "footer", text: "You're receiving this because you have a BuzzVideo account.", links: ["Unsubscribe"], hidden: true },
    ],
  },

  {
    id: "seedance-25-teaser",
    name: "Seedance 2.5 · 上线预热",
    category: "产品与发布",
    tone: "normal",
    trigger: "上线前 3 天群发,面向近 90 天未生成过视频的沉睡用户 + 已注册但未付费用户(召回)",
    to: "全量注册用户,按沉睡 / 活跃分段发送",
    subject: "🚀 Get ready for Seedance 2.5! Your next video ad is one prompt away",
    blocks: [
      {
        t: "banner",
        bg: "/prototypes/homepage/new-model-festival-bg.png",
        art: "/prototypes/homepage/seedance-2-5-coming-soon-title.png",
        alt: "Seedance 2.5 coming soon",
      },
      { t: "p", text: "Hi there," },
      { t: "h", text: "Your next video ad, in one generation — Seedance 2.5 is coming to BuzzVideo!" },
      { t: "kicker", text: "Ad-ready AI video in one click" },
      { t: "p", text: "Seedance 2.5 is a next-generation multimodal video model built for the people who ship ads — creators, marketers and agency teams:" },
      {
        t: "features",
        items: [
          { icon: "🎬", text: "30-second native video output in one generation" },
          { icon: "🎨", text: "Up to 50 multimodal reference inputs" },
          { icon: "✂️", text: "Next-level video editing control" },
        ],
      },
      { t: "p", text: "From ad creatives and social content to product demos and explainer videos, Seedance 2.5 delivers production-quality results in minutes — so stay tuned for more." },
      {
        t: "box",
        title: "Try it free on BuzzVideo",
        items: ["No credit card required", "Instant access with your existing account"],
      },
      { t: "action", button: "Start Creating Now →", link: "Explore more of Seedance 2.5" },
      {
        t: "grid",
        title: "Built for the teams who run ads:",
        items: [
          { icon: "📱", label: "Social ads", text: "Thumb-stopping creative for TikTok, Reels and Shorts" },
          { icon: "🛍️", label: "E-commerce", text: "A product ad for every SKU, no shoot required" },
          { icon: "📊", label: "Performance marketing", text: "Ten ad variants to test in an afternoon" },
          { icon: "🏢", label: "Agencies", text: "Client-ready ad concepts in minutes, not weeks" },
        ],
      },
      { t: "p", text: "Ready to see what's possible? Your account is all set — just click and create." },
      { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
      { t: "hr" },
      { t: "p", text: "Any questions? Just write to info@presslogic.com — we read every message." },
    ],
  },
  {
    id: "seedance-25-launch",
    name: "Seedance 2.5 · 正式上线",
    category: "产品与发布",
    tone: "normal",
    trigger: "模型正式开放当天群发,预热邮件的收件人全量再发一次(点过预热 CTA 的优先)",
    to: "全量注册用户",
    subject: "🎬 Seedance 2.5 is live! Make your first 30-second video ad today",
    blocks: [
      {
        t: "banner",
        bg: "/prototypes/homepage/new-model-festival-bg.png",
        art: "/prototypes/homepage/seedance-2-5-title.webp",
        alt: "Seedance 2.5 is live",
        cropTop: 14,
        label: "Now live",
      },
      { t: "p", text: "Hi there," },
      { t: "p", text: "The wait is over. Seedance 2.5 is live on BuzzVideo today — come and give it a try!" },
      { t: "h", text: "Turn one prompt into a finished video ad — Seedance 2.5 is live!" },
      { t: "kicker", text: "Ad-ready AI video in one click" },
      { t: "p", text: "Pick Seedance 2.5 from the model list, describe the ad you want, and generate. No timeline, no stitching:" },
      {
        t: "features",
        items: [
          { icon: "🎬", text: "30-second native video output in one generation" },
          { icon: "🎨", text: "Up to 50 multimodal reference inputs" },
          { icon: "✂️", text: "Next-level video editing control" },
        ],
      },
      { t: "p", text: "Characters, lighting and camera motion stay consistent from the first shot to the last, so Seedance 2.5 gives you a video you can actually publish — not a clip you have to fix." },
      {
        t: "box",
        title: "Try it free on BuzzVideo",
        items: ["No credit card required", "Instant access with your existing account"],
      },
      { t: "action", button: "Try Seedance 2.5 →", link: "Browse prompts in the template gallery" },
      {
        t: "grid",
        title: "Built for the teams who run ads:",
        items: [
          { icon: "📱", label: "Social ads", text: "Thumb-stopping creative for TikTok, Reels and Shorts" },
          { icon: "🛍️", label: "E-commerce", text: "A product ad for every SKU, no shoot required" },
          { icon: "📊", label: "Performance marketing", text: "Ten ad variants to test in an afternoon" },
          { icon: "🏢", label: "Agencies", text: "Client-ready ad concepts in minutes, not weeks" },
        ],
      },
      { t: "p", text: "Your first 30-second video is one prompt away. Open BuzzVideo and create it." },
      { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
      { t: "hr" },
      { t: "p", text: "Any questions? Just write to info@presslogic.com — we read every message." },
    ],
  },
  {
    id: "asset-library-launch",
    name: "Asset Library · 正式上线",
    category: "产品与发布",
    tone: "normal",
    trigger: "Asset Library 开放当天群发,面向所有注册用户(近 90 天有过生成记录的优先发送)",
    to: "全量注册用户",
    subject: "🗂️ Asset Library is live — everything you've made, in one place",
    blocks: [
      {
        t: "banner",
        bg: "/prototypes/homepage/new-model-festival-bg.png",
        wordmark: "Asset Library",
        tagline: "One home for everything you create",
        alt: "Asset Library is live",
        label: "Now live",
      },
      { t: "p", text: "Hi there," },
      { t: "p", text: "Until today, finding a video you generated last week meant scrolling back through old sessions. Not anymore." },
      { t: "h", text: "Every image, video and audio you've made — now in ==one library==" },
      { t: "kicker", text: "Nothing to set up. It's already filled in." },
      { t: "p", text: "Asset Library is a new entry in your left sidebar. Open it and everything you've generated is already there, grouped by date and ready to reuse:" },
      {
        t: "features",
        items: [
          { icon: "🗂️", text: "Every generation saved automatically, across all your sessions" },
          { icon: "⬆️", text: "Upload your own images, videos, audio and PDFs to keep references in the same place" },
          { icon: "⚡", text: "Filter by type or source, sort by date, multi-select and download in one go" },
        ],
      },
      { t: "p", text: "Click any asset to open it full size, see the exact model and settings behind it, jump straight back to the session that made it, or regenerate it with one click." },
      {
        t: "box",
        title: "Already in your account",
        items: [
          "Your past generations are there — nothing to import",
          "Available on every plan, including Free",
        ],
      },
      { t: "action", button: "Open Asset Library →", link: "See how it works" },
      {
        t: "grid",
        title: "What it saves you:",
        items: [
          { icon: "🔁", label: "Reuse", text: "Drop last month's best-performing shot into a new ad" },
          { icon: "📦", label: "Handoff", text: "Batch-select a campaign's assets and download them at once" },
          { icon: "🎯", label: "References", text: "Keep product photos and brand files next to your outputs" },
          { icon: "🧾", label: "Traceability", text: "See the model, prompt and settings behind every result" },
        ],
      },
      { t: "p", text: "Open BuzzVideo and check the sidebar — your library is waiting." },
      { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
      { t: "hr" },
      { t: "p", text: "Any questions? Just write to info@presslogic.com — we read every message." },
    ],
  },
  {
    id: "seed-audio-launch",
    name: "Seed-Audio 1.0 · 正式上线",
    category: "产品与发布",
    tone: "normal",
    trigger: "Seed-Audio 1.0 开放当天群发,面向全量注册用户",
    to: "全量注册用户",
    subject: "🎙️ Seed-Audio 1.0 is live! Turn any script into a voiceover",
    blocks: [
      {
        t: "banner",
        bg: "/prototypes/homepage/new-model-festival-bg.png",
        wordmark: "Seed-Audio 1.0",
        tagline: "AI voiceover, inside your workflow",
        alt: "Seed-Audio 1.0 is live",
        label: "Now live",
      },
      { t: "p", text: "Hi there," },
      { t: "p", text: "Your videos have had everything but a voice. Seed-Audio 1.0 is live on BuzzVideo today." },
      { t: "h", text: "Paste a script, pick a voice, get ==studio-quality voiceover== in seconds" },
      { t: "kicker", text: "No recording, no studio, no voice actor" },
      { t: "p", text: "Seed-Audio 1.0 is our new text-to-speech model, built to sit right where you already work:" },
      {
        t: "features",
        items: [
          { icon: "🎙️", text: "Natural, ad-ready voiceover from any script in seconds" },
          { icon: "🎚️", text: "A full voice library, plus speed, pitch and volume control" },
          { icon: "🧩", text: "Two ways in — ask the Marketing Agent in chat, or drop a Generate Audio node on your Canvas" },
        ],
      },
      { t: "p", text: "Preview any voice before you spend a credit, export as MP3 or WAV, and turn on subtitles to get a timed transcript alongside the audio — ready to drop straight onto your video." },
      {
        t: "box",
        title: "Try it free on BuzzVideo",
        items: ["No credit card required", "Instant access with your existing account"],
      },
      { t: "action", button: "Try Seed-Audio 1.0 →", link: "Listen to the voice samples" },
      {
        t: "grid",
        title: "Built for the teams who run ads:",
        items: [
          { icon: "📱", label: "Social ads", text: "A hook read out loud in the first two seconds" },
          { icon: "🛍️", label: "E-commerce", text: "Product demo narration for every SKU" },
          { icon: "🌍", label: "Localisation", text: "One script, one voice, many markets" },
          { icon: "🏢", label: "Agencies", text: "Scratch voiceover on the first client draft" },
        ],
      },
      { t: "p", text: "Open a Canvas or just tell the agent what to say — your first voiceover is one line away." },
      { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
      { t: "hr" },
      { t: "p", text: "Any questions? Just write to info@presslogic.com — we read every message." },
    ],
  },
];

export const CATEGORIES: Category[] = ["成员与权限", "额度与用量", "自动充值", "客服与支持", "产品与发布"];
