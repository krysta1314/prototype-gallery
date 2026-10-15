/* 分镜表的一行:时间 / 内容 / 来源 / 这一镜的旁白。方案卡和成片卡共用。 */

import { onScreenSec, type ClipProfile, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

export type StoryRow = { start: number; end: number; content: string; source: "Footage" | "AI"; line: string };

const r1 = (n: number) => Math.round(n * 10) / 10;

export function fmtRange(start: number, end: number): string {
  return `${r1(start)}–${r1(end)}s`;
}

function firstSentence(text: string): string {
  return text.split(/[.。\n]/)[0].trim().slice(0, 90);
}

export function storyboardRows(outline: Outline, profiles: ClipProfile[]): StoryRow[] {
  let t = 0;
  return outline.shots.map((shot) => {
    const len = onScreenSec(shot);
    const start = r1(t);
    t += len;
    const src = shot.source;
    let content = "";
    let source: StoryRow["source"] = "Footage";
    if (src.kind === "generate") {
      source = "AI";
      content = src.summary?.trim() || firstSentence(src.prompt);
    } else if (src.kind === "clip") {
      const p = profiles[src.clipIndex];
      const seg = p?.segments?.find((g) => src.inSec >= g.start && src.inSec < g.end);
      content = seg?.description ?? p?.description ?? p?.label ?? "";
    } else {
      content = src.reason;
    }
    return { start, end: r1(t), content, source, line: shot.subtitle.text };
  });
}

export function aiShotNumbers(outline: Outline): number[] {
  return outline.shots.flatMap((s, i) => (s.source.kind === "generate" ? [i + 1] : []));
}
