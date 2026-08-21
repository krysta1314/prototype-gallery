"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { formatNumber, ROLE_LABEL, type Role } from "./data";
import { Dropdown } from "./dropdown";
import { useTeam } from "./team-context";
import { useDialog } from "./use-dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteModal({ onClose, onAddSeats }: { onClose: () => void; onAddSeats: () => void }) {
  const { team, role, seatsUsed, seatsTotal, inviteMembers, inviteFinance, isPool, seatCredits, isExpired } = useTeam();
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
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog({ ref: panelRef, onClose });

  // Enterprise 走共享池,额度不挂席位,所以没有「接手席位带额度」这回事
  const vacant = isPool ? [] : team.vacantSeats;
  const takingOver = seatChoice !== "new" ? vacant.find((item) => item.id === seatChoice) : undefined;
  /** Billing Admin 是 billing-only,不占席位 —— 所以选它时席位一律不增 */
  const isFinanceInvite = inviteRole === "finance";
  /* 接手空席位不占新席位,所以第一个人不计入席位增量 */
  const newSeats = isFinanceInvite ? 0 : takingOver ? Math.max(0, emails.length - 1) : emails.length;
  const projected = seatsUsed + newSeats;
  const overflow = projected > seatsTotal;

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

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite members">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[520px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
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
          <label className="mt-4 block">
            <span className="text-[13px] font-semibold text-[#3b3442]">Seat</span>
            <select
              value={seatChoice}
              onChange={(event) => setSeatChoice(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a]"
            >
              <option value="new">New seat — a fresh {formatNumber(seatCredits)} credits</option>
              {vacant.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fromName}&apos;s old seat — {formatNumber(item.creditsLeft)} credits left this cycle
                  {item.topUpLeft > 0 ? ` + ${formatNumber(item.topUpLeft)} top-up` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11.5px] leading-[1.5] text-[#6d6675]">
              {takingOver
                ? `${takingOver.fromName} left on ${takingOver.freedAt} without spending everything. Taking over the seat carries those credits across and doesn't use up another seat.`
                : "Credits follow the seat on this plan. A seat someone left still holds what they didn't spend — pick it to hand those credits to the new person."}
            </span>
          </label>
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
              Not enough seats — {projected} of {seatsTotal} would be used.
            </p>
            {role === "owner" ? (
              <button type="button" onClick={() => { onAddSeats(); onClose(); }} className="text-[12px] font-bold text-[#ee6545] underline underline-offset-2">
                Add seats
              </button>
            ) : (
              <span className="text-[12px] text-[#6d6675]">Ask your owner to add seats.</span>
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
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Invite user
          </button>
        </div>
      </div>
    </div>
  );
}
