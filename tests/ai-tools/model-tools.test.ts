// 模型加工类工具页(2026-11-05 从 Video Gen 拆出):配置和请求体要和 fal API 对得上。
import { describe, it, expect } from "vitest";
import { MODEL_TOOLS, modelToolSpec } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/specs";
import { blocker, blockerInfo, secsProblem, cost, initialState, requestBody, summaryOf, switchModel, variantOf, visibleInputs, visibleOptions, promptVisible, MY_VOICE, type Media, type ToolState } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";
import { TOOLS } from "../../src/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import { sizeProblem } from "../../src/app/prototypes/(v1.12)/ai-tools/app/components/SourceUpload";

const media = (id: string, kind: Media["kind"], secs?: number): Media => ({ id, name: `${id}`, kind, url: `/${id}`, secs });
const fill = (key: string, files: Record<string, Media[]>, extra: Partial<ToolState> = {}): ToolState => ({ ...initialState(modelToolSpec(key)), files, ...extra });

describe("model tool pages", () => {
  it("has a page and a sidebar entry for each tool", () => {
    expect(MODEL_TOOLS.map((t) => t.key)).toEqual(["motion-control", "character-swap", "render-3d", "lip-sync", "talking-avatar"]);
    for (const t of MODEL_TOOLS) expect(TOOLS[t.key as keyof typeof TOOLS]?.href).toBe(`/prototypes/ai-tools/${t.key}`);
  });

  it("hides the prompt box where the API has no prompt field", () => {
    const avatar = modelToolSpec("talking-avatar");
    expect(promptVisible(variantOf(avatar, "kling-avatar"), initialState(avatar))).toBe(true);
    expect(promptVisible(variantOf(avatar, "h3-max"), switchModel(avatar, initialState(avatar), "h3-max"))).toBe(false);
  });

  it("Lip Sync switches endpoint and fields with What should they say?", () => {
    const spec = modelToolSpec("lip-sync");
    const v = variantOf(spec, "kling-lipsync");
    const audio = fill("lip-sync", { source: [media("v", "video", 6)], speech: [media("a", "audio", 8)] });
    expect(requestBody(v, audio)).toEqual({ endpoint: "fal-ai/kling-video/lipsync/audio-to-video", body: { video_url: "/v", audio_url: "/a" } });
    const typed = fill("lip-sync", { source: [media("v", "video", 6)] }, { opts: { from: "Type a script" } });
    expect(blocker(v, typed)).toBe("Type what they should say.");
    expect(visibleInputs(v, typed).map((i) => i.id)).toEqual(["source"]);
    const body = requestBody(v, { ...typed, prompt: "Try it today." });
    expect(body.endpoint).toBe("fal-ai/kling-video/lipsync/text-to-video");
    expect(body.body).toMatchObject({ video_url: "/v", text: "Try it today.", voice_language: "en", voice_id: "commercial_lady_en_f-v1", voice_speed: 1 });
  });

  it("Motion Control caps the video at 10s when facing like the image, and Standard uses the cheaper endpoint", () => {
    const spec = modelToolSpec("motion-control");
    const v = variantOf(spec, "kling-3.0-motion");
    const s = fill("motion-control", { character: [media("c", "image")], motion: [media("m", "video", 12)] }, { opts: { orientation: "Like the image" } });
    expect(blocker(v, s)).toMatch(/10s/);
    const std = { ...s, opts: { quality: "Standard" } };
    expect(blocker(v, std)).toBeNull();
    expect(requestBody(v, std).endpoint).toBe("fal-ai/kling-video/v3/standard/motion-control");
    expect(cost(spec, v, std)!).toBeLessThan(cost(spec, v, { ...std, opts: {} })!);
  });

  it("Talking Avatar keeps files when switching model and drops options", () => {
    const spec = modelToolSpec("talking-avatar");
    const s = fill("talking-avatar", { photo: [media("p", "image")], voice: [media("a", "audio", 3)] }, { prompt: "smile" });
    const h3 = switchModel(spec, s, "h3-max");
    expect(h3.files.photo?.[0].id).toBe("p");
    expect(h3.prompt).toBe("");
    expect(blocker(variantOf(spec, "h3-max"), h3)).toMatch(/at least 5s/);
    expect(visibleOptions(variantOf(spec, "h3-max"), h3).map((o) => o.id)).toEqual(["transcribe", "resolution"]);
  });

  it("tells missing files apart from bad files (only bad files show a red message)", () => {
    const spec = modelToolSpec("character-swap");
    const v = variantOf(spec, "h3-max");
    expect(blockerInfo(v, fill("character-swap", { source: [media("v", "video", 8)] }))).toMatchObject({ missing: true, input: "people" });
    const long = blockerInfo(v, fill("character-swap", { source: [media("v", "video", 43)], people: [media("p", "image")] }));
    expect(long).toMatchObject({ missing: false, input: "source" });
    expect(long!.message).toMatch(/up to 30s\. v is 43s/);
  });

  it("rejects files that are too big or too long right when they are picked", () => {
    expect(sizeProblem({ name: "big.mp4", size: 245 * 1024 * 1024 }, "video")).toBe("big.mp4 is 245 MB. Videos can be up to 200 MB.");
    expect(sizeProblem({ name: "ok.png", size: 5 * 1024 * 1024 }, "image")).toBeNull();
    const source = variantOf(modelToolSpec("lip-sync"), "kling-lipsync").inputs.find((i) => i.id === "source")!;
    expect(secsProblem(source, { name: "long.mp4", secs: 44 })).toMatch(/up to 10s\. long\.mp4 is 44s/);
    expect(secsProblem(source, { name: "ok.mp4", secs: 8 })).toBeNull();
  });

  it("3D to Video hides Auto Look References once look references are added", () => {
    const spec = modelToolSpec("render-3d");
    const v = variantOf(spec, "h3-max");
    const none = fill("render-3d", { source: [media("v", "video", 8)] });
    expect(visibleOptions(v, none).map((o) => o.id)).toContain("looks");
    const refs = fill("render-3d", { source: [media("v", "video", 8)], refs: [media("r", "image")] });
    expect(visibleOptions(v, refs).map((o) => o.id)).not.toContain("looks");
    expect(requestBody(v, refs).body).not.toHaveProperty("max_generated_reference_images");
  });

});

describe("model tool pages: review fixes", () => {
  it("says why when a file's length can't be read", () => {
    const spec = modelToolSpec("lip-sync");
    const s = fill("lip-sync", { source: [media("clip.mov", "video")], speech: [media("a", "audio", 8)] });
    expect(blocker(variantOf(spec, s.model), s)).toMatch(/couldn't read how long clip\.mov is/);
  });

  it("uses readable English for missing inputs", () => {
    const swap = modelToolSpec("character-swap");
    expect(blocker(variantOf(swap, "h3-max"), fill("character-swap", { source: [media("v", "video", 10)] }))).toBe("Add a photo of each new person.");
    const r3d = modelToolSpec("render-3d");
    expect(blocker(variantOf(r3d, "h3-max"), fill("render-3d", {}))).toBe("Add a 3D render.");
  });
});

describe("model tool pages: UI review (2026-11-05)", () => {
  it("summaries read as plain English, not raw option values", () => {
    const spec = modelToolSpec("motion-control");
    const v = variantOf(spec, "kling-3.0-motion");
    expect(summaryOf(spec, v, initialState(spec))).toBe("Faces like the video · Pro quality · Original sound kept");
  });


  it("Lip Sync folds language into the voice", () => {
    const v = variantOf(modelToolSpec("lip-sync"), "kling-lipsync");
    const typed = fill("lip-sync", { source: [media("v", "video", 6)] }, { opts: { from: "Type a script", voice: "UK man" }, prompt: "Hi" });
    expect(visibleOptions(v, typed).map((o) => o.id)).toEqual(["from", "voice", "speed"]);
    expect(requestBody(v, typed).body).toMatchObject({ voice_id: "uk_man2", voice_language: "en" });
  });

  it("Lip Sync with a cloned voice reads the script first, then syncs the audio", () => {
    const v = variantOf(modelToolSpec("lip-sync"), "kling-lipsync");
    const voices = [{ id: "vc-1", name: "Mia", model: "minimax-voice-clone", sample: "/a" }];
    const s = fill("lip-sync", { source: [media("v", "video", 6)] }, { opts: { from: "Type a script", voice: `${MY_VOICE}vc-1` }, prompt: "Try it today." });
    const req = requestBody(v, s, voices);
    expect(req.endpoint).toBe("fal-ai/kling-video/lipsync/audio-to-video");
    expect(req.body).toEqual({ video_url: "/v", audio_url: "<audio from step 1>" });
    expect(req.before).toEqual({ endpoint: "fal-ai/minimax/speech-02-hd", body: { text: "Try it today.", voice_setting: { voice_id: "vc-1", speed: 1 } } });
    expect(summaryOf(modelToolSpec("lip-sync"), v, s, voices)).toBe("Kling LipSync · Typed script · Mia");
  });

  it("Lip Sync also offers MiniMax H3 Max video lip sync (audio only, 5s–15 min, 480p/768p)", () => {
    const spec = modelToolSpec("lip-sync");
    expect(spec.models.map((m) => m.key)).toEqual(["kling-lipsync", "h3-max-lipsync"]);
    const v = variantOf(spec, "h3-max-lipsync");
    expect(v.inputs.find((i) => i.id === "source")!.secs).toEqual([5, 900]);
    expect(v.options.map((o) => o.id)).toEqual(["fit", "resolution"]);
    const s = { ...switchModel(spec, initialState(spec), "h3-max-lipsync"), files: { source: [media("v", "video", 20)], speech: [media("a", "audio", 18)] } };
    expect(requestBody(v, s)).toEqual({ endpoint: "minimax/h3-max/lip-sync/video-to-video", body: { video_url: "/v", audio_url: "/a", duration_mode: "cut_off", resolution: "768P" } });
  });

  it("Talking Avatar's MiniMax blurb says what it does on this page", () => {
    expect(variantOf(modelToolSpec("talking-avatar"), "h3-max").blurb).toBe("Long talking videos from one photo, up to 15 min. Sharp output up to 2K.");
  });
});
