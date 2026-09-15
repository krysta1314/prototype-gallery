import { getRedis } from "./redis";
import { monthDateKeys } from "./stats";
import { DEFAULT_SETTINGS, type DayRecord, type PushSub, type Settings } from "./types";

const dayKey = (dateKey: string) => `punch:day:${dateKey}`;
const jobKey = (dateKey: string) => `punch:job:${dateKey}`;
const authFailKey = (ip: string) => `punch:authfail:${ip}`;
const SETTINGS_KEY = "punch:settings";
const SUB_KEY = "punch:sub";

/** 登录失败锁定：连续失败达到该次数即锁定 */
export const AUTH_FAIL_MAX_ATTEMPTS = 10;
/** 登录失败锁定窗口（秒），同时也是每次失败计数续的 TTL */
export const AUTH_FAIL_LOCK_SECONDS = 15 * 60;

export async function getDay(dateKey: string): Promise<DayRecord | null> {
  return (await getRedis().get<DayRecord>(dayKey(dateKey))) ?? null;
}

export async function putDay(rec: DayRecord): Promise<void> {
  await getRedis().set(dayKey(rec.date), rec);
}

/** 一次 mget 取整月，避免 scan */
export async function listMonth(year: number, month: number): Promise<DayRecord[]> {
  const keys = monthDateKeys(year, month);
  const rows = await getRedis().mget<(DayRecord | null)[]>(keys.map(dayKey));
  return rows.filter((r): r is DayRecord => r !== null).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSettings(): Promise<Settings> {
  const stored = await getRedis().get<Partial<Settings>>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function putSettings(s: Settings): Promise<void> {
  await getRedis().set(SETTINGS_KEY, s);
}

export async function getSub(): Promise<PushSub | null> {
  return (await getRedis().get<PushSub>(SUB_KEY)) ?? null;
}

export async function putSub(s: PushSub): Promise<void> {
  await getRedis().set(SUB_KEY, s);
}

export async function delSub(): Promise<void> {
  await getRedis().del(SUB_KEY);
}

export async function getJobId(dateKey: string): Promise<string | null> {
  return (await getRedis().get<string>(jobKey(dateKey))) ?? null;
}

export async function putJobId(dateKey: string, id: string): Promise<void> {
  // 保留 3 天足够覆盖「排程 → 投递 → 取消」的窗口，之后自动过期免得堆垃圾
  await getRedis().set(jobKey(dateKey), id, { ex: 3 * 24 * 60 * 60 });
}

export async function delJobId(dateKey: string): Promise<void> {
  await getRedis().del(jobKey(dateKey));
}

/** 自增指定 IP 的登录失败计数并续 TTL，返回自增后的当前值 */
export async function bumpAuthFail(ip: string): Promise<number> {
  const key = authFailKey(ip);
  const count = await getRedis().incr(key);
  await getRedis().expire(key, AUTH_FAIL_LOCK_SECONDS);
  return count;
}

/** 读取指定 IP 当前的登录失败计数，没有记录返回 0 */
export async function getAuthFail(ip: string): Promise<number> {
  return (await getRedis().get<number>(authFailKey(ip))) ?? 0;
}

export async function clearAuthFail(ip: string): Promise<void> {
  await getRedis().del(authFailKey(ip));
}
