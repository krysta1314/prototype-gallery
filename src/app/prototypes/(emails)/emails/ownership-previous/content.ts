import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
