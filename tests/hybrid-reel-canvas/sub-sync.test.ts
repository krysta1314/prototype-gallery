import { describe, expect, it } from "vitest";
import { freeSubAt, layoutClips, syncSubsToVoice, type Asset, type Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";

const asset = (id: string, kind: Asset["kind"] = "video"): Asset => ({ id, kind, origin: "upload", label: id, url: `blob:${id}`, durationSec: 6, aspect: 9 / 16, status: "ready", x: 0, y: 0 });

const project = (over: Partial<Project> = {}): Project => ({
  v: 1,
  assets: [asset("a"), asset("b"), asset("vo", "audio")],
  clips: [
    { id: "c-0", assetId: "a", role: "hook", inSec: 0, outSec: 4, speed: 1, muted: false, subtitle: "old words", subtitleSource: "authored" },
    { id: "c-1", assetId: "b", role: "usage", inSec: 0, outSec: 4, speed: 1, muted: false, subtitle: "keep me", subtitleSource: "stt" },
  ],
  voice: [
    { id: "v-0", assetId: "vo", clipId: "c-0", at: 0, len: 1.5, text: "Dry skin?", url: "blob:v0" },
    { id: "v-1", assetId: "vo", clipId: "c-0", at: 0, len: 1, offset: 2, text: "Try this.", url: "blob:v1" },
  ],
  subtitleStyle: "classic",
  musicId: null,
  musicVol: 60,
  voiceVol: 100,
  originalOn: true,
  aspect: "9:16",
  autoLayout: true,
  editor: { x: 0, y: 0 },
  bgmPrompt: "",
  creditsPerShot: 50,
  spentCredits: 0,
  ...over,
});

describe("subtitles follow the voiceover automatically", () => {
  it("replaces the words and timing on shots with a generated voiceover, leaves the rest", () => {
    const p = syncSubsToVoice(project());
    expect(p.clips[0]).toMatchObject({ subtitle: "Dry skin? Try this.", subIn: 0, subOut: 3 });
    expect(p.clips[1]).toMatchObject({ subtitle: "keep me", subtitleSource: "stt" });
    expect(p.subsVoiceKey).toBeDefined();
  });
  it("skips muted or ungenerated lines", () => {
    const base = project();
    const muted = syncSubsToVoice({ ...base, voice: base.voice!.map((v) => ({ ...v, muted: true })) });
    expect(muted.clips[0].subtitle).toBe("old words");
    const none = syncSubsToVoice({ ...base, voice: base.voice!.map((v) => ({ ...v, url: undefined })) });
    expect(none).toBe(none);
    expect(none.clips[0].subtitle).toBe("old words");
  });
  it("gives each free-standing voiceover its own subtitle and clears the shots it covers", () => {
    const base = project();
    const p = syncSubsToVoice({
      ...base,
      assets: [...base.assets.filter((a) => a.id !== "vo"), { ...base.assets[2], prompt: "Dry skin?", url: "blob:vo" }, { ...base.assets[2], id: "vo2", prompt: "Try this spray.", url: "blob:vo2" }],
      voice: [
        { id: "v-a", assetId: "vo", at: 0, len: 1.5 },
        { id: "v-b", assetId: "vo2", at: 2, len: 1.5 },
      ],
    });
    expect(p.voice!.map((v) => v.sub)).toEqual(["Dry skin?", "Try this spray."]);
    expect(p.clips[0].subtitle).toBe("");
    expect(p.clips[1].subtitle).toBe("keep me");
    expect(freeSubAt(p, layoutClips(p.clips).segs, 2.5)?.text).toBe("Try this spray.");
    expect(freeSubAt(p, layoutClips(p.clips).segs, 1.8)).toBeUndefined();
  });

});
