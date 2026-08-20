"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { formatNumber, ROLE_LABEL, type Role } from "./data";
import { Dropdown } from "./dropdown";
import { useTeam } from "./team-context";
import { useDialog } from "./use-dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteModal({ onClose, onAddSeats }: { onClose: () => void; onAddSeats: () => void }) {
  const { team, role, seatsUsed, seatsTotal, inviteMembers, isPool, seatCredits } = useTeam();
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
  /* 接手空席位不占新席位,所以第一个人不计入席位增量 */
  const newSeats = takingOver ? Math.max(0, emails.length - 1) : emails.length;
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

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite members">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[520px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Invite team member</h2>
            <p className="mt-1 text-[13px] text-[#8a8490]">Enter the email of the user you want to invite to your team.</p>
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
          {error && <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{error}</p>}
        </label>

        <div className="mt-4">
          <span className="text-[13px] font-semibold text-[#3b3442]">Role</span>
          <div className="mt-2">
            <Dropdown
              value={inviteRole}
              onChange={(value) => setInviteRole(value as Role)}
              ariaLabel="Role"
              options={[
                { value: "member", label: ROLE_LABEL.member },
                { value: "admin", label: ROLE_LABEL.admin },
              ]}
            />
          </div>
        </div>

        {/* 有空席位时才出现 —— 平时不占版面 */}
        {vacant.length > 0 && (
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
            <span className="mt-1.5 block text-[11.5px] leading-[1.5] text-[#8a8490]">
              {takingOver
                ? `${takingOver.fromName} left on ${takingOver.freedAt} without spending everything. Taking over the seat carries those credits across and doesn't use up another seat.`
                : "Credits follow the seat on this plan. A seat someone left still holds what they didn't spend — pick it to hand those credits to the new person."}
            </span>
          </label>
        )}

        {/* 席位不够时才提示,平时不占版面 */}
        {overflow && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#fef3f2] px-3.5 py-3">
            <p className="text-[12px] font-semibold text-[#c9432a]">
              Not enough seats — {projected} of {seatsTotal} would be used.
            </p>
            {role === "owner" ? (
              <button type="button" onClick={() => { onAddSeats(); onClose(); }} className="text-[12px] font-bold text-[#ee6545] underline underline-offset-2">
                Add seats
              </button>
            ) : (
              <span className="text-[12px] text-[#8a8490]">Ask your owner to add seats.</span>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={emails.length === 0 || overflow}
            onClick={() => {
              inviteMembers(emails, inviteRole, takingOver?.id);
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
