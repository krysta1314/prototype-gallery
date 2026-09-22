'use client';

import { useCallback, useEffect, useState } from 'react';
import { SEED_CAMPAIGNS, SEED_CODES } from './seed';
import type { Campaign, CampaignStatus, RedeemCode } from './types';

const STORAGE_KEY = 'buzz-promo-campaigns';
const CODES_KEY = 'buzz-promo-codes';
const CHANGE_EVENT = 'buzz-promo-campaigns:change';
/** 弹窗频控计数的 localStorage key —— home/page.tsx 与 DemoBar 都要能清它，统一放在 store 里导出。 */
export const SEEN_KEY = 'buzz-promo-seen';

export function resolveStatus(c: Campaign, now: number): CampaignStatus {
  if (!c.published) return 'draft';
  const start = new Date(c.startAt).getTime();
  const end = new Date(c.endAt).getTime();
  if (now < start) return 'scheduled';
  if (now > end) return 'ended';
  return 'live';
}

export function loadCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return structuredClone(SEED_CAMPAIGNS);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CAMPAIGNS));
    return structuredClone(SEED_CAMPAIGNS);
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Campaign[]) : structuredClone(SEED_CAMPAIGNS);
  } catch {
    return structuredClone(SEED_CAMPAIGNS);
  }
}

export function saveCampaigns(list: Campaign[]): void {
  /* localStorage 一共 5MB,素材塞多了会抛 QuotaExceededError。
     抛了也要继续派发变更事件 —— 界面照常更新,只是这次没落盘,
     否则一次写失败会让整个后台看起来卡死。 */
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    console.warn('[promo] localStorage is full — this change is not persisted.');
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function resetCampaigns(): Campaign[] {
  const fresh = structuredClone(SEED_CAMPAIGNS);
  saveCampaigns(fresh);
  window.localStorage.setItem(CODES_KEY, JSON.stringify(SEED_CODES));
  // 重置活动的同时清掉弹窗频控计数，否则 maxPerUser 已用尽的活动重置后依然不会自动弹出。
  window.localStorage.removeItem(SEEN_KEY);
  return fresh;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCampaigns(loadCampaigns());
    sync();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性挂载标记，非订阅回调，用于避免 SSR/CSR 首帧不一致
    setReady(true);
    // 同标签页切路由靠自定义事件，多标签页并排靠原生 storage 事件
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((list: Campaign[]) => {
    saveCampaigns(list);
  }, []);

  const reset = useCallback(() => {
    setCampaigns(resetCampaigns());
  }, []);

  return { campaigns, save, reset, ready };
}

/* ---------- 兑换码 ---------- */

export type CodeStatus = 'active' | 'paused' | 'expired' | 'exhausted';

export function resolveCodeStatus(c: RedeemCode, now: number): CodeStatus {
  if (c.expiresAt && now > new Date(c.expiresAt).getTime()) return 'expired';
  if (c.maxRedemptions > 0 && c.redeemed >= c.maxRedemptions) return 'exhausted';
  if (!c.active) return 'paused';
  return 'active';
}

export function loadCodes(): RedeemCode[] {
  if (typeof window === 'undefined') return structuredClone(SEED_CODES);
  const raw = window.localStorage.getItem(CODES_KEY);
  if (!raw) {
    window.localStorage.setItem(CODES_KEY, JSON.stringify(SEED_CODES));
    return structuredClone(SEED_CODES);
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RedeemCode[]) : structuredClone(SEED_CODES);
  } catch {
    return structuredClone(SEED_CODES);
  }
}

export function saveCodes(list: RedeemCode[]): void {
  window.localStorage.setItem(CODES_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function useCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCodes(loadCodes());
    sync();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 同 useCampaigns,一次性挂载标记
    setReady(true);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((list: RedeemCode[]) => {
    saveCodes(list);
  }, []);

  return { codes, save, ready };
}
