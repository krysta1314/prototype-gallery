import { describe, expect, it } from "vitest";
import { atLimit, can, exportFormats, limitOf, planForMore, requiredPlan } from "@/app/prototypes/(v1.16)/design-studio/app/entitlements";
import { costOf } from "@/app/prototypes/(v1.16)/design-studio/app/pricing";

describe("design studio entitlements", () => {
  it("gates exports by plan", () => {
    expect(can("starter", "export_pptx")).toBe(false);
    expect(requiredPlan("export_pptx")).toBe("pro");
    expect(exportFormats("free")).toEqual(["png", "jpg"]);
    expect(exportFormats("e1")).toContain("pdf_print");
  });
  it("limits brand kits", () => {
    expect(limitOf("free", "brandKits")).toBe(1);
    expect(limitOf("e1", "brandKits")).toBe(-1);
    expect(atLimit("pro", "brandKits", 3)).toBe(true);
    expect(atLimit("e1", "brandKits", 999)).toBe(false);
    expect(planForMore("starter", "brandKits", 1)).toBe("pro");
    expect(planForMore("ultra", "brandKits", 10)).toBe("e1");
  });
  it("keeps governance in enterprise", () => {
    expect(can("ultra", "approvals")).toBe(false);
    expect(can("e1", "approvals")).toBe(true);
    expect(can("e1", "approval_rules")).toBe(false);
    expect(requiredPlan("approval_rules")).toBe("e2");
  });
  it("prices ai actions", () => {
    expect(costOf("remove_bg")).toBe(2);
    expect(costOf("generate_on_brand", 4)).toBe(24);
    expect(costOf("deck_outline")).toBe(0);
  });
});
