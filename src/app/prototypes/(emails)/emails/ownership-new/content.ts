import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
