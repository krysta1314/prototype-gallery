import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
