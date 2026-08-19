'use client';

import { useState } from 'react';
import type { BusinessRole, UserRole } from '../../hooks/useUserRole';

/**
 * 可选身份由调用方给 —— Individual tab 传个人四档,Business tab 传团队四档。
 * 组件本身不认识具体档位,所以两套身份互不污染。
 */
export interface PreviewIdentity<T extends string = string> {
  id: T;
  label: string;
}

/** Individual tab 的四档身份 */
export const INDIVIDUAL_IDENTITIES = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro' },
  { id: 'ultra', label: 'Ultra' },
] as const satisfies readonly PreviewIdentity<UserRole>[];

/** Business tab 的身份 —— 'none' 是还没建团队的人 */
export const BUSINESS_IDENTITIES = [
  { id: 'none', label: 'No team' },
  { id: 'team', label: 'Team' },
  { id: 'scale', label: 'Scale' },
  { id: 'enterprise', label: 'Enterprise' },
] as const satisfies readonly PreviewIdentity<BusinessRole>[];

interface RolePickerProps<T extends string = string> {
  role: T;
  setRole: (r: T) => void;
  identities: readonly PreviewIdentity<T>[];
  /** 卡片副标题,说明当前在预览哪一类身份 */
  hint?: string;
  /** 可选:点击展开卡片顶部的 demo 入口时调用 */
  onDemoClick?: () => void;
}

/**
 * Floating dev tool — switch user identity to preview each role's UI.
 * Bottom-right fixed. Minimizable.
 */
export function RolePicker<T extends string>({ role, setRole, identities, hint, onDemoClick }: RolePickerProps<T>) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open role preview"
        className="hidden md:flex fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-[#0a0a0a] text-white shadow-lg hover:scale-105 transition-transform items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-50 flex-col items-end gap-2">
      {/* Demo 入口 — 浮在 RolePicker 卡片上方,独立 pill */}
      {onDemoClick && (
        <button
          type="button"
          onClick={onDemoClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-neutral-300 shadow-lg text-[12px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <span aria-hidden>🔔</span>
          Credits Warning Demo
        </button>
      )}

      <div
        role="region"
        aria-label="Role preview selector"
        className="bg-[#0a0a0a] text-white rounded-xl shadow-2xl p-3 min-w-[260px]"
      >
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
          Preview as
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Minimize role preview"
          className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {identities.map(r => {
          const active = r.id === role;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={
                'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ' +
                (active
                  ? 'bg-white text-[#0a0a0a]'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white')
              }
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 text-[10px] text-neutral-500 leading-tight">
        Dev tool · {hint ?? 'Switch user identity to preview each role\u2019s UI'}
      </div>
      </div>
    </div>
  );
}
