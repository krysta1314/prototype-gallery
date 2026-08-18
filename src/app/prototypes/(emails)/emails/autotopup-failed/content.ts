import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "autotopup-failed",
  name: "自动充值扣款失败",
  category: "自动充值",
  tone: "warn",
  trigger: "自动充值触发但扣款被拒,每次失败发一封,间隔 24 小时最多重试三次",
  to: "Owner + Admin + Finance",
  subject: "Auto top-up failed for {{team_name}}",
  heading: "We couldn't charge your card",
  blocks: [
    { t: "p", text: "The auto top-up for {{team_name}} didn't go through." },
    {
      t: "stat",
      rows: [
        { k: "Amount", v: "{{amount}} credits" },
        { k: "Card", v: "{{card_brand}} {{card_last4}}" },
        { k: "Reason", v: "{{decline_reason}}" },
        { k: "Attempt", v: "{{attempt}} of 3" },
      ],
    },
    { t: "p", text: "We'll try again in 24 hours." },
    { t: "cta", text: "Update payment method" },
  ],
};
