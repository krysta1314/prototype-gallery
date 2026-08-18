import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "autotopup-cap",
  name: "自动充值达月度上限",
  category: "自动充值",
  tone: "warn",
  trigger: "本月自动充值累计金额达到设定的月度封顶(不是扣款失败,不进重试)",
  to: "Owner + Admin + Finance",
  subject: "{{team_name}} hit its auto top-up cap",
  heading: "Auto top-up is done for this month",
  blocks: [
    { t: "p", text: "Auto top-up has added {{spent}} credits to {{team_name}} this month, which is the {{cap}} cap you set. It won't run again until {{reset_date}}." },
    { t: "p", text: "Your card is fine. You can still buy credits manually, or raise the cap." },
    { t: "cta", text: "Review auto top-up" },
  ],
};
