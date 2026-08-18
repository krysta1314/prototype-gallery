import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
