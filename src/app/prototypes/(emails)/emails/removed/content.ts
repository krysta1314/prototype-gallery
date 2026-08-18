import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
