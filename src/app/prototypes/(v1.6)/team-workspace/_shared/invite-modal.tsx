"use client";

import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { formatNumber, ROLE_LABEL, type Role } from "./data";
import { Dropdown } from "./dropdown";
import { useTeam } from "./team-context";
import { useDialog } from "./use-dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 邀请链接的有效期 —— 与邀请邮件里写的那句必须是同一个数 */
const INVITE_EXPIRY_DAYS = 7;

/** 一次邀请的结果,发完之后照着它渲染回执 */
type SentResult = {
  emails: string[];
  role: Role;
  /** 接手了谁的空席位(选了才有)—— 回执里要说清额度去了哪 */
  tookOverFrom?: string;
  tookOverCredits?: number;
};

export function InviteModal({ onClose, onAddSeats }: { onClose: () => void; onAddSeats: () => void }) {
  const { team, role, plan, seatRoom, seatsUsed, seatsTotal, inviteMembers, inviteFinance, isPool, seatCredits, isExpired } = useTeam();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [note, setNote] = useState("");
  /**
   * 接手哪个空席位。"new" = 开新席位、拿全新额度。
   * 空席位是成员被移除后留下的壳,身上还挂着当月没花完的额度 ——
   * per-seat 的 credits 跟着席位走,所以这笔钱本来就该给接手的人。
   */
  const [seatChoice, setSeatChoice] = useState("new");
  /**
   * 发出去之后的回执。邀请是往外发邮件的动作 —— 关掉弹窗就当没事发生,
   * 用户没法确认到底发出去没有、发给了谁。所以发完停在这一屏,把结果说清。
   * null = 还在填表。
   */
  const [sent, setSent] = useState<SentResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog({ ref: panelRef, onClose });

  // Enterprise 走共享池,额度不挂席位,所以没有「接手席位带额度」这回事
  const vacant = isPool ? [] : team.vacantSeats;
  /**
   * 还能不能开「新席位」——「新」的意思是拿一份**本周期还没发过**的额度。
   *
   * 口径:付了几个席位的钱,这个月就发几份额度,一份不多。
   *   还没发过的份数 = 付费席位数 − 在座人数 − 空席位数
   *
   * 空席位要减掉,因为它那份已经发过了(前任花掉一部分,剩下的还挂在席位上)。
   * 不减的话就有一条白拿额度的路:移除一个人 → 重新邀请他 → 选「新席位」→
   * 席位数没变、没多花一分钱,却又发了一份完整额度,想刷几次刷几次。
   *
   * 反过来,「买了 9 席但一直只坐 7 人」时那 2 份额度确实一分没花、钱也付了,
   * 新人坐上去拿满额是正当的 —— 所以判断依据是「额度发没发过」,
   * 而不是「有没有空席位」。用后者一刀切会把这种正常情况也砍掉。
   */
  const freshSeatsLeft = Math.max(0, seatsTotal - seatsUsed - vacant.length);
  const canOpenFreshSeat = isPool || freshSeatsLeft > 0;
  const effectiveSeatChoice = !canOpenFreshSeat && seatChoice === "new" ? vacant[0]?.id ?? "new" : seatChoice;
  const takingOver =
    effectiveSeatChoice !== "new" ? vacant.find((item) => item.id === effectiveSeatChoice) : undefined;
  /** Billing Admin 是 billing-only,不占席位 —— 所以选它时席位一律不增 */
  const isFinanceInvite = inviteRole === "finance";
  /* 接手空席位不占新席位,所以第一个人不计入席位增量 */
  const newSeats = isFinanceInvite ? 0 : takingOver ? Math.max(0, emails.length - 1) : emails.length;
  const projected = seatsUsed + newSeats;
  const overflow = projected > seatsTotal;
  /*
   * 席位不够有两种,出口完全不同,不能都写「Add seats」:
   *   还能加(seatRoom > 0)     → 掏钱加席位就解决了
   *   已经撞到套餐上限(= 0)     → 加不了,只能升档(Team)或谈 Enterprise(Scale)
   * 之前一律写 Add seats,Owner 点下去只会收到一个「加不了」的 toast ——
   * 按钮承诺了一件做不到的事,这是最伤人的一种死路。
   */
  const atPlanCap = seatRoom <= 0;
  const capExit =
    plan.beyondMax === "upgrade"
      ? { label: "Upgrade to Scale", ask: "Ask your owner to upgrade the plan." }
      : { label: "Contact sales", ask: "Ask your owner to contact sales." };

  const commitDraft = () => {
    const value = draft.trim().replace(/,$/, "");
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setError(`"${value}" isn't a valid email address.`);
      return;
    }
    if (emails.includes(value)) {
      setError("That address is already on the list.");
      return;
    }
    setEmails((prev) => [...prev, value]);
    setDraft("");
    setError(null);
  };

  /**
   * 批量粘贴 —— 从表格、邮件、Slack 里拷来的一串地址,不管用逗号、分号、空格还是换行分隔,
   * 一次全变成 chip。无效的和重复的不静默丢掉,统计出来告诉用户,否则「我粘了 12 个只进了 9 个」没法排查。
   */
  const commitBulk = (text: string) => {
    const parts = text
      .split(/[\s,;]+/)
      .map((part) => part.trim().replace(/^[<(]|[>)]$/g, ""))
      .filter(Boolean);
    if (!parts.length) return false;

    const accepted: string[] = [];
    let invalid = 0;
    let duplicate = 0;
    for (const part of parts) {
      if (!EMAIL_RE.test(part)) {
        invalid += 1;
        continue;
      }
      if (emails.includes(part) || accepted.includes(part)) {
        duplicate += 1;
        continue;
      }
      accepted.push(part);
    }

    if (accepted.length) setEmails((prev) => [...prev, ...accepted]);
    setDraft("");

    const notes: string[] = [];
    if (invalid) notes.push(`${invalid} skipped (not an email)`);
    if (duplicate) notes.push(`${duplicate} already on the list`);
    setError(notes.length ? `Added ${accepted.length} · ${notes.join(" · ")}` : null);
    return true;
  };

  /**
   * 回执屏 —— 不另开一个弹窗,就地换掉内容。
   * 成员表在弹窗背后会立刻多出一行 Invited,所以不需要 Google 那句
   * 「更改可能需要一些时间才能在所有视图中显示」的免责;这里要说的是
   * 另外三件事:发给了谁、链接多久过期、席位/额度被动了什么。
   */
  const successBody = sent ? (
    <div>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#e7f4ed]">
          <Check className="size-[22px] text-[#12734f]" strokeWidth={3} />
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
          <X className="size-[18px]" />
        </button>
      </div>

      <h2 className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">
        {sent.emails.length === 1 ? "Invite sent" : `${sent.emails.length} invites sent`}
      </h2>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[#6d6675]">
        {sent.emails.length === 1 ? "We emailed them" : "We emailed everyone"} a link to join as{" "}
        <span className="font-semibold text-[#3b3442]">{ROLE_LABEL[sent.role]}</span>. It expires in {INVITE_EXPIRY_DAYS} days
        — until they accept, they show as <span className="font-semibold text-[#3b3442]">Invited</span>{" "}
        {/* Billing Admin 不占席位、不进成员表,他只会出现在账单页的联系人里 */}
        {sent.role === "finance" ? "under Billing contacts." : "in the member list."}
      </p>

      <ul className="mt-4 divide-y divide-[#f1eff3] rounded-2xl border border-[#ececf1]">
        {sent.emails.map((email) => (
          <li key={email} className="flex items-center gap-2.5 px-4 py-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f1eff3] text-[10px] font-bold uppercase text-[#6d6675]">
              {email[0]}
            </span>
            <span className="truncate text-[13px] text-[#3b3442]">{email}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3.5 text-[12.5px] leading-[1.6] text-[#6d6675]">
        {sent.role === "finance" ? (
          "Billing Admin doesn't take a seat — they only get the billing pages, not the workspace."
        ) : sent.tookOverFrom ? (
          <>
            {/* 一个人时上面那行已经写了地址,再念一遍就是复读;多个人才需要点名是谁接手 */}
            {sent.emails.length === 1 ? "They take" : `${sent.emails[0]} takes`} over {sent.tookOverFrom}
            &apos;s seat, along with the {formatNumber(sent.tookOverCredits ?? 0)}{" "}
            credits left on it — so this didn&apos;t use up another seat.
          </>
        ) : isPool ? (
          <>
            Seats now {seatsUsed} of {seatsTotal}. They draw from the shared pool once they accept.
          </>
        ) : (
          <>
            Seats now {seatsUsed} of {seatsTotal}. Each new seat gets {formatNumber(seatCredits)}{" "}
            credits when it&apos;s taken up.
          </>
        )}
      </p>

      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={() => {
            // 再邀一批 —— 回到空表,而不是让人关掉再点一次入口
            setSent(null);
            setEmails([]);
            setDraft("");
            setError(null);
            setNote("");
            setSeatChoice("new");
          }}
          className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]"
        >
          Invite more
        </button>
        <button type="button" onClick={onClose} className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]">
          Done
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite members">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[520px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
        {successBody ?? (
          <>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Invite team member</h2>
            <p className="mt-1 text-[13px] text-[#6d6675]">Enter or paste the emails of the people you want on this team.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-[13px] font-semibold text-[#3b3442]">Email</span>
          <div className={`mt-2 flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2.5 py-2 transition focus-within:border-[#ff5e1a] ${error ? "border-[#e0a08e]" : "border-[#ececf1]"}`}>
            {emails.map((email) => (
              <span key={email} className="flex items-center gap-1 rounded-lg bg-[#f2f0f4] py-1 pl-2.5 pr-1 text-[12px] font-semibold text-[#3b3442]">
                {email}
                <button type="button" onClick={() => setEmails((prev) => prev.filter((e) => e !== email))} aria-label={`Remove ${email}`} className="grid size-4 place-items-center rounded text-[#8a8490] hover:text-[#28222e]">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              autoFocus
              value={draft}
              onPaste={(event) => {
                const text = event.clipboardData.getData("text");
                // 只有粘进来的是「多个地址」时才接管,单个地址仍走原来的逐个输入
                if (/[\s,;]/.test(text.trim()) && commitBulk(text)) event.preventDefault();
              }}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "," || event.key === " ") {
                  event.preventDefault();
                  commitDraft();
                }
                if (event.key === "Backspace" && !draft && emails.length) setEmails((prev) => prev.slice(0, -1));
              }}
              onBlur={commitDraft}
              placeholder={emails.length ? "" : "name@company.com"}
              className="min-w-[160px] flex-1 bg-transparent py-1 text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
            />
          </div>
          {error ? (
            <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{error}</p>
          ) : (
            <p className="mt-1.5 text-[12px] text-[#6d6675]">
              Paste a whole list at once — commas, semicolons, spaces or line breaks all work.
            </p>
          )}
        </label>

        <div className="mt-4">
          <span className="text-[13px] font-semibold text-[#3b3442]">Role</span>
          <div className="mt-2">
            <Dropdown
              value={inviteRole}
              onChange={(value) => setInviteRole(value as Role)}
              ariaLabel="Role"
              /*
               * 邀请时能给的角色 = 我们定义的四档去掉 Owner —— Owner 只有一个,
               * 靠 General 页的「转让所有权」交接,不能靠邀请凭空多出一个。
               * Billing Admin 只有 Owner 能授予(Admin 自己没有账单权限,不能借邀请提权)。
               */
              options={[
                { value: "member", label: ROLE_LABEL.member },
                { value: "admin", label: ROLE_LABEL.admin },
                ...(role === "owner" ? [{ value: "finance", label: ROLE_LABEL.finance }] : []),
              ]}
            />
          </div>
          {isFinanceInvite && (
            <p className="mt-1.5 text-[11.5px] leading-[1.5] text-[#6d6675]">
              Billing admins only see plans, invoices and top-ups — no seat, no credits, no product access.
            </p>
          )}
        </div>

        {/* 有空席位时才出现 —— 平时不占版面;Billing Admin 不占席位,所以这块也不出现 */}
        {vacant.length > 0 && !isFinanceInvite && (
          <div className="mt-4">
            {/* 与 Role 同构:div + span 标签 + mt-2 包住控件。自定义下拉不是原生控件,
                套在 <label> 里点标签也聚不了焦,反而误导 */}
            <span className="text-[13px] font-semibold text-[#3b3442]">Seat</span>
            {/*
              用共用的 Dropdown 而不是原生 select —— 同一个弹窗里 Role 已经是 Dropdown,
              这里再放一个原生 select,展开后一个是我们画的面板、一个是系统深色面板,
              一眼就看得出是两套东西。而且原生 option 里塞不下「主标题 + 副说明」,
              只能把额度硬拼进一行文字。
            */}
            <div className="mt-2">
            <Dropdown
              value={effectiveSeatChoice}
              onChange={setSeatChoice}
              ariaLabel="Seat"
              options={[
                ...(canOpenFreshSeat
                  ? [
                      {
                        value: "new",
                        label: "New seat",
                        hint: `A fresh ${formatNumber(seatCredits)} credits`,
                      },
                    ]
                  : []),
                ...vacant.map((item) => ({
                  value: item.id,
                  label: `${item.fromName}'s old seat`,
                  hint:
                    `${formatNumber(item.creditsLeft)} credits left this cycle` +
                    (item.topUpLeft > 0 ? ` · +${formatNumber(item.topUpLeft)} top-up` : ""),
                })),
              ]}
            />
            </div>
            <span className="mt-1.5 block text-[11.5px] leading-[1.5] text-[#6d6675]">
              {/*
                * 没有新席位可选时必须说清楚为什么,否则用户只会看到「选项少了一个」。
                * 要说的是「这个月的额度已经全发过了」,不是「你的席位不够」——
                * 席位数没变,变的是额度已经发完了。
                */}
              {!canOpenFreshSeat
                ? `Every seat on this plan has already been issued its credits for this cycle, so there's no fresh allowance left to hand out. Take over a seat someone left — it still holds what they didn't spend. Next cycle every seat starts over.`
                : takingOver
                  ? `${takingOver.fromName} left on ${takingOver.freedAt} without spending everything. Taking over the seat carries those credits across and doesn't use up another seat.`
                  : "Credits follow the seat on this plan. A seat someone left still holds what they didn't spend — pick it to hand those credits to the new person."}
            </span>
          </div>
        )}

        {/* 席位不够时才提示,平时不占版面 */}
        {/*
          * 订阅终止后席位是冻结的 —— 拉人进来只会得到一个不能创作的席位,
          * 所以在这里就挡住,而不是让人邀请完才发现新同事点不动 Create。
          */}
        {isExpired && (
          <div className="mt-4 rounded-xl bg-[#fef3f2] px-3.5 py-3">
            <p className="text-[12px] font-semibold text-[#c9432a]">
              Seats are frozen while the subscription is ended.
            </p>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#6d6675]">
              A new member would get a seat with no credits. Start a plan again first, then invite.
            </p>
          </div>
        )}

        {overflow && !isExpired && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#fef3f2] px-3.5 py-3">
            <p className="text-[12px] font-semibold text-[#c9432a]">
              {atPlanCap
                ? `${plan.name} tops out at ${plan.seatsMax} seats.`
                : `Not enough seats — ${projected} of ${seatsTotal} would be used.`}
            </p>
            {role === "owner" ? (
              <button type="button" onClick={() => { onAddSeats(); onClose(); }} className="text-[12px] font-bold text-[#ee6545] underline underline-offset-2">
                {atPlanCap ? capExit.label : "Add seats"}
              </button>
            ) : (
              <span className="text-[12px] text-[#6d6675]">
                {atPlanCap ? capExit.ask : "Ask your owner to add seats."}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={emails.length === 0 || overflow || isExpired}
            onClick={() => {
              // Billing Admin 走独立入口:不占席位、不进成员的用量口径
              if (isFinanceInvite) emails.forEach((email) => inviteFinance(email));
              else inviteMembers(emails, inviteRole, takingOver?.id);
              setSent({
                emails,
                role: inviteRole,
                tookOverFrom: takingOver?.fromName,
                tookOverCredits: takingOver ? takingOver.creditsLeft + takingOver.topUpLeft : undefined,
              });
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Invite user
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
