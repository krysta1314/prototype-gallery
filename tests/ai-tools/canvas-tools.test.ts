// 画布上的工具入口(2026-11-06):当前节点填进对的素材位，换模型后还在，结果规则同工具页。
import { describe, it, expect } from "vitest";
import { CANVAS_TOOLS, CANVAS_TOOL_LABEL, canvasPicks, canvasResultUrl, keepNode, nodeInputId, seedState } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/canvasTools";
import { MODEL_TOOLS, modelToolSpec } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/specs";
import { blockerInfo, switchModel, variantOf, type Media } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";

const video: Media = { id: "v1", name: "talk.mp4", kind: "video", url: "/prototypes/ai-tools/samples/talking-clip.mp4", secs: 8 };
const photo: Media = { id: "i1", name: "face.png", kind: "image", url: "/x/face.png" };
const voice: Media = { id: "a1", name: "vo.mp3", kind: "audio", url: "/x/vo.mp3", secs: 12 };

describe("canvas tools", () => {
  it("every model tool page is reachable from a canvas node", () => {
    const onCanvas = [...CANVAS_TOOLS.video, ...CANVAS_TOOLS.image].sort();
    expect(onCanvas).toEqual(MODEL_TOOLS.map((t) => t.key).sort());
    for (const k of onCanvas) expect(CANVAS_TOOL_LABEL[k]).toBeTruthy();
  });

  it("the node fills the matching input", () => {
    expect(nodeInputId(modelToolSpec("lip-sync"), "kling-lipsync", "video")).toBe("source");
    expect(nodeInputId(modelToolSpec("motion-control"), "kling-3.0-motion", "video")).toBe("motion");
    expect(nodeInputId(modelToolSpec("talking-avatar"), "kling-avatar", "image")).toBe("photo");
    expect(seedState("character-swap", video).files.source).toEqual([video]);
  });

  it("the node stays after switching model", () => {
    const spec = modelToolSpec("lip-sync");
    const s = keepNode(spec, switchModel(spec, seedState("lip-sync", video), "h3-max-lipsync"), video);
    expect(s.files.source).toEqual([video]);
  });

  it("Talking Avatar from an image node only needs a voice from the canvas", () => {
    const spec = modelToolSpec("talking-avatar");
    const s = seedState("talking-avatar", photo);
    expect(blockerInfo(variantOf(spec, s.model), s)?.missing).toBe(true);
    const picks = canvasPicks([photo, video, voice], "audio", [photo.id]);
    expect(picks).toEqual([voice]);
    const ready = { ...s, files: { ...s.files, voice: picks } };
    expect(blockerInfo(variantOf(spec, ready.model), ready)).toBeNull();
  });

  it("sample nodes play the tool's demo result, own videos replay themselves", () => {
    expect(canvasResultUrl("lip-sync", video)).toBe(modelToolSpec("lip-sync").demoResult);
    const own = { ...video, url: "blob:abc" };
    expect(canvasResultUrl("lip-sync", own)).toBe("blob:abc");
  });
});
