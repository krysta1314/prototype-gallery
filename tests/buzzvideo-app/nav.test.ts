import { describe, expect, it } from "vitest";
import { INITIAL_NAV, navReducer as r, screenKey, topRoute } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/nav";

describe("navReducer", () => {
  it("opens on the Inspire tab", () => {
    expect(INITIAL_NAV).toEqual({ tab: "inspire", stack: [], sheet: null });
    expect(screenKey(INITIAL_NAV)).toBe("inspire");
  });
  it("pushes and pops full-screen routes", () => {
    let s = r(INITIAL_NAV, { type: "push", route: { name: "useCase", id: "uc-latte" } });
    expect(topRoute(s)).toEqual({ name: "useCase", id: "uc-latte" });
    expect(screenKey(s)).toBe("useCase");
    s = r(s, { type: "pop" });
    expect(topRoute(s)).toBeNull();
  });
  it("switching tab clears the stack and any sheet", () => {
    let s = r(INITIAL_NAV, { type: "push", route: { name: "work", id: "j1" } });
    s = r(s, { type: "sheet", sheet: { name: "share", workId: "j1" } });
    s = r(s, { type: "tab", tab: "create" });
    expect(s).toEqual({ tab: "create", stack: [], sheet: null });
  });
  it("pushing a route closes the open sheet", () => {
    let s = r(INITIAL_NAV, { type: "sheet", sheet: { name: "attach" } });
    s = r(s, { type: "push", route: { name: "camera" } });
    expect(s.sheet).toBeNull();
    expect(screenKey(s)).toBe("camera");
  });
  it("opens, replaces and closes sheets", () => {
    let s = r(INITIAL_NAV, { type: "sheet", sheet: { name: "workMore", workId: "j1" } });
    s = r(s, { type: "sheet", sheet: { name: "report", target: "j1" } });
    expect(s.sheet).toEqual({ name: "report", target: "j1" });
    s = r(s, { type: "closeSheet" });
    expect(s.sheet).toBeNull();
  });
  it("resets", () => {
    const s = r(r(INITIAL_NAV, { type: "tab", tab: "me" }), { type: "reset" });
    expect(s).toEqual(INITIAL_NAV);
  });
});
