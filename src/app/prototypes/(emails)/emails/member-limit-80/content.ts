import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
