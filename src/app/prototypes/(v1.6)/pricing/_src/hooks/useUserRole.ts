'use client';

import { useEffect, useState } from 'react';
import type { PlanId } from '../lib/pricing/pricing';

/**
 * Mock user identity for the role-preview prototype.
 * In production, this comes from auth context / session.
 *
 * Persisted to localStorage so refresh keeps the selected role.
 */
export type UserRole = PlanId; // 'free' | 'starter' | 'pro' | 'ultra'

const STORAGE_KEY = 'buzz_preview_role';
const VALID_ROLES: UserRole[] = ['free', 'starter', 'pro', 'ultra'];

function readRole(): UserRole {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (VALID_ROLES as string[]).includes(stored)) return stored as UserRole;
  } catch {
    /* localStorage unavailable */
  }
  return 'free';
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole>('free');

  useEffect(() => {
    setRoleState(readRole());
  }, []);

  const setRole = (next: UserRole) => {
    setRoleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable */
    }
  };

  return { role, setRole };
}
