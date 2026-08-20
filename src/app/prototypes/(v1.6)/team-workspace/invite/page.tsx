"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { initials, MEMBERS_BY_TEAM, type Member } from "../_shared/data";
import { TeamProvider, useTeam } from "../_shared/team-context";
import { TeamAvatar } from "../_shared/identity-menu";
import { TeamOverlays } from "../_shared/team-overlays";
import { DemoBar } from "../_shared/demo-bar";

const ICONS = { logo: "/prototypes/starter-guide/icons/buzz-video-logo.svg" };
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const bricolageExtraBold = localFont({
  src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});

type InviteState = "signed-in" | "signed-out" | "seats-full" | "expired" | "link";

const STATES: { value: InviteState; label: string }[] = [
  { value: "signed-in", label: "已登录" },
  { value: "signed-out", label: "未注册" },
  { value: "seats-full", label: "席位已满" },
  { value: "expired", label: "链接已过期" },
  { value: "link", label: "通过邀请链接" },
];

/**
 * 落地页状态可以从 URL 带进来,评审清单靠它一键跳到指定场景:
 *   ?invite=seats-full | signed-out | signed-in | expired | link
 * 另外 ?seats=full(整站通用的席位演示参数)也直接落到「席位已满」,
 * 免得同一件事要在两个地方各切一次。
 */
function initialInviteState(): InviteState {
  if (typeof window === "undefined") return "signed-in";
  const q = new URLSearchParams(window.location.search);
  const explicit = q.get("invite");
  if (
    explicit === "seats-full" ||
    explicit === "signed-out" ||
    explicit === "signed-in" ||
    explicit === "expired" ||
    explicit === "link"
  )
    return explicit;
  if (q.get("seats") === "full") return "seats-full";
  return "signed-in";
}

function InviteCard() {
  const router = useRouter();
  const { teams, showToast, seatsUsed, seatsTotal } = useTeam();
  const [state, setState] = useState<InviteState>(initialInviteState);
  const [accepted, setAccepted] = useState(false);

  const team = teams.find((t) => t.id === "t-growth") ?? teams[0]!;
  const growthMembers: Member[] = MEMBERS_BY_TEAM["t-growth"] ?? [];
  const inviter = growthMembers[0]!;
  const activeMembers = growthMembers.filter((m) => m.status === "active");

  return (
    <div className="min-h-screen bg-[#fcfbfd] text-[#24202a]" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar page="invite" />

      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 text-[12px] text-[#7b7480]">
        <span className="font-bold text-[#3b3442]">邀请状态</span>
        <div className="flex items-center gap-1 rounded-lg bg-[#f1eff3] p-0.5">
          {STATES.map((item) => {
            const active = state === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setState(item.value);
                  setAccepted(false);
                }}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${active ? "bg-white text-[#28222e] shadow-sm" : "text-[#8a8490] hover:text-[#56505c]"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="grid place-items-center px-4 pb-20 pt-[8vh]">
        <div className="w-full max-w-[460px]">
          <div className={`${bricolageExtraBold.className} mb-8 flex items-center justify-center gap-2.5 text-[20px] tracking-[-0.04em] text-[#211b29]`}>
            <Image src={ICONS.logo} alt="Buzz" width={34} height={34} className="size-[34px]" />
            Buzz
          </div>

          <div className="rounded-[24px] border border-[#ececf1] bg-white p-8 text-center shadow-[0_18px_44px_rgba(26,26,46,0.07)]">
            {accepted ? (
              <>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e8f7f3] text-[#0d8a7b]">
                  <Check className="size-7" />
                </span>
                <h1 className="mt-5 text-[20px] font-bold tracking-[-0.025em] text-[#28222e]">You&apos;re in</h1>
                <p className="mt-2 text-[14px] leading-relaxed text-[#7b7480]">
                  You joined {team.name} as a Member. Taking you to your workspace…
                </p>
              </>

            ) : (
              <>
                <div className="flex justify-center">
                  <TeamAvatar team={team} size={64} />
                </div>
                <h1 className="mt-5 text-[20px] font-bold leading-snug tracking-[-0.025em] text-[#28222e]">
                  {state === "link" ? `Join ${team.name}` : `${inviter.name} invited you to join ${team.name}`}
                </h1>
                <p className="mt-2 text-[14px] text-[#7b7480]">as a Member</p>

                <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-[#faf9fb] px-4 py-3">
                  <span className="flex -space-x-2">
                    {activeMembers.slice(0, 5).map((member: Member) => (
                      <span
                        key={member.id}
                        className="grid size-8 place-items-center rounded-[9px] border-2 border-white text-[10px] font-bold text-white"
                        style={{ background: member.color }}
                      >
                        {initials(member.name)}
                      </span>
                    ))}
                  </span>
                  <span className="text-[13px] font-semibold text-[#56505c]">{activeMembers.length} members</span>
                </div>

                {/* 过期链接:邀请有效期 7 天,过期后不能接受。
                    成员表里 expired 状态不占席位,所以团队侧无需清理,
                    唯一的出路是让邀请人重发 —— 页面必须把这句说出来,
                    否则用户只会看到一个点不动的按钮。 */}
                {/* 链接邀请没有预置收件人,所以席位是在这一刻才校验 */}
                {state === "link" && (
                  <p className="mt-5 rounded-xl bg-[#faf9fb] px-4 py-3 text-left text-[13px] leading-[1.55] text-[#7b7480]">
                    You opened an invite link, so nobody pre-approved your address. Accepting takes one of the{" "}
                    {seatsTotal - seatsUsed} free seats — the team owner can see who joined this way in the activity log.
                  </p>
                )}

                {state === "expired" && (
                  <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#f0cf9e] bg-[#fffaf1] px-4 py-3 text-left text-[13px] leading-[1.55] text-[#8f5514]">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      This invitation expired. Invitations are valid for 7 days — ask {inviter.name} to send a new one.
                      The seat was never used, so nothing is taken up in {team.name}.
                    </span>
                  </p>
                )}

                {state === "seats-full" && (
                  <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-4 py-3 text-left text-[13px] leading-snug text-[#b23a1c]">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    This team has no available seats. Ask the owner to add more.
                  </p>
                )}

                {state === "signed-out" && (
                  <p className="mt-5 rounded-xl bg-[#faf9fb] px-4 py-3 text-[13px] leading-snug text-[#7b7480]">
                    You don&apos;t have a BuzzVideo account yet. Create one with{" "}
                    <span className="font-semibold text-[#3b3442]">priya.singh@presslogic.com</span>{" "}
                    and you&apos;ll join the team right after signing up.
                  </p>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    disabled={state === "seats-full" || state === "expired"}
                    onClick={() => {
                      if (state === "signed-out") {
                        // 演示说明文案,不属于真实产品 UI
                        showToast("演示:此处弹出登录弹窗,登录成功后立即带回首页");
                        window.setTimeout(() => router.push("/prototypes/team-workspace/home"), 1600);
                        return;
                      }
                      setAccepted(true);
                      window.setTimeout(() => router.push("/prototypes/team-workspace/home"), 1400);
                    }}
                    className="h-12 w-full rounded-xl bg-[#24202a] text-[14px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {state === "expired"
                      ? "Invitation expired"
                      : state === "signed-out"
                        ? "Sign up to accept"
                        : "Accept invitation"}
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-[12px] text-[#9a94a0]">
            {state === "link"
              ? "Invite links stay valid until the owner rotates them."
              : state === "expired"
                ? "This invitation was sent to priya.singh@presslogic.com and expired on Jul 27, 2026."
                : "This invitation was sent to priya.singh@presslogic.com and expires in 7 days."}
          </p>
        </div>
      </main>

      <TeamOverlays />
    </div>
  );
}

export default function TeamWorkspaceInvitePage() {
  return (
    <TeamProvider>
      <InviteCard />
    </TeamProvider>
  );
}
