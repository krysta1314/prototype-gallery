"use client";

import { X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { PERIODS, agg, avColor, dstr, fmt, money, money0 } from "../_lib/agg";
import { DEPTS, ORG_DEFAULT_BUDGET, USD_PER_CREDIT } from "../_lib/seed";
import { useDialogA11y } from "../_lib/useDialogA11y";
import type { MemberWithUsage, Override, PeriodKey } from "../_lib/types";
import { Avatar, Btn, C, MONO, Note, inputCls, inputStyle } from "./ui";

/* ---------- 壳 ---------- */

function Shell({
  onClose,
  wide,
  title,
  subtitle,
  avatar,
  children,
  footer,
}: {
  onClose: () => void;
  wide?: boolean;
  title: string;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y({ ref, onClose });
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(15,23,42,.42)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-xl bg-white outline-none"
        style={{
          maxWidth: wide ? 620 : 480,
          boxShadow: "0 24px 60px -20px rgba(15,23,42,.45)",
        }}
      >
        <div
          className="flex items-start gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {avatar}
          <div className="min-w-0 flex-1">
            <h3 className="text-[14.5px] font-extrabold tracking-tight" style={{ color: C.ink }}>
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[11.5px] leading-[1.55]" style={{ color: C.ink3 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 transition-colors hover:bg-[#F1F5F9] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 focus-visible:outline-none"
            style={{ color: C.ink3 }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 px-4 py-4">{children}</div>
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{ borderTop: `1px solid ${C.line}`, background: "#FBFCFE" }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <b className="mb-1.5 block text-[11.5px] font-bold" style={{ color: C.ink }}>
        {label}
      </b>
      {children}
      {hint && (
        <em className="mt-1 block text-[10.5px] not-italic" style={{ color: C.ink3 }}>
          {hint}
        </em>
      )}
    </label>
  );
}

function Radio({
  checked,
  onChange,
  name,
  title,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  name: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <label
      className="flex cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        border: `1px solid ${checked ? C.brand : C.line}`,
        background: checked ? C.brandSoft : "#fff",
      }}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-[3px] accent-[#ff5e1a]"
      />
      <div className="min-w-0 flex-1">
        <b className="block text-[12px] leading-[1.5]" style={{ color: C.ink }}>
          {title}
        </b>
        {children && (
          <div className="mt-1 text-[11.5px] leading-[1.55]" style={{ color: C.ink2 }}>
            {children}
          </div>
        )}
      </div>
    </label>
  );
}

function Switch({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[11.5px]" style={{ color: C.ink2 }}>
      <input type="checkbox" defaultChecked={defaultChecked} className="accent-[#ff5e1a]" />
      <span>{label}</span>
    </label>
  );
}

const selectFull = `${inputCls} appearance-none`;

/* ---------- Adjust budget:唯一真能改数据的弹窗 ---------- */

export function BudgetModal({
  m,
  current,
  onClose,
  onSave,
}: {
  m: MemberWithUsage;
  current: Override;
  onClose: () => void;
  onSave: (o: Override) => void;
}) {
  const tm = agg(m, PERIODS.tm.from, PERIODS.tm.to);
  const [isOverride, setIsOverride] = useState(current.isOverride);
  const [raw, setRaw] = useState(String(current.budget));
  const parsed = Math.max(0, parseInt(raw.replace(/[^\d]/g, ""), 10) || 0);
  const nextBudget = isOverride ? parsed : ORG_DEFAULT_BUDGET;
  const invalid = isOverride && parsed <= 0;

  return (
    <Shell
      onClose={onClose}
      title={m.name}
      subtitle={`${m.dept} · ${m.role} · used ${fmt(tm.credits)} cr (${money(tm.usd)}) this month`}
      avatar={<Avatar name={m.name} seed={m.seed} size={38} colorOf={avColor} />}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Suspend access instead
          </Btn>
          <div className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={invalid}
            onClick={() => onSave({ budget: nextBudget, isOverride })}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Radio
          name="ov"
          checked={!isOverride}
          onChange={() => setIsOverride(false)}
          title={`Inherit organisation default — ${fmt(ORG_DEFAULT_BUDGET)} cr / month`}
        >
          Changes automatically when you change the org policy.
        </Radio>
        <Radio
          name="ov"
          checked={isOverride}
          onChange={() => setIsOverride(true)}
          title="Monthly limit override"
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={inputCls}
              style={{ ...inputStyle, maxWidth: 140, fontFamily: MONO }}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onFocus={() => setIsOverride(true)}
              aria-label="Monthly credit limit"
            />
            <span>
              credits / month ≈ {money0(nextBudget * USD_PER_CREDIT)} real cost
            </span>
          </div>
          {invalid && (
            <span className="mt-1 block text-[11px]" style={{ color: C.bad }}>
              Enter a number above 0.
            </span>
          )}
        </Radio>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="On exhaustion">
          <select className={selectFull} style={inputStyle} defaultValue="">
            <option value="">Block &amp; notify admin</option>
            <option>Allow 20% overage</option>
            <option>Alert only</option>
          </select>
        </Field>
        <Field label="Model access">
          <select className={selectFull} style={inputStyle} defaultValue="">
            <option value="">
              {nextBudget >= 20000 ? "All models incl. Video Pro" : "Std + Fast video, images, agent"}
            </option>
            <option>Fast video only</option>
          </select>
        </Field>
      </div>

      <Field
        label="Reason for override"
        hint="Logged with your name and timestamp — you'll want this when finance asks in October."
      >
        <input
          className={inputCls}
          style={inputStyle}
          placeholder="e.g. primary production seat for GirlStyle daily reels"
        />
      </Field>

      <Note amber>
        Changing the limit does not claw back credits already spent. To stop spend immediately use{" "}
        <b>Suspend access</b>.
      </Note>
    </Shell>
  );
}

/* ---------- 以下三个保持展示态,按钮只关闭弹窗 ---------- */

export function InviteModal({ onClose }: { onClose: () => void }) {
  return (
    <Shell
      wide
      onClose={onClose}
      title="Invite internal members"
      subtitle="Assign the budget now — the seat is created with a limit, not an open wallet."
      footer={
        <>
          <span className="text-[11px]" style={{ color: C.ink3 }}>
            2 invitations · 6,000 cr/mo committed ≈ {money0(6000 * USD_PER_CREDIT)}
          </span>
          <div className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={onClose}>
            Send invitations
          </Btn>
        </>
      }
    >
      <Field
        label="Colleague emails"
        hint="Paste a whole list, or upload CSV for the ~100-person rollout."
      >
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5"
          style={inputStyle}
        >
          {["parry.lam@presslogic.com", "wilson.tsang@presslogic.com"].map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[11px]"
              style={{ background: C.line2, color: C.ink2 }}
            >
              {e}
              <button type="button" aria-label={`Remove ${e}`} style={{ color: C.ink3 }}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            className="min-w-[160px] flex-1 bg-transparent py-1 text-[12px] outline-none"
            placeholder="Type or paste emails, comma separated…"
            aria-label="Add emails"
          />
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Department">
          <select className={selectFull} style={inputStyle} defaultValue={DEPTS[3]}>
            {DEPTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Role preset">
          <select className={selectFull} style={inputStyle} defaultValue="Marketer — 3,000 cr">
            <option>Producer / Editor — 8,000 cr</option>
            <option>Marketer — 3,000 cr</option>
            <option>Sales (demo only) — 1,500 cr</option>
            <option>Trial / new joiner — 500 cr</option>
            <option>Custom…</option>
          </select>
        </Field>
      </div>

      <InviteBudgetChoice />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Model access"
          hint={`Video Pro is 679 cr (${money(4.85)}) a render — gate it deliberately.`}
        >
          <select className={selectFull} style={inputStyle} defaultValue="">
            <option value="">Std + Fast video, images, agent</option>
            <option>All models including Video Pro</option>
            <option>Fast video only</option>
          </select>
        </Field>
        <Field label="Access expires">
          <select className={selectFull} style={inputStyle} defaultValue="">
            <option value="">Never</option>
            <option>In 30 days (pilot)</option>
            <option>In 90 days</option>
            <option>On a set date…</option>
          </select>
        </Field>
      </div>

      <Field label="Message in the invite email">
        <textarea
          className={inputCls}
          style={{ ...inputStyle, minHeight: 74, lineHeight: 1.55 }}
          defaultValue="Hi — you now have Buzz Video access for work projects. You have 3,000 credits a month (about 60 short videos). Please tag your generations with the project code so we can attribute cost. Docs: buzzvideo.ai/internal-guide"
        />
      </Field>

      <Switch defaultChecked label="Require project tag on every generation for these members" />

      <Note>
        Invites, seats and budgets are org-scoped, so the exact same screen serves an external
        enterprise client — you just pick a different organisation at the top.
      </Note>
    </Shell>
  );
}

function InviteBudgetChoice() {
  const [pick, setPick] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <Radio
        name="bud"
        checked={pick === 0}
        onChange={() => setPick(0)}
        title={
          <>
            Use the preset&rsquo;s monthly budget — 3,000 credits{" "}
            <span style={{ color: C.ink3, fontWeight: 500 }}>
              (≈ {money0(3000 * USD_PER_CREDIT)}/mo real cost)
            </span>
          </>
        }
      >
        Recommended for the rollout. You can override any individual later from their profile.
      </Radio>
      <Radio
        name="bud"
        checked={pick === 1}
        onChange={() => setPick(1)}
        title="Set a per-user override now"
      >
        For heavy production seats. <span style={{ fontFamily: MONO }}>[ 8,000 ]</span> credits /
        month.
      </Radio>
      <Radio
        name="bud"
        checked={pick === 2}
        onChange={() => setPick(2)}
        title="One-off trial grant, no monthly reset"
      >
        <span style={{ fontFamily: MONO }}>[ 500 ]</span> credits total, then access pauses until
        you top up. Good for &ldquo;colleagues who haven&rsquo;t tried it yet&rdquo;.
      </Radio>
    </div>
  );
}

export function TopupModal({ m, onClose }: { m: MemberWithUsage; onClose: () => void }) {
  return (
    <Shell
      onClose={onClose}
      title={`Grant one-off credits — ${m.name}`}
      subtitle="Outside the monthly allowance; does not change the recurring limit."
      footer={
        <>
          <div className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={onClose}>
            Grant credits
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Credits" hint={`≈ ${money0(2000 * USD_PER_CREDIT)} real cost`}>
          <input
            className={inputCls}
            style={{ ...inputStyle, fontFamily: MONO }}
            defaultValue="2,000"
          />
        </Field>
        <Field label="Expires">
          <select className={selectFull} style={inputStyle} defaultValue="">
            <option value="">End of this month</option>
            <option>Never</option>
            <option>In 90 days</option>
          </select>
        </Field>
      </div>
      <Field
        label="Cost centre / project code"
        hint="So the grant lands on the right P&L line, not the generic internal bucket."
      >
        <input className={inputCls} style={inputStyle} defaultValue="GS-2608-Beauty" />
      </Field>
      <Field label="Note">
        <input
          className={inputCls}
          style={inputStyle}
          placeholder="Client campaign overrun approved by…"
        />
      </Field>
    </Shell>
  );
}

export function ExportModal({ period, onClose }: { period: PeriodKey; onClose: () => void }) {
  const P = PERIODS[period];
  return (
    <Shell
      onClose={onClose}
      title="Export for finance"
      subtitle={`${P.label} · ${dstr(P.from)} – ${dstr(P.to)}`}
      footer={
        <>
          <div className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={onClose}>
            Export
          </Btn>
        </>
      }
    >
      <Field label="Rows">
        <select className={selectFull} style={inputStyle} defaultValue="">
          <option value="">One row per member</option>
          <option>One row per member × project tag</option>
          <option>One row per generation (raw)</option>
        </select>
      </Field>
      <div className="flex flex-col gap-2">
        <Switch defaultChecked label="Include real cost columns (USD) and model breakdown" />
        <Switch defaultChecked label="Include failed / abandoned generations" />
        <Switch label="Include prompts (may contain client-confidential briefs)" />
      </div>
      <Field label="Format">
        <select className={selectFull} style={inputStyle} defaultValue="">
          <option value="">CSV</option>
          <option>XLSX</option>
          <option>Push to Google Sheet</option>
        </select>
      </Field>
    </Shell>
  );
}
