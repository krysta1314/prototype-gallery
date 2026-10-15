/* 评审原型的数据接口:按 rellet.json 回放。改稿一律返回录好的那一版;出错开关打开时对应调用抛错。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { AgentApi } from "../api";
import type { Lang } from "../store";
import { withVoiceover, withoutAiShots } from "./transform";
import type { FixtureData, FixtureSet } from "./types";

export type FixtureOpts = {
  lang: Lang;
  voiceover: boolean;
  aiShots: "recorded" | 0;
  failAnalyze: boolean;
  failOutline: boolean;
  /** 「思考中」可见的时长,默认 1500ms;测试传 0 */
  delayMs?: number;
};

export function shapeOutline(o: Outline, set: FixtureSet, opts: FixtureOpts): Outline {
  const shaped = opts.aiShots === 0 ? withoutAiShots(o, set.profiles) : o;
  return withVoiceover(shaped, opts.voiceover);
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Cancelled", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      { once: true },
    );
  });

export function createFixtureApi(data: FixtureData, opts: FixtureOpts): AgentApi {
  const set = data[opts.lang];
  const delay = opts.delayMs ?? 1500;
  return {
    /* 按文件逐个推进度(总时长仍是 delay);出错开关在读到最后一个时抛 */
    async analyze(items, _lang, o = {}) {
      const n = items.length;
      o.onProgress?.(0, n);
      if (!n) await wait(delay, o.signal);
      for (let i = 0; i < n; i++) {
        await wait(delay / n, o.signal);
        if (opts.failAnalyze && i === n - 1) throw new Error("The model service timed out (simulated)");
        o.onProgress?.(i + 1, n);
      }
      if (opts.failAnalyze) throw new Error("The model service timed out (simulated)");
      return { profiles: set.profiles, skipped: [] };
    },
    async brief(prompt) {
      return prompt.trim() === set.promptStated.trim() ? set.briefStated : set.brief;
    },
    async outline(req) {
      await wait(delay);
      if (opts.failOutline) throw new Error("The model service timed out (simulated)");
      return shapeOutline(req.revise ? set.revised : set.outline, set, opts);
    },
  };
}
