import { describe, expect, it } from "vitest";
import { clampPanelSize, panelSizeFromPointer } from "./panel-size";

const container = { left: 200, top: 50, right: 1200, bottom: 650 };

describe("clampPanelSize", () => {
  it("keeps sizes inside the allowed range", () => {
    expect(clampPanelSize(50, 1000)).toBe(200);
    expect(clampPanelSize(400, 1000)).toBe(400);
    expect(clampPanelSize(900, 1000)).toBe(700);
  });

  it("never exceeds the absolute maximum", () => {
    expect(clampPanelSize(5000, 10_000)).toBe(1200);
  });

  it("falls back to the minimum when the container is tiny", () => {
    expect(clampPanelSize(500, 100)).toBe(200);
  });

  it("only applies the absolute limits when the container cannot be measured", () => {
    expect(clampPanelSize(500, 0)).toBe(500);
    expect(clampPanelSize(5000, 0)).toBe(1200);
  });
});

describe("panelSizeFromPointer", () => {
  it("measures a right panel from the right edge of the container", () => {
    expect(panelSizeFromPointer("right", { x: 800, y: 0 }, container)).toBe(400);
  });

  it("measures a bottom panel from the bottom edge of the container", () => {
    expect(panelSizeFromPointer("bottom", { x: 0, y: 400 }, container)).toBe(250);
  });

  it("clamps drags beyond the container", () => {
    expect(panelSizeFromPointer("right", { x: 100, y: 0 }, container)).toBe(700);
    expect(panelSizeFromPointer("right", { x: 1190, y: 0 }, container)).toBe(200);
  });
});
