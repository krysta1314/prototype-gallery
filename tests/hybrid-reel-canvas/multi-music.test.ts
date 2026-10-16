import { describe, expect, it } from "vitest";
import { addMusic, musicClips, removeAsset, withMusic, type Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";

const base = (over: Partial<Project> = {}): Project =>
  ({
    v: 1,
    assets: [],
    clips: [],
    subtitleStyle: "classic",
    musicId: null,
    musicVol: 60,
    voiceVol: 100,
    originalOn: true,
    aspect: "9:16",
    autoLayout: false,
    editor: { x: 0, y: 0 },
    bgmPrompt: "",
    creditsPerShot: 50,
    spentCredits: 0,
    ...over,
  }) as Project;

describe("music track with several songs", () => {
  it("reads an old single-song project as one segment", () => {
    expect(musicClips(base({ musicId: "m-pop", musicIn: 2, musicOut: 10, musicShift: 1 }))).toEqual([
      { id: "music-0", src: "m-pop", from: 2, to: 10, shift: 1 },
    ]);
  });
  it("the first song starts at 0 and runs its own length", () => {
    const p = addMusic(base(), "m-bright", 15);
    expect(musicClips(p)).toMatchObject([{ src: "m-bright", from: 0, to: 2, shift: 0 }]);
    expect(p.musicId).toBe("m-bright");
  });
  it("adding another song appends it after the last one (never replaces)", () => {
    const p = addMusic(addMusic(base(), "m-bright", 15), "m-bright", 15);
    const [a, b] = musicClips(p);
    expect(a).toMatchObject({ from: 0, to: 2 });
    expect(b).toMatchObject({ src: "m-bright", from: 2, to: 4, shift: 2 });
  });
  it("an old 'play to the end' song is closed at the reel end before appending", () => {
    const p = addMusic(base({ musicId: "m-bright" }), "m-bright", 12);
    expect(musicClips(p).map((c) => [c.from, c.to])).toEqual([[0, 12], [12, 14]]);
  });
  it("deleting a node takes its segments off the track", () => {
    let p = base({ assets: [{ id: "up", kind: "audio", origin: "upload", label: "x", durationSec: 9, aspect: 2, status: "ready", x: 0, y: 0 }] });
    p = addMusic(addMusic(p, "m-pop", 10), "up", 10);
    p = removeAsset(p, "up");
    expect(musicClips(p).map((m) => m.src)).toEqual(["m-pop"]);
  });
  it("keeps segments sorted and mirrors the first one into musicId", () => {
    const p = withMusic(base(), [
      { id: "b", src: "m-calm", from: 6, shift: 6 },
      { id: "a", src: "m-pop", from: 0, to: 6, shift: 0 },
    ]);
    expect(p.music?.map((m) => m.id)).toEqual(["a", "b"]);
    expect(p.musicId).toBe("m-pop");
  });
});
