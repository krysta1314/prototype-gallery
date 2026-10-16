import { describe, expect, it } from "vitest";
import { activateEditor, newEditorWith, sliceAssetIds, sliceOf, type Asset, type Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";

const asset = (id: string, kind: Asset["kind"] = "video", over: Partial<Asset> = {}): Asset => ({
  id,
  kind,
  origin: "upload",
  label: id,
  url: `blob:${id}`,
  durationSec: 6,
  aspect: 9 / 16,
  status: "ready",
  x: 0,
  y: 0,
  ...over,
});

const project = (over: Partial<Project> = {}): Project => ({
  v: 1,
  assets: [asset("a"), asset("b"), asset("m", "audio")],
  clips: [{ id: "c-0", assetId: "a", role: "usage", inSec: 0, outSec: 5, speed: 1, muted: false, subtitle: "Hi", subtitleSource: "stt" }],
  subtitleStyle: "classic",
  musicId: "m",
  musicVol: 60,
  voiceVol: 100,
  originalOn: true,
  aspect: "9:16",
  autoLayout: true,
  editor: { x: 100, y: 50 },
  bgmPrompt: "calm",
  creditsPerShot: 50,
  spentCredits: 120,
  ...over,
});

describe("multiple Video Editor nodes", () => {
  it("node + → Video Editor makes a new editor with just that node and parks the old one", () => {
    const p = newEditorWith(project(), "b");
    expect(p.editorName).toBe("Video Editor 2");
    expect(p.clips.map((c) => c.assetId)).toEqual(["b"]);
    expect(p.musicId).toBeNull();
    expect(p.editor.y).toBeGreaterThan(50);
    expect(p.autoLayout).toBe(false);
    /* 整张画布共用的不动 */
    expect(p.assets).toHaveLength(3);
    expect(p.spentCredits).toBe(120);
    expect(p.parked).toHaveLength(1);
    expect(p.parked![0]).toMatchObject({ id: "editor-1", name: "Video Editor", editor: { x: 100, y: 50 } });
    expect(p.parked![0].slice.clips[0].assetId).toBe("a");
    expect(p.parked![0].slice.musicId).toBe("m");
  });

  it("an audio node becomes the new editor's background music", () => {
    const p = newEditorWith(project(), "m");
    expect(p.clips).toEqual([]);
    expect(p.musicId).toBe("m");
  });

  it("switching swaps timelines and positions both ways", () => {
    const two = newEditorWith(project(), "b");
    const back = activateEditor(two, "editor-1");
    expect(back.editorName).toBe("Video Editor");
    expect(back.editor).toEqual({ x: 100, y: 50 });
    expect(back.clips[0].assetId).toBe("a");
    expect(back.musicId).toBe("m");
    expect(back.parked!.map((e) => e.name)).toEqual(["Video Editor 2"]);
    expect(back.parked![0].slice.clips[0].assetId).toBe("b");
    /* 再切回去还是同一个 */
    const again = activateEditor(back, two.editorId!);
    expect(again.clips[0].assetId).toBe("b");
    expect(sliceOf(again)).toEqual(sliceOf(two));
  });

  it("a third editor is numbered 3 and stacked below", () => {
    const two = newEditorWith(project(), "b");
    const three = newEditorWith(two, "a");
    expect(three.editorName).toBe("Video Editor 3");
    expect(three.parked).toHaveLength(2);
    expect(three.editor.y).toBeGreaterThan(two.editor.y);
  });

  it("knows which nodes a parked editor uses (for the edges)", () => {
    const two = newEditorWith(project(), "b");
    expect([...sliceAssetIds(two.parked![0].slice)].sort()).toEqual(["a", "m"]);
    expect([...sliceAssetIds(sliceOf(two))]).toEqual(["b"]);
  });
});
