// 模型加工类工具页(2026-11-05 从 Video Gen 拆出):配置和请求体要和 fal API 对得上。
import { describe, it, expect } from "vitest";
import { MODEL_TOOLS, modelToolSpec } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/specs";
import { blocker, cost, initialState, requestBody, summaryOf, switchModel, variantOf, visibleInputs, visibleOptions, promptVisible, MY_VOICE, type Media, type ToolState } from "../../src/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";
import { TOOLS } from "../../src/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";

const media = (id: string, kind: Media["kind"], secs?: number): Media => ({ id, name: `${id}`, kind, url: `/${id}`, secs });
const fill = (key: string, files: Record<string, Media[]>, extra: Partial<ToolState> = {}): ToolState => ({ ...initialState(modelToolSpec(key)), files, ...extra });

describe("model tool pages", () => {
  it("has a page and a sidebar entry for each tool", () => {
    expect(MODEL_TOOLS.map((t) => t.key)).toEqual(["motion-control", "character-swap", "video-relight", "render-3d", "lip-sync", "talking-avatar", "voice-clone"]);
    for (const t of MODEL_TOOLS) expect(TOOLS[t.key as keyof typeof TOOLS]?.href).toBe(`/prototypes/ai-tools/${t.key}`);
  });

  it("hides the prompt box where the API has no prompt field", () => {
    expect(promptVisible(variantOf(modelToolSpec("video-relight"), "h3-max"), initialState(modelToolSpec("video-relight")))).toBe(false);
    const avatar = modelToolSpec("talking-avatar");
    expect(promptVisible(variantOf(avatar, "kling-avatar"), initialState(avatar))).toBe(true);
    expect(promptVisible(variantOf(avatar, "h3-max"), switchModel(avatar, initialState(avatar), "h3-max"))).toBe(false);
  });

  it("Relight always sends aspect_ratio adaptive (the API default is 16:9)", () => {
    const spec = modelToolSpec("video-relight");
    const s = fill("video-relight", { source: [media("v", "video", 8)], light: [media("l", "image")] });
    expect(blocker(variantOf(spec, s.model), s)).toBeNull();
    expect(requestBody(variantOf(spec, s.model), s)).toEqual({
      endpoint: "minimax/h3-max/relight",
      body: { video_url: "/v", reference_image_url: "/l", resolution: "768P", aspect_ratio: "adaptive" },
    });
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

  it("Voice Clone is a flat price per voice", () => {
    const spec = modelToolSpec("voice-clone");
    const s = fill("voice-clone", { sample: [media("a", "audio", 20)] });
    expect(cost(spec, variantOf(spec, s.model), s)).toBe(150);
    const k = switchModel(spec, s, "kling-create-voice");
    expect(cost(spec, variantOf(spec, k.model), k)).toBe(10);
    expect(blocker(variantOf(spec, k.model), { ...k, files: { sample: [media("b", "audio", 40)] } })).toMatch(/up to 30s/);
  });
});

describe("model tool pages: review fixes", () => {
  it("says why when a file's length can't be read", () => {
    const spec = modelToolSpec("video-relight");
    const s = fill("video-relight", { source: [media("clip.mov", "video")], light: [media("l", "image")] });
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
    const vc = modelToolSpec("voice-clone");
    expect(summaryOf(vc, variantOf(vc, "minimax-voice-clone"), initialState(vc))).toBe("MiniMax Voice Clone");
  });

  it("Voice Clone shows its flat price before any upload and has no preview-line field", () => {
    const spec = modelToolSpec("voice-clone");
    const v = variantOf(spec, "minimax-voice-clone");
    expect(cost(spec, v, initialState(spec))).toBe(150);
    expect(promptVisible(v, initialState(spec))).toBe(false);
    expect(spec.consent).toBe("This is my voice.");
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
    expect(summaryOf(modelToolSpec("lip-sync"), v, s, voices)).toBe("Typed script · Mia");
  });
});
