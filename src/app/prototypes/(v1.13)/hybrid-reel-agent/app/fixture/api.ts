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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createFixtureApi(data: FixtureData, opts: FixtureOpts): AgentApi {
  const set = data[opts.lang];
  const delay = opts.delayMs ?? 1500;
  return {
    async analyze() {
      await wait(delay);
      if (opts.failAnalyze) throw new Error("The model service timed out (simulated)");
      return set.profiles;
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
