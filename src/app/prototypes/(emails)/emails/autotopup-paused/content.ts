import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "autotopup-paused",
  name: "自动充值已暂停",
  category: "自动充值",
  tone: "alert",
  trigger: "连续三次扣款失败后,自动充值被置为 Paused",
  to: "Owner + Admin + Finance",
  subject: "Auto top-up paused for {{team_name}}",
  heading: "Auto top-up is paused",
  blocks: [
    { t: "p", text: "Three attempts to charge {{card_brand}} {{card_last4}} failed ({{decline_reason}}), so we've paused auto top-up for {{team_name}}." },
    { t: "p", text: "Credits won't top up on their own until you update the card and switch it back on." },
    { t: "cta", text: "Update payment method" },
  ],
};
