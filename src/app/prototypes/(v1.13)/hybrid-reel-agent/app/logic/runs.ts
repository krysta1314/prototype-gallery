/* Generate 之后的演示:Claude 式折叠工具调用行。不调任何接口,只按耗时排程。
   真实产品里这些行来自 Agent 的实际工具调用流(spec §5)。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

export type ToolRun = { id: string; label: string; detail?: string; ms: number; group?: string };
export type Slot = { id: string; startMs: number; endMs: number };

export function toolRuns(outline: Outline): ToolRun[] {
  const runs: ToolRun[] = [{ id: "usage", label: "Get usage", ms: 500 }];
  const gen = outline.shots.flatMap((s, i) => (s.source.kind === "generate" ? [{ s: s.source, i }] : []));
  if (gen.length) {
    runs.push({ id: "ref", label: "Upload reference image", ms: 1000 });
    gen.forEach(({ s, i }, k) =>
      runs.push({ id: `gen-${i}`, label: "Generate video", detail: s.prompt, ms: 4000 + (k % 3) * 1000, group: "gen" }),
    );
  }
  if (outline.voiceover?.on) {
    runs.push({ id: "voices", label: "List voices", ms: 500 });
    runs.push({ id: "audio", label: "Generate audio", detail: outline.shots.map((s) => s.subtitle.text).filter(Boolean).join(" "), ms: 2000 });
  }
  runs.push(
    { id: "ff-cut", label: "Run ffmpeg · cut footage", ms: 1500 },
    { id: "ff-assemble", label: "Run ffmpeg · assemble", ms: 2000 },
    { id: "ff-subs", label: "Run ffmpeg · subtitles", ms: 1500 },
    { id: "ff-mix", label: "Run ffmpeg · mix audio", ms: 1500 },
    { id: "check", label: "Check output", ms: 1000 },
  );
  return runs;
}

export function schedule(runs: ToolRun[]): Slot[] {
  const slots: Slot[] = [];
  let cursor = 0;
  let i = 0;
  while (i < runs.length) {
    const g = runs[i].group;
    const batch = g ? runs.slice(i).filter((r, k, arr) => arr.slice(0, k + 1).every((x) => x.group === g)) : [runs[i]];
    const end = Math.max(...batch.map((r) => cursor + r.ms));
    batch.forEach((r) => slots.push({ id: r.id, startMs: cursor, endMs: cursor + r.ms }));
    cursor = end;
    i += batch.length;
  }
  return slots;
}
