import { describe, expect, it } from "vitest";
import {
  animatePhoto,
  applyPrompts,
  applyScript,
  canUseFootage,
  continueText,
  cutShots,
  failedSec,
  failureAnswer,
  failureKind,
  failureQuestion,
  fillWithFootage,
  otherVoice,
  productPhoto,
  promptRewrite,
  rewritePrompt,
  scriptRewrite,
  voiceFailureQuestion,
  withModel,
  withVoice,
  withoutRefs,
  withoutVoiceover,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/failure";
import { shotFail } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/runs";
import { voiceCost, voiceLines } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/voice";
import { reelCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { deliveryNotes } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/delivery";
import { reelPrompts } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/plan";
import { answerRows } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/questions";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;
const { outline, profiles } = DATA.en;

describe("failure question", () => {
  it("busy, one failed shot: Retry (recommended) / another model / product photo / footage / cut, English copy", () => {
    const q = failureQuestion(outline, [3], profiles);
    expect(q.title).toBe("Shot 3 didn't generate. How should I continue?");
    expect(q.multi).toBe(false);
    expect(q.defaults).toEqual(["retry"]);
    expect(q.options).toEqual([
      { value: "retry", label: "Retry shot 3", description: "Generate it again · 50 credits" },
      { value: "model", label: "Try another model", description: "Generate it with Seedance 2.0 Fast · 50 credits" },
      { value: "photo", label: "Animate a product photo", description: "Pan and zoom over your product image · no credits" },
      { value: "footage", label: "Use your footage instead", description: "Fill this beat with your closest matching clip · no credits" },
      { value: "cut", label: "Cut it from the ad", description: "Make the ad without this beat · the ad gets 4s shorter" },
    ]);
  });
  it("moderation: Rewrite (recommended, free until Generate) / different reference / product photo / footage / cut", () => {
    const q = failureQuestion(outline, [3], profiles, "moderation");
    expect(q.defaults).toEqual(["rewrite"]);
    expect(q.options.slice(0, 2)).toEqual([
      { value: "rewrite", label: "Rewrite the prompt and retry", description: "I'll soften what may have tripped the check and show you first" },
      { value: "reference", label: "Use a different reference", description: "Pick another image, or generate without one · 50 credits" },
    ]);
    expect(q.options.map((o) => o.value)).toEqual(["rewrite", "reference", "photo", "footage", "cut"]);
  });
  it("several failed shots are asked once; mixed reasons use the moderation set", () => {
    const q = failureQuestion(outline, [2, 3], profiles);
    expect(q.title).toBe("Shots 2 and 3 didn't generate. How should I continue?");
    expect(q.options.map((o) => o.label)).toEqual(["Retry shots 2 and 3", "Try another model", "Animate product photos", "Use your footage instead", "Cut them from the ad"]);
    expect(q.options[0].description).toBe("Generate them again · 100 credits");
    expect(q.options[1].description).toBe("Generate them with Seedance 2.0 Fast · 100 credits");
    expect(q.options[4].description).toBe("Make the ad without these beats · the ad gets 8s shorter");
    expect(failedSec(outline, [2, 3])).toBe(8);
    expect(failureKind([shotFail(2), shotFail(3)])).toBe("busy");
    expect(failureKind([shotFail(2), shotFail(3, "moderation")])).toBe("moderation");
    expect(failureQuestion(outline, [2, 3], profiles, "moderation").options[0].label).toBe("Rewrite the prompts and retry");
  });
  it("the failed card reason follows the kind", () => {
    expect(shotFail(3)).toEqual({ shot: 3, kind: "busy", reason: "The video model is busy right now" });
    expect(shotFail(3, "moderation").reason).toBe("The reference image may contain sensitive content");
  });
  it("product photo only when there is a product image (not a brand logo / reference)", () => {
    expect(productPhoto(profiles)).toBe(1);
    const noProduct = profiles.map((p) => (p.kind === "image" ? { ...p, identity: "brand" as const } : p));
    expect(productPhoto(noProduct)).toBeUndefined();
    expect(failureQuestion(outline, [3], noProduct).options.map((o) => o.value)).toEqual(["retry", "model", "footage", "cut"]);
    expect(failureQuestion(outline, [3], noProduct, "moderation").options.map((o) => o.value)).toEqual(["rewrite", "reference", "footage", "cut"]);
  });
  it("hides the footage option when there is no usable video", () => {
    expect(canUseFootage(profiles.filter((p) => p.kind !== "video"))).toBe(false);
    expect(failureQuestion(outline, [3], profiles.filter((p) => p.kind !== "video")).options.map((o) => o.value)).toEqual(["retry", "model", "photo", "cut"]);
  });
  it("answers: Skip / pick → choice, Other text → revision; summary row marks Recommended", () => {
    expect(failureAnswer({ failure: { picked: ["retry"] } })).toEqual({ choice: "retry" });
    expect(failureAnswer({ failure: { picked: ["cut"] } })).toEqual({ choice: "cut" });
    expect(failureAnswer({ failure: { picked: [], other: "make it shorter" } })).toEqual({ other: "make it shorter" });
    /* 带上题目时只认题目里的选项;认不出 / 没选落到推荐项 */
    const mod = failureQuestion(outline, [3], profiles, "moderation");
    expect(failureAnswer({ failure: { picked: ["retry"] } }, mod)).toEqual({ choice: "rewrite" });
    expect(failureAnswer({ failure: { picked: [] } }, mod)).toEqual({ choice: "rewrite" });
    expect(failureAnswer({ failure: { picked: ["reference"] } }, mod)).toEqual({ choice: "reference" });
    const q = failureQuestion(outline, [3], profiles);
    expect(answerRows([q], { failure: { picked: ["retry"] } })).toEqual([{ question: q.title, answer: "Retry shot 3 (Recommended)" }]);
  });
});

describe("continuing after a failure", () => {
  it("footage: swaps the failed AI shot for an unused usable segment, keeping words and cards", () => {
    const o = fillWithFootage(outline, [3], profiles);
    const s = o.shots[2];
    /* 录制英文版:IMG_3716 的 8.4–11.6 没用过 */
    expect(s.source).toEqual({ kind: "clip", clipIndex: 3, inSec: 8.4, outSec: 11.6 });
    expect(s.durationSec).toBe(3.2);
    expect(s.subtitle).toEqual(outline.shots[2].subtitle);
    expect(s.cards).toEqual(outline.shots[2].cards);
    expect(o.shots.filter((x) => x.source.kind === "generate")).toHaveLength(2);
  });
  it("footage: reuses a segment once the unused ones run out", () => {
    const o = fillWithFootage(outline, [2, 3, 6], profiles);
    expect(o.shots.every((x) => x.source.kind === "clip")).toBe(true);
  });
  it("cut: drops the failed shots and keeps the cover on a valid shot", () => {
    const o = cutShots({ ...outline, cover: { shot: 5, atSec: 1 } }, [3]);
    expect(o.shots).toHaveLength(outline.shots.length - 1);
    expect(o.shots[2]).toBe(outline.shots[3]);
    expect(o.cover?.shot).toBe(4);
  });
  it("the agent line follows the reply language", () => {
    expect(continueText("retry", [3], "en")).toBe("Retrying shot 3, then I'll finish the edit.");
    expect(continueText("footage", [2, 3], "en")).toBe("Filling shots 2 and 3 with your footage and finishing the edit.");
    expect(continueText("cut", [3], "zh")).toBe("去掉第 3 镜,接着剪。");
  });
});

describe("other ways to recover a failed shot", () => {
  it("another model: only the failed shot gets the Seedance 2.0 Fast label, and delivery / View prompt show it", () => {
    const o = withModel(outline, [3]);
    const src = o.shots[2].source;
    expect(src.kind === "generate" && src.model).toBe("Seedance 2.0 Fast");
    const other = o.shots[1].source;
    expect(other.kind === "generate" && other.model).toBeUndefined();
    expect(reelCost(o)).toBe(reelCost(outline));
    expect(deliveryNotes(o, DATA.en.brief.brief, profiles).usage[1]).toMatch(/^Shot 3 · Seedance 2\.0 Fast · /);
    expect(reelPrompts(o).find((p) => p.title === "Shot 3 · AI")?.meta).toMatch(/^Seedance 2\.0 Fast/);
  });
  it("different reference: drops the reference images and last frame of the failed shot only", () => {
    const o = withoutRefs(outline, [6]);
    const src = o.shots[5].source;
    expect(src.kind === "generate" && src.refs).toBeUndefined();
    expect(src.kind === "generate" && src.lastFrame).toBeUndefined();
    const kept = o.shots[2].source;
    expect(kept.kind === "generate" && kept.refs?.length).toBe(1);
  });
  it("animate a product photo: a still of the product image with a push-in, same length and words, no longer an AI shot", () => {
    const o = animatePhoto(outline, [3], profiles);
    expect(o.shots[2].source).toEqual({ kind: "clip", clipIndex: 1, inSec: 0, outSec: outline.shots[2].durationSec });
    expect(o.shots[2].treatment?.motion).toBe("push-in");
    expect(o.shots[2].subtitle).toEqual(outline.shots[2].subtitle);
    expect(o.shots[2].durationSec).toBe(outline.shots[2].durationSec);
    expect(reelCost(o)).toBe(reelCost(outline) - 50);
    expect(animatePhoto(outline, [3], profiles.filter((p) => p.kind !== "image"))).toBe(outline);
  });
});

describe("rewrite after a moderation failure", () => {
  it("strips the reference, face and logo wording, adds a safety line, and says what it removed", () => {
    const shot6 = outline.shots[5].source;
    const r = rewritePrompt(shot6.kind === "generate" ? shot6.prompt : "");
    expect(r.after).not.toMatch(/@Image/);
    expect(r.after).toMatch(/No identifiable faces, no brand logos or trademarks\.$/);
    expect(r.removed).toContain("the reference image");
    const p = promptRewrite(outline, [2], "en");
    expect(p.text).toBe("I removed the reference image and the close-up of a face that may have tripped the check. Here's the new prompt for shot 2:");
    expect(p.items).toHaveLength(1);
    expect(p.items[0].shot).toBe(2);
    expect(p.cost).toBe(50);
    expect(promptRewrite(DATA.zh.outline, [2], "zh").text).toBe("我去掉了可能触发审核的参考图和人脸特写。第 2 镜的新 prompt:");
  });
  it("is deterministic", () => {
    expect(promptRewrite(outline, [3], "en")).toEqual(promptRewrite(outline, [3], "en"));
  });
  it("applying the (edited) prompt writes it back and drops the references", () => {
    const o = applyPrompts(outline, [{ shot: 3, before: "x", after: "my new prompt" }]);
    const src = o.shots[2].source;
    expect(src.kind === "generate" && src.prompt).toBe("my new prompt");
    expect(src.kind === "generate" && src.refs).toBeUndefined();
    expect(o.shots[1]).toBe(outline.shots[1]);
  });
});

describe("voiceover failure", () => {
  it("busy: Retry (recommended, priced) / another voice / skip", () => {
    const q = voiceFailureQuestion(outline);
    expect(q.title).toBe("The voiceover didn't generate. How should I continue?");
    expect(q.defaults).toEqual(["retry"]);
    expect(q.options).toEqual([
      { value: "retry", label: "Retry the voiceover", description: `Generate it again · ${voiceCost(outline)} credits` },
      { value: "voice", label: "Try another voice", description: "Nova · same cost" },
      { value: "skip", label: "Skip the voiceover", description: "Subtitles and music only · no credits" },
    ]);
    expect(voiceCost(outline)).toBe(30);
  });
  it("script: Rewrite the script (recommended) first", () => {
    const q = voiceFailureQuestion(outline, "script");
    expect(q.defaults).toEqual(["rewrite"]);
    expect(q.options.map((o) => o.label)).toEqual(["Rewrite the script and retry", "Try another voice", "Skip the voiceover"]);
  });
  it("another voice keeps language and gender where it can", () => {
    expect(otherVoice("warm-f")).toEqual({ id: "bright-f", label: "Nova" });
    expect(otherVoice("cn-f")).toEqual({ id: "cn-m", label: "Chen" });
    expect(otherVoice("warm-female").id).toBe("bright-f");
    expect(voiceFailureQuestion(DATA.zh.outline).options[1].description).toBe("Chen · same cost");
    expect(withVoice(outline, "bright-f").voiceover).toMatchObject({ on: true, voice: "bright-f" });
  });
  it("skip keeps the words as subtitles and drops the voiceover cost", () => {
    const o = withoutVoiceover(outline);
    expect(voiceLines(o)).toEqual([]);
    expect(o.shots.map((s) => s.subtitle.text)).toEqual(outline.shots.map((s) => s.subtitle.text));
    expect(reelCost(o)).toBe(reelCost(outline) - 30);
  });
  it("rewrite the script swaps risky words, shows them, and writes back line by line", () => {
    const p = scriptRewrite(outline, voiceLines(outline), "en");
    expect(p.text).toBe("I swapped out “impossible”, “perfect” and “1 full serum bottle” that may have tripped the check. Here's the new script:");
    expect(p.cost).toBe(30);
    expect(p.items[0].after.split("\n")).toContain("Rellet mist sprays an even fine mist");
    const o = applyScript(outline, p.items[0].after);
    expect(voiceLines(o)).toEqual(p.items[0].after.split("\n"));
    /* 行数少了:剩下的句子保留原句 */
    expect(voiceLines(applyScript(outline, "Only one line")).slice(0, 2)).toEqual(["Only one line", voiceLines(outline)[1]]);
  });
  it("the agent lines for the voice choices follow the reply language", () => {
    expect(continueText("voice", [], "en", "Nova")).toBe("Redoing the voiceover with Nova, then I'll finish the edit.");
    expect(continueText("skip", [], "zh")).toBe("这次不要配音,用字幕和音乐接着剪。");
    expect(continueText("model", [3], "en")).toBe("Retrying shot 3 with Seedance 2.0 Fast, then I'll finish the edit.");
  });
});
