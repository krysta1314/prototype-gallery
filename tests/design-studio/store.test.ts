import { describe, expect, it } from "vitest";
import { BRAND_KITS, EXTRACTED_KIT, initialDesigns, recolor, talkPost } from "@/app/prototypes/(v1.16)/design-studio/app/data";
import { addBrandKit, afterEdit, applyPlanToKits, approve, brandCheck, canExport, fixIssues, setFormat, submitForApproval } from "@/app/prototypes/(v1.16)/design-studio/app/store";

describe("design studio store", () => {
  it("blocks brand kits over the plan limit", () => {
    expect(addBrandKit(BRAND_KITS, EXTRACTED_KIT, "pro")).toEqual({ ok: false, reason: "limit" });
    const r = addBrandKit(BRAND_KITS, EXTRACTED_KIT, "ultra");
    expect(r.ok && r.kits.length).toBe(4);
  });
  it("makes kits over the limit read-only after a downgrade", () => {
    expect(applyPlanToKits(BRAND_KITS, "free").map((k) => !!k.readOnly)).toEqual([false, true, true]);
  });
  it("binds approval to a version", () => {
    const d = initialDesigns()[0];
    const approved = approve(submitForApproval(d));
    expect(canExport(approved, true)).toBe(true);
    const edited = afterEdit(approved);
    expect(edited.approval.status).toBe("draft");
    expect(canExport(edited, true)).toBe(false);
    expect(canExport(edited, false)).toBe(true);
  });
  it("flags and fixes foreign brand logos and off-brand colours", () => {
    const d = initialDesigns()[0];
    d.pages[0].layers[0] = { ...d.pages[0].layers[0], foreignBrand: "GirlStyle" };
    d.pages[0].layers[3] = { ...d.pages[0].layers[3], color: "#7c3aed" };
    expect(brandCheck(d, BRAND_KITS[0])).toHaveLength(2);
    expect(brandCheck(fixIssues(d, BRAND_KITS[0]), BRAND_KITS[0])).toHaveLength(0);
  });
  it("switches format in place and keeps locks", () => {
    const d = setFormat(initialDesigns()[0], "story");
    expect(d.type).toBe("story");
    expect(d.ratio).toBeCloseTo(9 / 16);
    expect(d.pages[0].layers.find((l) => l.name === "Headline")?.lock).toBe("position");
  });
  it("recolours layers when the brand changes", () => {
    const [bf, gs] = BRAND_KITS;
    const out = recolor(talkPost(bf), bf, gs);
    expect(out.find((l) => l.name === "CTA pill")?.fill).toBe("#F4C9D6");
    expect(out.find((l) => l.name === "Headline")?.color).toBe("#7A1F3D");
  });
});
