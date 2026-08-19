'use client';

import { useEffect, useState } from 'react';
import type { PlanId } from '../lib/pricing/pricing';
import type { BusinessPlanId } from '../lib/pricing/business';

/**
 * Mock user identity for the role-preview prototype.
 * In production, this comes from auth context / session.
 *
 * 两套身份各自独立：Individual tab 预览个人订阅态，Business tab 预览团队订阅态。
 * 一个人可以既有个人 Pro 又在某个 Team 里，所以两者不能互斥成一个值。
 *
 * Persisted to localStorage so refresh keeps the selected identity.
 */
export type UserRole = PlanId; // 'free' | 'starter' | 'pro' | 'ultra'
/** 'none' = 还没有任何团队 —— Business tab 的默认视角 */
export type BusinessRole = 'none' | BusinessPlanId;

const STORAGE_KEY = 'buzz_preview_role';
const BUSINESS_STORAGE_KEY = 'buzz_preview_business_role';
const VALID_ROLES: UserRole[] = ['free', 'starter', 'pro', 'ultra'];
const VALID_BUSINESS_ROLES: BusinessRole[] = ['none', 'team', 'scale', 'enterprise'];

function read<T extends string>(key: string, valid: T[], fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored && (valid as string[]).includes(stored)) return stored as T;
  } catch {
    /* localStorage unavailable */
  }
  return fallback;
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage unavailable */
  }
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole>('free');
  const [businessRole, setBusinessRoleState] = useState<BusinessRole>('none');

  useEffect(() => {
    setRoleState(read(STORAGE_KEY, VALID_ROLES, 'free'));
    setBusinessRoleState(read(BUSINESS_STORAGE_KEY, VALID_BUSINESS_ROLES, 'none'));
  }, []);

  const setRole = (next: UserRole) => {
    setRoleState(next);
    write(STORAGE_KEY, next);
  };

  const setBusinessRole = (next: BusinessRole) => {
    setBusinessRoleState(next);
    write(BUSINESS_STORAGE_KEY, next);
  };

  return { role, setRole, businessRole, setBusinessRole };
}
