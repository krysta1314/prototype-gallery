import { describe, expect, it } from "vitest";
import { countFor, filterPrototypes, platformOf, versionChips } from "@/lib/gallery";
import { PROTOTYPES, type Prototype } from "@/lib/prototypes";

const base = { desc: "", date: "2026-09-01", href: "/x" };
const LIST: Prototype[] = [
  { ...base, slug: "web-a", title: "Web A", version: "v1.13" },
  { ...base, slug: "web-b", title: "Web B", version: "v1.3" },
  { ...base, slug: "web-pinned", title: "Index", version: "v1.11", pinned: true },
  { ...base, slug: "app-a", title: "BuzzVideo APP", version: "APP MVP", platform: "app" },
];

describe("platformOf", () => {
  it("treats a missing platform as web", () => {
    expect(platformOf(LIST[0])).toBe("web");
    expect(platformOf(LIST[3])).toBe("app");
  });
});

describe("filterPrototypes", () => {
  it("only returns prototypes of the selected platform", () => {
    expect(filterPrototypes(LIST, { platform: "app", version: "all", query: "" }).map((p) => p.slug)).toEqual(["app-a"]);
    expect(filterPrototypes(LIST, { platform: "web", version: "all", query: "" }).map((p) => p.slug)).toEqual([
      "web-pinned",
      "web-a",
      "web-b",
    ]);
  });
  it("filters by version and the shipped group", () => {
    expect(filterPrototypes(LIST, { platform: "web", version: "v1.13", query: "" }).map((p) => p.slug)).toEqual(["web-a"]);
    expect(filterPrototypes(LIST, { platform: "web", version: "shipped", query: "" }).map((p) => p.slug)).toEqual(["web-b"]);
  });
  it("searches title, desc and slug", () => {
    expect(filterPrototypes(LIST, { platform: "app", version: "all", query: "buzzvideo" }).map((p) => p.slug)).toEqual(["app-a"]);
    expect(filterPrototypes(LIST, { platform: "web", version: "all", query: "buzzvideo" })).toEqual([]);
  });
});

describe("versionChips", () => {
  it("web keeps its versions and the shipped chip, app has its own versions", () => {
    expect(versionChips("web")).toContain("shipped");
    expect(versionChips("web")).not.toContain("APP MVP");
    expect(versionChips("app")).toEqual(["all", "APP MVP"]);
  });
});

describe("countFor", () => {
  it("counts per platform", () => {
    expect(countFor(LIST, "web", "all")).toBe(3);
    expect(countFor(LIST, "app", "all")).toBe(1);
    expect(countFor(LIST, "app", "APP MVP")).toBe(1);
  });
});

describe("PROTOTYPES", () => {
  it("lists the BuzzVideo APP prototype under the app platform", () => {
    const app = PROTOTYPES.find((p) => p.slug === "buzzvideo-app");
    expect(app).toMatchObject({ platform: "app", version: "APP MVP", href: "/prototypes/buzzvideo-app" });
  });
});
