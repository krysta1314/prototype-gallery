'use client';

import { useCallback, useEffect, useState } from 'react';
import { SEED_CAMPAIGNS } from './seed';
import type { Campaign, CampaignStatus } from './types';

const STORAGE_KEY = 'buzz-promo-campaigns';
const CHANGE_EVENT = 'buzz-promo-campaigns:change';

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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function resetCampaigns(): Campaign[] {
  const fresh = structuredClone(SEED_CAMPAIGNS);
  saveCampaigns(fresh);
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
