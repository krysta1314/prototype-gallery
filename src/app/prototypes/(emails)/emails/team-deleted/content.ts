import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
