/* 评审原型的录制数据形状(rellet.json 由 scripts/record-hybrid-reel-fixture.mts 生成)。 */

import type { ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { BriefResult } from "../api";
import type { Answers } from "../logic/questions";
import type { Lang } from "../store";

/** 一句旁白的录音 */
export type VoiceLine = { text: string; url: string; durationSec: number };

export type FixtureSet = {
  /** 「制作一条广告」:平台、时长都没说,提问卡问 3 题 */
  prompt: string;
  /** 已写明平台与时长,提问卡只问补拍 */
  promptStated: string;
  profiles: ClipProfile[];
  brief: BriefResult;
  briefStated: BriefResult;
  /** 录制时按提问卡填的答案 */
  answers: Answers;
  outline: Outline;
  /** 录制时的改稿原话 */
  revision: string;
  revised: Outline;
  /** 每句旁白的录音:评审里配音按句回放,换音色不变声 */
  voice: VoiceLine[];
};

export type FixtureData = Record<Lang, FixtureSet>;
