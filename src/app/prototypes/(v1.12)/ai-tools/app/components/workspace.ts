/* v1.12 的当前工作区(2026-11-06 Monica 定：把 v1.6 团队原型的账号切换接到 v1.12 顶栏)。
   工作区列表直接用 v1.6 team-workspace 的 TEAMS(个人 / Scale / Team / Enterprise 四种),不另造一份。
   全站一个 store:所有页面的顶栏读同一个值，切换后存到浏览器本地，刷新还在;外壳订阅它来换积分余额。 */

import { useSyncExternalStore } from "react";
import { CURRENT_USER, TEAMS, type Team } from "@/app/prototypes/(v1.6)/team-workspace/_shared/data";

export type Workspace = Team;
export const WORKSPACES: Workspace[] = TEAMS;
export const PERSONAL_ID = "t-personal";
export { CURRENT_USER };

/** 菜单里显示的成员数(和 v1.6 身份菜单一致) */
export const MEMBER_COUNT: Record<string, number> = { "t-growth": 7, "t-beauty": 3, "t-atlas": 7 };

/** 各工作区的积分余额初始值(演示数据);个人空间沿用外壳原来的余额 */
export const WORKSPACE_CREDITS: Record<string, number> = { "t-growth": 7_100, "t-beauty": 12_400, "t-atlas": 486_000 };

const KEY = "buzz-v112-workspace";
type Listener = (next: string, prev: string) => void;
const listeners = new Set<Listener>();
let current: string | null = null;

function read(): string {
  if (current) return current;
  try {
    const v = localStorage.getItem(KEY);
    current = v && WORKSPACES.some((w) => w.id === v) ? v : PERSONAL_ID;
  } catch {
    current = PERSONAL_ID;
  }
  return current;
}

/** 当前工作区 id(非 React 场景用) */
export const currentWorkspaceId = () => read();

export function setWorkspace(id: string) {
  const prev = read();
  if (id === prev || !WORKSPACES.some((w) => w.id === id)) return;
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* 存不了就只在本次会话里生效 */
  }
  listeners.forEach((l) => l(id, prev));
}

/** 订阅切换(拿得到切换前后的 id,外壳用它存取各自的余额) */
export function onWorkspaceChange(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const workspaceOf = (id: string) => WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0]!;

/** 当前工作区;服务端渲染时先当个人空间 */
export function useWorkspace(): Workspace {
  const id = useSyncExternalStore(onWorkspaceChange, read, () => PERSONAL_ID);
  return workspaceOf(id);
}
