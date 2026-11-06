import { describe, it, expect } from "vitest";
import { NOTES, VIEW_LABEL } from "../../src/app/prototypes/(v1.12)/ai-tools/review/notes";
import { COMING_SOON, MODULES, TOOLS, UPSCALE_ITEM, UPSCALE_TOOL_HREF } from "../../src/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";

const labels = (key: string) => MODULES.find((m) => m.key === key)!.groups.map((g) => g.map((i) => i.label));

describe("sidebar modules", () => {
  it("four modules in order: Image / Video / Audio / Avatar", () => {
    expect(MODULES.map((m) => m.label)).toEqual(["Image", "Video", "Audio", "Avatar"]);
  });

  it("menus: basic generation first, then the rest by ad usage → demand → competitor coverage", () => {
    expect(labels("image")).toEqual([
      ["Text to Image", "Image Edit"],
      ["Remove Background", "Resize & Expand", "Product Photography", "Remove Object", UPSCALE_ITEM, "Inpaint", "Virtual Try-On", "Model Swap", "Relight", "Photo Angle Editor", "Image Face Swap"],
    ]);
    expect(labels("video")).toEqual([
      ["Image to Video", "Text to Video"],
      ["URL to Video", "Video Resize", "Video Edit", "Upscale Video", "Motion Control", "3D to Video", "Video Character Swap", "Camera Control", "Video Styles"],
    ]);
    expect(labels("audio")).toEqual([["AI Voiceover", "Background Music"], ["Voice Clone", "Sound Effects"]]);
    expect(labels("avatar")).toEqual([["UGC Avatar"], ["Product Avatar", "Talking Avatar", "Lip Sync"]]);
  });

  it("URL to Video uses the Link icon", () => {
    const item = MODULES.flatMap((m) => m.groups.flat()).find((i) => i.label === "URL to Video");
    expect(item?.icon).toBe("Link");
  });

  it("seven menu items have pages (Image menu keeps only Upscale Image; agent jumps and Coming soon: see agent-jump.test.ts)", () => {
    const built = MODULES.flatMap((m) => m.groups.flat()).filter((i) => i.href);
    expect(built.map((i) => [i.label, i.tool, i.href])).toEqual([
      [UPSCALE_ITEM, "upscale", UPSCALE_TOOL_HREF],
      ["Upscale Video", "video-upscale", "/prototypes/ai-tools/video-upscale"],
      ["Motion Control", "motion-control", "/prototypes/ai-tools/motion-control"],
      ["3D to Video", "render-3d", "/prototypes/ai-tools/render-3d"],
      ["Video Character Swap", "character-swap", "/prototypes/ai-tools/character-swap"],
      ["Talking Avatar", "talking-avatar", "/prototypes/ai-tools/talking-avatar"],
      ["Lip Sync", "lip-sync", "/prototypes/ai-tools/lip-sync"],
    ]);
    expect(Object.keys(TOOLS)).toHaveLength(12);
    expect(new Set(built.map((i) => i.href!.split("?")[0])).size).toBe(7);
    expect(COMING_SOON).toBe("Coming soon in this prototype");
  });

  it("every built menu item matches its TOOLS entry (label, module, href)", () => {
    for (const m of MODULES) {
      for (const i of m.groups.flat().filter((x) => x.tool)) {
        expect(TOOLS[i.tool!]).toEqual({ label: i.label, module: m.key, href: i.href });
      }
    }
  });
});

describe("review notes", () => {
  it("one set of notes per view: 主页 / 画布", () => {
    expect(Object.keys(NOTES).sort()).toEqual(["canvas", "home"]);
    expect(VIEW_LABEL).toEqual({ home: "主页", canvas: "画布" });
  });

  it("every section has a title, a description and rules", () => {
    for (const view of ["home", "canvas"] as const) {
      expect(NOTES[view].length, view).toBeGreaterThan(0);
      for (const n of NOTES[view]) {
        expect(n.title.length, n.title).toBeGreaterThan(0);
        expect(n.what.length, n.title).toBeGreaterThan(0);
        expect(n.rules.length, n.title).toBeGreaterThan(0);
      }
    }
  });

  it("home notes cover the sidebar entry and the tool page, not the old Agent tile entry", () => {
    const text = JSON.stringify(NOTES.home);
    expect(text).toContain("Image › Upscale Image");
    expect(text).toContain("URL to Video");
    expect(text).toContain("Coming soon in this prototype");
    expect(text).not.toContain("放大模式");
    expect(text).not.toContain("Product to Video");
  });

  it("home notes have one section per new tool and say they are live", () => {
    const titles = NOTES.home.map((n) => n.title);
    for (const t of [
      "Remove Object / Inpaint 画笔页", "Virtual Try-On / Model Swap 工具页", "Photo Angle Editor 工具页",
    ])
      expect(titles).toContain(t);
    expect(titles.some((t) => t.startsWith("模型加工类工具页"))).toBe(true);
    const sidebar = JSON.stringify(NOTES.home[0]);
    expect(sidebar).toContain("Image 菜单只有 Upscale Image 有自己的工具页");
    expect(sidebar).toContain("Resize & Expand 工具页已删除");
    expect(titles).not.toContain("Resize & Expand 工具页");
    /* 2026-11-06:Voice Enhancer / Voice Clone 页删除，改进 Audio Gen */
    expect(titles).not.toContain("Voice Enhancer 工具页");
    expect(sidebar).toContain("首页 Audio Gen");
    expect(titles).not.toContain("Product Avatar 工具页");
    expect(titles).not.toContain("Custom Avatar 工具页");
    expect(sidebar).toContain("Avatar › UGC Avatar、Product Avatar(→ Marketing Agent");
  });

  it("home notes state the routing rule and list every agent-jump item", () => {
    const sidebar = JSON.stringify(NOTES.home[0]);
    expect(sidebar).toContain("有专门模型的工具做成独立工具页");
    for (const t of ["Text to Image", "Image Edit", "Product Photography", "Relight", "Image Face Swap", "Image to Video", "Text to Video", "URL to Video", "Video Edit", "Background Music", "Sound Effects"])
      expect(sidebar, t).toContain(t);
    expect(NOTES.home.map((n) => n.title)).toContain("从菜单跳 Marketing Agent");
  });
});
