/* 评审开关对录好的分镜做的纯数据变换。 */

import type { ClipProfile, Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

/** AI 补拍 0:每个补拍镜头换成一段可用素材(同样时长,轮流取可用片段),积分只剩基础费 */
export function withoutAiShots(outline: Outline, profiles: ClipProfile[]): Outline {
  const pool = profiles.flatMap((p, clipIndex) =>
    p.kind === "video" ? (p.segments ?? []).filter((g) => g.usable).map((g) => ({ clipIndex, start: g.start, end: g.end })) : [],
  );
  let k = 0;
  const shots: Shot[] = outline.shots.map((s) => {
    if (s.source.kind !== "generate" || !pool.length) return s;
    const seg = pool[k++ % pool.length];
    const outSec = Math.min(seg.end, seg.start + s.durationSec);
    return { ...s, source: { kind: "clip", clipIndex: seg.clipIndex, inSec: seg.start, outSec } };
  });
  return { ...outline, shots, credits: { ...outline.credits, generatedShots: 0, total: outline.credits.base } };
}

export function withVoiceover(outline: Outline, on: boolean): Outline {
  if (!outline.voiceover || outline.voiceover.on === on) return outline;
  return { ...outline, voiceover: { ...outline.voiceover, on } };
}
