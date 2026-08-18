import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
