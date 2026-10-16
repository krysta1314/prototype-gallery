import { describe, expect, it } from "vitest";
import { DEFAULT_OPTS, buildPreset, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import { addedText, mergeProfiles, redoCost, redoText } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/followup";
import { shotCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { INITIAL_STATE, agentReducer } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import type { ClipProfile } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const DATA = RELLET as unknown as FixtureData;
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);

describe("send failure (spec #19)", () => {
  it("keeps the failed message in the chat and removes it on retry", () => {
    const s1 = agentReducer(INITIAL_STATE, { type: "sendFailed", userId: "u1", text: "hello" });
    expect(s1.messages.at(-1)).toEqual({ id: "u1", kind: "user", text: "hello", failed: true });
    expect(s1.queue).toEqual([]);
    const s2 = agentReducer(s1, { type: "resent", userId: "u1" });
    expect(s2.messages.some((m) => m.id === "u1")).toBe(false);
  });
  it("review step ends with a failed user bubble", () => {
    const last = preset("sendFailed").state.messages.at(-1);
    expect(last).toMatchObject({ kind: "user", failed: true });
  });
});

describe("adding footage in the chat (spec #17)", () => {
  it("appends a files row and merges files / media", () => {
    const s = agentReducer(INITIAL_STATE, { type: "filesAdded", id: "f1", files: [{ name: "a.mp4", url: "u", kind: "video" }], media: [{ key: "k", url: "u" }] });
    expect(s.files).toHaveLength(1);
    expect(s.media).toHaveLength(1);
    expect(s.messages.at(-1)).toMatchObject({ id: "f1", kind: "files" });
  });
  it("dedupes profiles by label", () => {
    const p = (label: string) => ({ label }) as ClipProfile;
    expect(mergeProfiles([p("a"), p("b")], [p("b"), p("c")]).map((x) => x.label)).toEqual(["a", "b", "c"]);
  });
  it("says it will re-plan only when a plan exists", () => {
    expect(addedText(1, true, "en")).toMatch(/updated storyboard/);
    expect(addedText(2, false, "en")).toMatch(/2 new files/);
  });
  it("review step supersedes the first plan with a new one", () => {
    const { state, items } = preset("addFootage");
    const plans = state.messages.filter((m) => m.kind === "plan");
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({ superseded: true });
    expect(state.messages.some((m) => m.kind === "files" && m.files[0]?.name === "mist-closeup.mp4")).toBe(true);
    expect(items.at(-1)?.name).toBe("mist-closeup.mp4");
  });
});

describe("redo a shot (spec #20)", () => {
  it("charges one shot per picked shot", () => {
    const reel = preset("reel").state.messages.find((m) => m.kind === "reel");
    if (reel?.kind !== "reel") throw new Error("no reel");
    expect(redoCost(reel.outline, [2, 3])).toBe(shotCost(reel.outline) * 2);
    expect(redoCost(reel.outline, [])).toBe(0);
  });
  it("names the shots in the agent line", () => {
    expect(redoText([3], "en")).toBe("Redoing shot 3 and keeping everything else, then I'll re-cut the reel.");
    expect(redoText([2, 5], "en")).toMatch(/shots 2 and 5/);
    expect(redoText([2, 5], "zh")).toMatch(/第 2、5 镜/);
  });
});
