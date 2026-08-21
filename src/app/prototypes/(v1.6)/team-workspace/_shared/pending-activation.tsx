"use client";

import { Check, Hourglass, Mail } from "lucide-react";
import { useTeam } from "./team-context";
import { DemoBar } from "./demo-bar";

/**
 * 已签约、待付款的等待页 —— enterprise 开户流程里客户侧唯一的可见状态。
 *
 * 为什么要有它:后台那边「确认收款」之前,Owner 其实已经拿到了账号。
 * 之前他登进来会看到一个空工作区,什么都点不动,也没有任何解释 ——
 * 于是他去问 sales,sales 去问财务,一单能扯两天。这一页就是把那两天省掉。
 *
 * 三件事必须说清:现在卡在哪一步、大概多久、卡住了该找谁。
 * 「该找谁」给的是账户对接人而不是通用客服 —— 通用客服答不了「你们的款到了没」。
 *
 * 工作区门禁 —— 未开通就整页换成等待页。
 *
 * (WorkspaceGate)做成一个组件而不是在每个页面各写一遍判断:漏一个页面就等于漏一个后门。
 * 之前只在 Home 挂了,直接访问 Canvas / Assets / Agent 就能绕过去。
 */
export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { awaitingActivation } = useTeam();
  return awaitingActivation ? <PendingActivation /> : <>{children}</>;
}

export function PendingActivation() {
  const { team, plan } = useTeam();

  const steps = [
    { done: true, text: "Contract signed" },
    { done: true, text: "Invoice issued to your finance team" },
    { done: false, text: "Payment confirmed by both our finance and sales teams", now: true },
    { done: false, text: `Your ${plan.name} workspace opens and credits start` },
  ];

  return (
    <div className="min-h-screen bg-[#faf9fb]">
      <DemoBar page="home" sticky={false} />

      <div className="mx-auto max-w-[620px] px-5 py-16 sm:py-24">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fff3ec]">
          <Hourglass className="size-6 text-[#b06a1c]" strokeWidth={2.5} />
        </span>

        <h1 className="mt-5 text-[26px] font-bold leading-[1.2] tracking-[-0.02em] text-[#28222e]">
          {team.name} is almost ready
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-[14px] leading-[1.65] text-[#7b7480]">
          Your account exists and you&apos;re signed in — the workspace just isn&apos;t open yet. We start it the moment
          your payment is confirmed, usually within one business day of the transfer landing.
        </p>

        <ol className="mt-7 space-y-3.5">
          {steps.map((step) => (
            <li key={step.text} className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? "bg-[#12734f] text-white"
                    : step.now
                      ? "bg-[#fff3ec] text-[#b06a1c] ring-2 ring-[#f5ddc0]"
                      : "bg-[#f1eff3] text-[#7b7480]"
                }`}
              >
                {step.done ? <Check className="size-3" strokeWidth={3} /> : ""}
              </span>
              <span
                className={`text-[13.5px] leading-[1.5] ${
                  step.done ? "text-[#3b3442]" : step.now ? "font-bold text-[#8f5514]" : "text-[#6d6675]"
                }`}
              >
                {step.text}
                {step.now && <span className="ml-2 font-semibold text-[#b06a1c]">← we&apos;re here</span>}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-[#ececf1] bg-white p-5">
          <p className="text-[13.5px] font-bold text-[#28222e]">Need it sooner?</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7b7480]">
            If your finance team has already paid, send us the remittance advice and we&apos;ll open the workspace
            without waiting for the bank to clear it on our side.
          </p>
          <a
            href="mailto:sales@buzz.video"
            className="mt-3.5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            <Mail className="size-4" />
            Email your account contact
          </a>
        </div>

        <p className="mt-6 text-[12.5px] leading-[1.6] text-[#6d6675]">
          Nothing is lost while you wait — your seats, your pool and your term all start on the activation date, not the
          signing date.
        </p>
      </div>
    </div>
  );
}
