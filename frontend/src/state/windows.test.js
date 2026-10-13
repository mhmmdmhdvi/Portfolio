import { describe, expect, it } from "vitest";
import { windowReducer, initialWindowState } from "./windows.js";

const open = (state, appId = "explorer") =>
  windowReducer(state, {
    type: "open",
    appId,
    bounds: { x: 100, y: 80, width: 900, height: 600 },
  });

describe("window lifecycle", () => {
  it("restores an existing app instead of opening a duplicate", () => {
    let state = open(initialWindowState);
    state = windowReducer(state, { type: "minimize", id: "explorer" });
    state = open(state);
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0].minimized).toBe(false);
    expect(state.activeId).toBe("explorer");
  });

  it("restores the original bounds after maximizing", () => {
    let state = open(initialWindowState);
    state = windowReducer(state, { type: "maximize", id: "explorer" });
    expect(state.windows[0].maximized).toBe(true);
    state = windowReducer(state, { type: "maximize", id: "explorer" });
    expect(state.windows[0].bounds).toEqual({
      x: 100,
      y: 80,
      width: 900,
      height: 600,
    });
    expect(state.windows[0].maximized).toBe(false);
  });

  it("activates the next visible window when the active window closes", () => {
    let state = open(open(initialWindowState), "notepad");
    state = windowReducer(state, { type: "close", id: "notepad" });
    expect(state.activeId).toBe("explorer");
    expect(state.windows.map((window) => window.id)).toEqual(["explorer"]);
  });

  it("keeps minimized windows out of the active stack", () => {
    let state = open(open(initialWindowState), "notepad");
    state = windowReducer(state, { type: "minimize", id: "notepad" });
    expect(state.activeId).toBe("explorer");
    state = windowReducer(state, { type: "minimize", id: "explorer" });
    expect(state.activeId).toBe(null);
  });
});
