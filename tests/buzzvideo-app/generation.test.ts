import { describe, expect, it } from "vitest";
import {
  STEP_MS,
  THINKING,
  beatsFrom,
  durationLabel,
  isPlanning,
  renderStartMs,
  stepStatuses,
  storyboardFrames,
} from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/generation";
import { GENERATION_MS, type Job } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { SEED_JOBS } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const job = (patch: Partial<Job>): Job => ({ ...SEED_JOBS[0], status: "running", elapsedMs: 0, ...patch });

describe("thinking steps", () => {
  it("agent plans in Research → Script → Storyboard → Render", () => {
    expect(THINKING.agent.steps.map((s) => s.label)).toEqual(["Research", "Script", "Storyboard", "Render"]);
  });
  it("render starts after every planning step has had its turn", () => {
    expect(renderStartMs("agent")).toBe(3 * STEP_MS);
    expect(renderStartMs("video")).toBe((THINKING.video.steps.length - 1) * STEP_MS);
    expect(renderStartMs("agent")).toBeLessThan(GENERATION_MS);
  });
  it("lights up one step at a time from elapsedMs", () => {
    expect(stepStatuses(job({ elapsedMs: 0 }))).toEqual(["active", "pending", "pending", "pending"]);
    expect(stepStatuses(job({ elapsedMs: STEP_MS + 1 }))).toEqual(["done", "active", "pending", "pending"]);
    expect(stepStatuses(job({ elapsedMs: 2 * STEP_MS }))).toEqual(["done", "done", "active", "pending"]);
    expect(stepStatuses(job({ elapsedMs: 3 * STEP_MS + 10 }))).toEqual(["done", "done", "done", "active"]);
  });
  it("done jobs have every step done; failed jobs fail at the step they reached", () => {
    expect(stepStatuses(job({ status: "done", elapsedMs: GENERATION_MS }))).toEqual(["done", "done", "done", "done"]);
    expect(stepStatuses(job({ status: "failed", elapsedMs: 3000 }))).toEqual(["done", "done", "done", "failed"]);
    expect(stepStatuses(job({ status: "failed", elapsedMs: 100 }))).toEqual(["failed", "pending", "pending", "pending"]);
  });
  it("is planning only while running and before render starts", () => {
    expect(isPlanning(job({ elapsedMs: 0 }))).toBe(true);
    expect(isPlanning(job({ elapsedMs: renderStartMs("agent") }))).toBe(false);
    expect(isPlanning(job({ status: "failed", elapsedMs: 100 }))).toBe(false);
  });
});

describe("storyboard", () => {
  it("splits 'Hook: ice pour close-up' into a label and a line", () => {
    expect(beatsFrom(["Hook: ice pour close-up", "Scene: morning café"])).toEqual([
      { label: "Hook", text: "ice pour close-up" },
      { label: "Scene", text: "morning café" },
    ]);
  });
  it("frames (no keyword group): result cover as the hook, a related idea as the scene, the user's own photo as the CTA", () => {
    // 提示词没命中关键词组时走品类兜底;命中时见 plan.test.ts
    const frames = storyboardFrames({ ...SEED_JOBS[0], prompt: "Make a 15s vertical ad using these photos" }, ["/x/photo-2.jpg"]);
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe(SEED_JOBS[0].cover);
    expect(frames[1]).toMatch(/usecase-(bakery|ramen)\.jpg$/);
    expect(frames[2]).toBe("/x/photo-2.jpg");
    expect(new Set(frames).size).toBe(3);
  });
  it("never repeats the result's own shot, and still gives three frames without user photos", () => {
    const frames = storyboardFrames(SEED_JOBS[0], []);
    expect(frames).toHaveLength(3);
    expect(new Set(frames).size).toBe(3);
    expect(frames).not.toContain("/prototypes/buzzvideo-app/usecase-latte.jpg");
  });
});

describe("durationLabel", () => {
  it("shows a runtime for video-like results and nothing for images", () => {
    expect(durationLabel("agent")).toBe("0:15");
    expect(durationLabel("video")).toBe("0:08");
    expect(durationLabel("audio")).toBe("0:30");
    expect(durationLabel("image")).toBeNull();
  });
});
