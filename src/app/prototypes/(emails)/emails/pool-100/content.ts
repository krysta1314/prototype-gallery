import type { Template } from "../types";

export const TEMPLATE: Template = {
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
};
