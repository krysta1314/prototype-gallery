import { describe, expect, it } from "vitest";
import { NO_FILTERS, assetsFor, filterAssets, myAssets, sortAssets, teamAssets, type AssetItem } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/assets";
import { INITIAL_STATE, storeReducer as r, type StoreState } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { LIBRARY_ASSETS, TEAM_ASSETS } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const personal = (): StoreState => r(INITIAL_STATE, { type: "signIn" });
const org = (): StoreState => r(personal(), { type: "setWorkspace", workspace: "presslogic" });

describe("myAssets", () => {
  it("mixes AI jobs and uploads, newest first", () => {
    const s = personal();
    const items = myAssets(s);
    const ids = items.map((x) => x.id);
    expect(ids).toContain("j-latte");
    expect(ids).toContain("la-1");
    const stamps = items.map((x) => x.modifiedAt);
    expect(stamps).toEqual([...stamps].sort((a, b) => b - a));
  });
  it("only shows the current workspace's items", () => {
    expect(myAssets(personal()).some((x) => x.id === "j-opening")).toBe(false);
    const ids = myAssets(org()).map((x) => x.id);
    expect(ids).toContain("j-opening");
    expect(ids).not.toContain("j-latte");
    expect(ids).not.toContain("la-1");
  });
  it("a freshly submitted job sorts first and is an AI running item", () => {
    let s = r(personal(), { type: "setComposer", patch: { text: "poster for my cafe", mode: "image" } });
    s = r(s, { type: "submitPrompt", id: "jn" });
    const first = myAssets(s)[0];
    expect(first).toMatchObject({ id: "jn", source: "ai", type: "image", status: "running", jobId: "jn" });
  });
  it("uploads appear as Upload-source items with progress, pdf as doc", () => {
    const s = r(personal(), {
      type: "addAttachments",
      items: [
        { id: "u1", uri: "x.jpg", kind: "photo" },
        { id: "u2", uri: "", kind: "pdf" },
      ],
    });
    const items = myAssets(s);
    expect(items[0].modifiedAt).toBeGreaterThan(items[items.length - 1].modifiedAt);
    const u1 = items.find((x) => x.id === "u1")!;
    const u2 = items.find((x) => x.id === "u2")!;
    expect(u1).toMatchObject({ source: "upload", type: "image", status: "uploading", progress: 0 });
    expect(u2.type).toBe("doc");
  });
  it("maps modes to types: agent and video are videos, audio stays audio", () => {
    const items = myAssets(personal());
    expect(items.find((x) => x.id === "j-latte")!.type).toBe("video");
    expect(items.find((x) => x.id === "j-jingle")!.type).toBe("audio");
    expect(items.find((x) => x.id === "j-serum")!.status).toBe("failed");
  });
  it("reflects favorites", () => {
    const s = r(personal(), { type: "toggleFavorite", id: "j-serum" });
    expect(myAssets(s).find((x) => x.id === "j-serum")!.favorite).toBe(true);
    expect(myAssets(personal()).find((x) => x.id === "j-serum")!.favorite).toBe(false);
  });
});

describe("teamAssets", () => {
  it("is empty in the personal space and lists other members' work in an org", () => {
    expect(teamAssets(personal())).toEqual([]);
    const items = teamAssets(org());
    expect(items).toHaveLength(TEAM_ASSETS.length);
    expect(items.every((x) => !!x.author)).toBe(true);
    expect(items.map((x) => x.id)).not.toContain("j-opening");
  });
  it("My and Team never overlap", () => {
    const s = org();
    const mine = new Set(assetsFor(s, "my").map((x) => x.id));
    expect(assetsFor(s, "team").some((x) => mine.has(x.id))).toBe(false);
  });
});

describe("filterAssets / sortAssets", () => {
  const items: AssetItem[] = [
    { id: "a", source: "ai", type: "video", title: "a", cover: "", status: "done", progress: 1, favorite: true, modifiedAt: 1 },
    { id: "b", source: "upload", type: "image", title: "b", cover: "", status: "done", progress: 1, favorite: false, modifiedAt: 3 },
    { id: "c", source: "ai", type: "image", title: "c", cover: "", status: "done", progress: 1, favorite: true, modifiedAt: 2 },
  ];
  it("sorts by last modified descending, stable on ties", () => {
    expect(sortAssets(items).map((x) => x.id)).toEqual(["b", "c", "a"]);
    const tie = [items[0], { ...items[0], id: "a2" }];
    expect(sortAssets(tie).map((x) => x.id)).toEqual(["a", "a2"]);
  });
  it("filters by favorites, type, source, and combinations", () => {
    expect(filterAssets(items, NO_FILTERS)).toHaveLength(3);
    expect(filterAssets(items, { ...NO_FILTERS, favorites: true }).map((x) => x.id)).toEqual(["a", "c"]);
    expect(filterAssets(items, { ...NO_FILTERS, type: "image" }).map((x) => x.id)).toEqual(["b", "c"]);
    expect(filterAssets(items, { ...NO_FILTERS, source: "upload" }).map((x) => x.id)).toEqual(["b"]);
    expect(filterAssets(items, { favorites: true, type: "image", source: "ai" }).map((x) => x.id)).toEqual(["c"]);
    expect(filterAssets(items, { ...NO_FILTERS, type: "audio" })).toEqual([]);
  });
  it("seeded favorites make the Favorites filter non-empty in both scopes", () => {
    const f = { ...NO_FILTERS, favorites: true };
    expect(assetsFor(personal(), "my", f).length).toBeGreaterThan(0);
    expect(assetsFor(org(), "team", f).length).toBeGreaterThan(0);
    expect(LIBRARY_ASSETS.length).toBeGreaterThan(0);
  });
});
