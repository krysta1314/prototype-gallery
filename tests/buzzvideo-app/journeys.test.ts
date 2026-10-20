import { describe, expect, it } from "vitest";
import { JOURNEYS, buildPreset } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/journeys";
import { surfaceOf } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/surface";
import { NOTES } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/notes";

const landing = (id: string) => {
  const { state, nav } = buildPreset(JOURNEYS.find((x) => x.id === id)!);
  return surfaceOf(state, nav);
};

describe("journeys", () => {
  it("ids are unique", () => expect(new Set(JOURNEYS.map((j) => j.id)).size).toBe(JOURNEYS.length));
  it.each(JOURNEYS.map((j) => [j.id, j] as const))("%s lands on a surface that has notes", (_id, j) => {
    const { state, nav } = buildPreset(j);
    const key = surfaceOf(state, nav);
    expect(NOTES[key], key).toBeDefined();
  });
  it("lands each key journey on the right surface", () => {
    expect(landing("first-paywall")).toBe("plans");
    expect(landing("exit-offer")).toBe("exitOffer");
    expect(landing("login")).toBe("perm-tracking");
    expect(landing("video-locked")).toBe("plans");
    expect(landing("promo-popup")).toBe("promo");
    expect(landing("low-member")).toBe("sheet-topUp");
    expect(landing("rating")).toBe("rating");
    expect(landing("marketing-optin")).toBe("marketingOptIn");
    expect(landing("invite")).toBe("inviteFriends");
  });
  it("the region journey turns the web link off", () => {
    const { state } = buildPreset(JOURNEYS.find((x) => x.id === "region-other")!);
    expect(state.region).toBe("other");
  });
});

describe("review nav tree", () => {
  it("lists every journey exactly once, at most 4 levels deep", async () => {
    const { NAV_TREE, navLeaves, navPathOf } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/navTree");
    const leaves = navLeaves(NAV_TREE);
    expect(new Set(leaves).size).toBe(leaves.length);
    // mapOnly 的旅程只在旅程图里出现，不进菜单
    expect([...leaves].filter((id) => !id.startsWith("@")).sort()).toEqual(JOURNEYS.filter((j) => !j.mapOnly).map((j) => j.id).sort());
    for (const id of leaves) expect((navPathOf(id) ?? []).length).toBeLessThanOrEqual(3);
  });
});

describe("user journey maps", () => {
  it("each journey map covers every journey of its module, and every node / edge is valid", async () => {
    const { FLOWS } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/flows");
    const { NAV_TREE, navLeaves, isPage } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/navTree");
    for (const [pageId, flow] of Object.entries(FLOWS)) {
      const module = NAV_TREE.find((m) => navLeaves(m.children).includes(pageId))!;
      const nodes = flow.sections.flatMap((s) => s.nodes);
      // 变体组里的每张截图也算出现过
      const ids = new Set(nodes.flatMap((n) => [n.id, ...(n.variants ?? []).map((v) => v.id)]));
      for (const leaf of navLeaves(module.children).filter((l) => !isPage(l))) expect(ids.has(leaf), `${pageId} misses ${leaf}`).toBe(true);
      for (const n of nodes) {
        if (n.variants) for (const v of n.variants) expect(JOURNEYS.some((j) => j.id === v.id), v.id).toBe(true);
        else if (!n.text && !n.screen && !n.decision) expect(JOURNEYS.some((j) => j.id === n.id), n.id).toBe(true);
      }
      for (const s of flow.sections) for (const e of s.edges) expect(s.nodes.some((n) => n.id === e.from) && s.nodes.some((n) => n.id === e.to), `${e.from}→${e.to}`).toBe(true);
      // 同一格不能放两个节点(下面检查);mapOnly 旅程必须出现在某张旅程图里(不然就看不到了)

      const cells = nodes.map((n) => `${flow.sections.findIndex((s) => s.nodes.includes(n))}:${n.col},${n.row}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });
});

describe("map-only journeys", () => {
  it("every map-only journey appears in some journey map", async () => {
    const { FLOWS } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/flows");
    const ids = new Set(Object.values(FLOWS).flatMap((f) => f.sections.flatMap((s) => s.nodes.flatMap((n) => [n.id, ...(n.variants ?? []).map((v) => v.id)]))));
    for (const j of JOURNEYS.filter((x) => x.mapOnly)) expect(ids.has(j.id), j.id).toBe(true);
  });
});

describe("events page", () => {
  it("every event belongs to a nav module, so the summary page shows all of them", async () => {
    const { EVENTS } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/events");
    const { NAV_TREE } = await import("@/app/prototypes/(app-mvp)/buzzvideo-app/review/navTree");
    const labels = new Set(NAV_TREE.map((m) => m.label));
    for (const e of EVENTS) expect(labels.has(e.module), `${e.name}: ${e.module}`).toBe(true);
  });
});
