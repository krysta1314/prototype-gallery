import { describe, it, expect } from "vitest";
import {
  AGENT_JUMPS,
  MODULES,
  PAGE_OF,
  TOOLS,
  firstPlaceholder,
  menuAction,
  type AgentMode,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";

const items = MODULES.flatMap((m) => m.groups.flat().map((i) => ({ ...i, module: m.key })));

/* Monica 2026-11-04 批准的跳 Agent 清单(调研第 4 轮):Image → Image Gen、Video → Video Gen、Audio → Marketing Agent(没有 Audio Gen) */
const EXPECTED: Record<string, AgentMode> = {
  "Text to Image": "image",
  "Image Edit": "image",
  "Product Photography": "marketing",
  Relight: "image",
  "Image Face Swap": "image",
  "Remove Background": "image",
  /* 2026-11-05 Monica 定:Image 菜单只有 Upscale Image 有自己的页面，其余全走 Agent(Resize & Expand 页面已删) */
  "Resize & Expand": "marketing",
  "Remove Object": "marketing",
  Inpaint: "image",
  "Virtual Try-On": "image",
  "Model Swap": "image",
  "Photo Angle Editor": "image",
  "Image to Video": "video",
  "Text to Video": "video",
  "URL to Video": "video",
  "Video Edit": "video",
  "Video Resize": "marketing",
  /* 2026-11-06:Audio 菜单 5 项全部进 Audio Gen */
  "AI Voiceover": "audio",
  "Background Music": "audio",
  "Voice Clone": "audio",
  "Sound Effects": "audio",
  /* 2026-11-06:UGC Avatar、Product Avatar 进 Marketing Agent */
  "UGC Avatar": "marketing",
  "Product Avatar": "marketing",
};

describe("menu item actions", () => {
  it("every menu item is exactly one of: live tool page / agent jump / coming soon", () => {
    for (const i of items) {
      const kinds = [!!i.tool, !!i.agent].filter(Boolean).length;
      expect(kinds, i.label).toBeLessThanOrEqual(1);
      const a = menuAction(i);
      if (i.tool) expect(a, i.label).toEqual({ kind: "tool", tool: i.tool });
      else if (i.agent) expect(a.kind, i.label).toBe("agent");
      else expect(a, i.label).toEqual({ kind: "soon" });
    }
  });

  it("agent-jump items are exactly the approved list, with the right mode", () => {
    const jumps = Object.fromEntries(items.filter((i) => i.agent).map((i) => [i.label, i.agent!.mode]));
    expect(jumps).toEqual(EXPECTED);
    expect(Object.keys(AGENT_JUMPS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("Audio menu: every item opens Audio Gen with a preselected model (no audio tool pages)", () => {
    const audio = items.filter((i) => i.module === "audio");
    expect(audio.map((i) => i.label)).toEqual(["AI Voiceover", "Background Music", "Voice Clone", "Sound Effects"]);
    for (const i of audio) {
      expect(i.tool, i.label).toBeUndefined();
      expect(i.agent?.mode, i.label).toBe("audio");
      expect(i.agent && "audioModel" in i.agent && i.agent.audioModel, i.label).toBeTruthy();
    }
    expect(AGENT_JUMPS["Background Music"]).toMatchObject({ audioModel: "eleven-music-v2.5" });
    expect(AGENT_JUMPS["Sound Effects"]).toMatchObject({ audioModel: "eleven-sfx-v3" });
  });

  it("every agent jump has a non-empty English prompt with a [placeholder], and carries its source tool", () => {
    for (const i of items.filter((x) => x.agent)) {
      const p = i.agent!.prompt;
      expect(p.trim().length, i.label).toBeGreaterThan(20);
      /* Remove Background 用 Monica 给的固定原句，没有 [占位](打开时光标放在末尾) */
      if (i.label !== "Remove Background") expect(p, i.label).toMatch(/\[[^\]]+\]/);
      expect(p, i.label).toMatch(/^[\x20-\x7E–]+$/); // 英文,无中文
      expect(menuAction(i), i.label).toEqual({ kind: "agent", jump: { ...i.agent!, from: i.label } });
    }
  });

  it("Image menu: only Upscale Image opens its own page, everything else goes to the agent", () => {
    const image = items.filter((i) => i.module === "image");
    expect(image.filter((i) => i.tool).map((i) => i.tool)).toEqual(["upscale"]);
    for (const i of image.filter((x) => !x.tool)) expect(menuAction(i).kind, i.label).toBe("agent");
    /* 要多步处理的进 Marketing Agent,其余进 Image Gen */
    expect(image.filter((i) => i.agent?.mode === "marketing").map((i) => i.label)).toEqual(["Resize & Expand", "Product Photography", "Remove Object"]);
    /* 原来的工具页还在(开发原型直达地址不失效),只是菜单不再进去 */
    expect(PAGE_OF["remove-object"]).toBe(PAGE_OF.inpaint);
    expect(TOOLS["model-swap"].href).toBe("/prototypes/ai-tools/virtual-try-on?mode=model-swap");
  });

  it("URL to Video opens Wan 3.0 Omni Reference; Video Edit opens Edit Video", () => {
    expect(AGENT_JUMPS["URL to Video"]).toMatchObject({ mode: "video", videoModel: "wan-3.0", videoMode: "omni" });
    expect(AGENT_JUMPS["Video Edit"]).toMatchObject({ mode: "video", videoModel: "seedance-2.5", videoMode: "edit" });
  });

  it("prompts are short enough to edit in place", () => {
    for (const [k, j] of Object.entries(AGENT_JUMPS)) {
      if (k === "Remove Background") continue;
      expect(j.prompt.length, k).toBeLessThanOrEqual(110);
    }
  });

  it("image edit prompts still say what must not change", () => {
    for (const k of ["Resize & Expand", "Image Edit", "Product Photography", "Inpaint", "Virtual Try-On", "Model Swap", "Relight", "Photo Angle Editor", "Image Face Swap"] as const)
      expect(AGENT_JUMPS[k].prompt, k).toMatch(/keep|don't/i);
  });

  it("live tools keep their pages; the rest stay Coming soon for now", () => {
    const soon = items.filter((i) => menuAction(i).kind === "soon").map((i) => i.label);
    expect(soon.sort()).toEqual(
      [
        // 生成类专项能力：ai-tools 里 Coming soon,video-gen-modes 里切到 MiniMax H3 Max 的对应模式
        "Camera Control", "Video Styles",
      ].sort(),
    );
    /* 5 个 Image 工具页改走 Agent 后，菜单里不再有入口 */
    expect(items.filter((i) => i.tool)).toHaveLength(Object.keys(TOOLS).length - 5);
  });
});

describe("firstPlaceholder", () => {
  it("returns the range of the first [bracket], brackets included", () => {
    const p = "Swap the face in [my photo] with [reference face].";
    const r = firstPlaceholder(p)!;
    expect(p.slice(r[0], r[1])).toBe("[my photo]");
    expect(firstPlaceholder("a [b: c / d] and [e]")).toEqual([2, 12]);
  });
  it("null when there is no placeholder", () => {
    expect(firstPlaceholder("no placeholder here")).toBeNull();
  });
});
