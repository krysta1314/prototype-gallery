/* 评审原型的数据接口:按 rellet.json 回放。改稿一律返回录好的那一版;出错开关打开时对应调用抛错。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { AgentApi } from "../api";
import type { Lang } from "../store";
import { withLongScript, withVoiceover, withoutAiShots } from "./transform";
import type { FixtureData, FixtureSet } from "./types";

export type FixtureOpts = {
  lang: Lang;
  voiceover: boolean;
  aiShots: "recorded" | 0;
  failAnalyze: boolean;
  failOutline: boolean;
  /** 「旁白超长」:旁白稿换成更长的一版(成片交付说明里能看到提速 / 删句 / 字幕拆屏) */
  longScript?: boolean;
  /** 「思考中」的节奏单位,默认 1500ms:读素材每个文件 1 份、出 brief 1 份、排分镜 2 份(评审里要看得清,不能一闪而过);测试传 0 */
  delayMs?: number;
};

export function shapeOutline(o: Outline, set: FixtureSet, opts: FixtureOpts): Outline {
  const shaped = opts.aiShots === 0 ? withoutAiShots(o, set.profiles) : o;
  return withVoiceover(opts.longScript ? withLongScript(shaped, opts.lang) : shaped, opts.voiceover);
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
    /* 按文件逐个推进度,每个文件 delay;出错开关在读到最后一个时抛 */
    async analyze(items, _lang, o = {}) {
      const n = items.length;
      o.onProgress?.(0, n);
      if (!n) await wait(delay, o.signal);
      for (let i = 0; i < n; i++) {
        await wait(delay, o.signal);
        if (opts.failAnalyze && i === n - 1) throw new Error("The model service timed out (simulated)");
        o.onProgress?.(i + 1, n);
      }
      if (opts.failAnalyze) throw new Error("The model service timed out (simulated)");
      return { profiles: set.profiles, skipped: [] };
    },
    async brief(prompt) {
      await wait(delay);
      return prompt.trim() === set.promptStated.trim() ? set.briefStated : set.brief;
    },
    async outline(req) {
      await wait(delay * 2);
      if (opts.failOutline) throw new Error("The model service timed out (simulated)");
      return shapeOutline(req.revise ? set.revised : set.outline, set, opts);
    },
  };
}
