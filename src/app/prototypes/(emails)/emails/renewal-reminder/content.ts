import type { Template } from "../types";

/**
 * 到期提醒 —— 一封模板管三个节点(提前 60 / 30 / 7 天),靠 days_left 变量分叉。
 *
 * 不做成三封独立邮件,是因为三封的内容会各自漂移,最后口径不一致。
 * 语气随剩余天数收紧,但事实部分(到期日、不续约会发生什么)三次都一样。
 *
 * 收件人必须包含账单联系人:决定续不续的人经常不是每天在用的人。
 */
export const TEMPLATE: Template = {
  id: "renewal-reminder",
  name: "合同到期提醒",
  category: "企业与合同",
  tone: "warn",
  trigger: "合同到期前 60 / 30 / 7 天各发一次;自动续约已开的组织只发 60 天那一封作为通知",
  to: "组织 Owner + 账单联系人(决定续约的人往往不是天天在用的人)",
  subject: "{{org_name}}'s contract ends in {{renewal_days_left}} days",
  heading: "{{renewal_days_left}} days left on {{org_name}}'s contract",
  blocks: [
    { t: "p", text: "Your Enterprise term ends on {{expiry_date}}. Here is where the account stands so you have the numbers before deciding." },
    {
      t: "stat",
      rows: [
        { k: "Term ends", v: "{{expiry_date}}" },
        { k: "Auto-renewal", v: "{{auto_renew_state}}" },
        { k: "Credits used this term", v: "{{term_used}} of {{term_total}}" },
        { k: "Active members", v: "{{active_members}} of {{seats}} seats" },
      ],
    },
    {
      t: "callout",
      tone: "warn",
      text: "Auto-renewal is off, so the contract will not renew on its own. If nothing changes before {{expiry_date}}, {{org_name}} moves to Free.",
    },
    {
      t: "bullets",
      items: [
        "Everything your team created stays, and stays viewable and downloadable",
        "Members keep their accounts and their seats are not deleted",
        "The monthly credit pool stops, so nobody can start new work",
      ],
    },
    { t: "action", button: "Talk to {{sales_name}}", link: "Review this term's usage report" },
    { t: "note", text: "Already renewed or renewing? Ignore this — you'll get a confirmation once the new term is signed." },
  ],
};
