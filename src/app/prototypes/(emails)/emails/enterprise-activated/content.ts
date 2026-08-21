import type { Template } from "../types";

/**
 * 企业开户激活邮件 —— 整条 sales 开户流程里客户唯一收到的东西。
 *
 * 所以它要一次说清三件事:你现在能进去了、你买到的是什么、第一件该做的事是什么。
 * 「第一件该做的事」尤其重要:企业单签完往往搁两周没人用,续约时就没有消耗数据可谈。
 */
export const TEMPLATE: Template = {
  id: "enterprise-activated",
  name: "企业开户已激活",
  category: "企业与合同",
  tone: "normal",
  trigger: "Admin Portal → 待收款看板 → 确认收款(财务与 sales 双签通过)后立即发出",
  to: "组织 Owner(合同上的负责人);账单联系人抄送",
  subject: "{{org_name}} is ready — sign in to Buzz",
  heading: "{{org_name}} is ready",
  blocks: [
    { t: "p", text: "Your Enterprise contract is active. You can sign in now — the workspace is set up and your monthly credit pool has started." },
    {
      t: "stat",
      rows: [
        { k: "Plan", v: "Enterprise · {{tier_name}}" },
        { k: "Creator seats", v: "{{seats}}" },
        { k: "Monthly pool", v: "{{pool_credits}} credits" },
        { k: "Term", v: "{{effective_date}} – {{expiry_date}}" },
        { k: "Your account", v: "{{owner_email}}" },
      ],
    },
    { t: "cta", text: "Sign in to Buzz" },
    {
      t: "box",
      title: "First three things to do",
      items: [
        "Invite your team — seats are already paid for, so anyone you add can start immediately",
        "Set per-person monthly allocations so one project can't drain the shared pool",
        "Connect SSO if your IT team requires it — Security & data in team settings",
      ],
    },
    { t: "note", text: "Credits are issued to the organisation pool, not to individual seats. Unallocated credits stay available to everyone. {{sales_name}} is your account contact — reply to this email to reach them." },
  ],
};
