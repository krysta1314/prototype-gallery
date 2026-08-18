import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
