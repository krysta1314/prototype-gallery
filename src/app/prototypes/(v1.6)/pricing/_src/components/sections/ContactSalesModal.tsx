'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/buzz-ui/Button';

const DESCRIPTION_MAX = 2000;

/** Demo：假设已登录，邮箱预填当前账号 */
const SIGNED_IN_EMAIL = 'monica.zhou@presslogic.com';

const SUBTITLE =
  "Tell us about your team size, use case, and any specific needs. We'll get back to you within 1 business day.";

/**
 * Enterprise 的 Contact Sales 表单弹窗。
 * 原型只做前端校验 + 提交后的成功态，不接后端。
 */
export function ContactSalesModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(SIGNED_IN_EMAIL);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const errors = {
    name: !name.trim() ? 'Name is required' : '',
    email: !email.trim()
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? 'Enter a valid email address'
        : '',
    description: !description.trim() ? 'Description is required' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSend = () => {
    setSubmitted(true);
    if (!hasErrors) setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Contact Sales"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_24px_64px_rgba(10,10,10,0.24)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-tight">Contact Sales</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1 -mt-1 p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {sent ? (
          <>
            <p className="mt-2 text-[13px] leading-snug text-neutral-500">
              Thanks — your request is in. Our sales team will reply to{' '}
              <span className="text-[#0a0a0a] font-medium">{email.trim()}</span> within 1 business
              day.
            </p>
            <div className="mt-6 flex justify-end">
              <div className="w-[120px]">
                <Button variant="dark" onClick={e => { e.preventDefault(); onClose(); }}>
                  Done
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[13px] leading-snug text-neutral-500">{SUBTITLE}</p>

            <div className="mt-5 flex flex-col gap-4">
              <Field label="Name" error={submitted ? errors.name : ''}>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass(submitted && !!errors.name)}
                />
              </Field>

              <Field label="Email" error={submitted ? errors.email : ''}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass(submitted && !!errors.email)}
                />
              </Field>

              <Field label="Description" error={submitted ? errors.description : ''}>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                  rows={4}
                  placeholder="Tell us about your team size, use case, and any specific needs..."
                  className={`${inputClass(submitted && !!errors.description)} resize-y min-h-[104px]`}
                />
                <div className="mt-1 text-right text-[11px] text-neutral-400">
                  {description.length} / {DESCRIPTION_MAX}
                </div>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <div className="w-[120px]">
                <Button variant="outline" onClick={e => { e.preventDefault(); onClose(); }}>
                  Cancel
                </Button>
              </div>
              <div className="w-[120px]">
                <Button variant="dark" onClick={e => { e.preventDefault(); handleSend(); }}>
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function inputClass(invalid: boolean) {
  return [
    'w-full rounded-[10px] border px-3 py-2.5 text-[13px] text-[#0a0a0a] outline-none transition-colors',
    'placeholder:text-neutral-400',
    invalid
      ? 'border-red-400 focus:border-red-500'
      : 'border-neutral-200 focus:border-[#0a0a0a]',
  ].join(' ');
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#0a0a0a] mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
      {error && <div className="mt-1 text-[12px] text-red-500">{error}</div>}
    </div>
  );
}

/** CTA + 弹窗状态打包，卡片和对比表都用它渲染 Enterprise 的 Contact Sales。 */
export function ContactSalesButton({
  label,
  variant = 'outline',
}: {
  label: string;
  variant?: 'dark' | 'accent' | 'secondary' | 'outline';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={e => { e.preventDefault(); setOpen(true); }}>
        {label}
      </Button>
      {open && <ContactSalesModal onClose={() => setOpen(false)} />}
    </>
  );
}
