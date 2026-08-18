import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "pool-80",
  name: "团队积分用到 80%",
  category: "额度与用量",
  tone: "warn",
  trigger: "团队积分池累计消耗达到本周期总量的 80%,每周期只发一次",
  to: "Owner + Admin + Finance",
  subject: "{{team_name}} has {{remaining}} credits left",
  heading: "{{remaining}} credits left this cycle",
  blocks: [
    { t: "p", text: "{{team_name}} has used {{used}} of {{total}} credits. Top up if the team needs more before they reset." },
    {
      t: "stat",
      rows: [
        { k: "Used", v: "{{used}} of {{total}}" },
        { k: "Left", v: "{{remaining}}" },
        { k: "Resets", v: "{{reset_date}}" },
      ],
    },
    { t: "cta", text: "Buy credits" },
    { t: "note", text: "Sent to owners, admins and billing contacts." },
  ],
};
