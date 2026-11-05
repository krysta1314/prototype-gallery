"use client";

/* 「我的分身」放在外壳(ProductApp)里:Custom Avatar 创建 / 改名 / 删除,Product Avatar 的「My avatars」和克隆声音读同一份。
   训练也在外壳里跑(不管当前在哪个页面都会完成并弹 toast「… is ready」);失败全额退积分。
   persist = true 时存 sessionStorage(刷新后还在,训练中的继续跑);评审原型 persist = false 不存。 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ToolsApi } from "../tools/api";
import type { Wallet } from "../tools/jobs";
import type { Notify } from "../components/TopToast";
import { AVATARS_KEY, avatarsReduce, parseAvatars, type AvatarsAction, type MyAvatar } from "./logic";
import { SAMPLE_FOOTAGE } from "./fixture";

export type AvatarStore = { avatars: MyAvatar[]; dispatch: (a: AvatarsAction) => void };

export function useMyAvatars({ api, wallet, notify, persist }: { api: ToolsApi; wallet: Wallet; notify: Notify; persist: boolean }): AvatarStore {
  const [avatars, dispatch] = useReducer(avatarsReduce, []);
  const loaded = useRef(!persist);

  /* 读回 sessionStorage(挂载后读,避免 SSR 不一致) */
  useEffect(() => {
    if (!persist) return;
    try {
      dispatch({ type: "load", list: parseAvatars(sessionStorage.getItem(AVATARS_KEY), SAMPLE_FOOTAGE.poster) });
    } catch {
      /* 读不了就从空列表开始 */
    }
    loaded.current = true;
  }, [persist]);

  useEffect(() => {
    if (!persist || !loaded.current) return;
    try {
      sessionStorage.setItem(AVATARS_KEY, JSON.stringify(avatars));
    } catch {
      /* 存不了不影响使用 */
    }
  }, [avatars, persist]);

  /* 训练:每个 training 的分身只跑一次;删掉的中止 */
  const inflight = useRef(new Map<string, AbortController>());
  const cb = useRef({ wallet, notify, avatars });
  useEffect(() => {
    cb.current = { wallet, notify, avatars };
  });
  /** 完成时用最新的名字(训练中可能改过名) */
  const nameOf = (a: MyAvatar) => cb.current.avatars.find((x) => x.id === a.id)?.name ?? a.name;
  useEffect(() => {
    const map = inflight.current;
    for (const [id, ac] of map) {
      if (!avatars.some((a) => a.id === id && a.status === "training")) {
        ac.abort();
        map.delete(id);
      }
    }
    for (const a of avatars) {
      if (a.status !== "training" || map.has(a.id)) continue;
      const ac = new AbortController();
      map.set(a.id, ac);
      api
        .run("avatar-train", { signal: ac.signal })
        .then(() => {
          if (ac.signal.aborted) return;
          dispatch({ type: "status", id: a.id, status: "ready" });
          cb.current.notify(`Your avatar "${nameOf(a)}" is ready`, "success");
        })
        .catch(() => {
          if (ac.signal.aborted) return;
          dispatch({ type: "status", id: a.id, status: "failed" });
          cb.current.wallet.refund(a.cost);
          cb.current.notify(`Training "${nameOf(a)}" failed. Your credits have been refunded.`, "error");
        })
        .finally(() => {
          if (map.get(a.id) === ac) map.delete(a.id);
        });
    }
  }, [avatars, api]);

  useEffect(() => {
    const map = inflight.current;
    return () => {
      map.forEach((ac) => ac.abort());
      map.clear();
    };
  }, []);

  const stableDispatch = useCallback((a: AvatarsAction) => dispatch(a), []);
  return { avatars, dispatch: stableDispatch };
}
