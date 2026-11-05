import { describe, it, expect } from "vitest";
import { NOTES } from "../../src/app/prototypes/(v1.12)/video-gen-modes/review/notes";
import { MODE_LABEL, MODELS } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";

const all = [...NOTES.home, ...NOTES.canvas];
const text = all.map((s) => [s.title, s.what, ...s.rules, ...(s.errors ?? [])].join("\n")).join("\n");

describe("review notes", () => {
  it("has filled sections for both views", () => {
    expect(NOTES.home.length).toBeGreaterThanOrEqual(5);
    expect(NOTES.canvas.length).toBeGreaterThanOrEqual(2);
    for (const s of all) {
      expect(s.title.trim()).not.toBe("");
      expect(s.what.trim()).not.toBe("");
      expect(s.rules.length).toBeGreaterThan(0);
    }
  });
  it("mentions every mode and every model by its product name", () => {
    for (const l of Object.values(MODE_LABEL)) expect(text).toContain(`「${l}」`);
    for (const m of MODELS) expect(text).toContain(m.label);
  });
});
