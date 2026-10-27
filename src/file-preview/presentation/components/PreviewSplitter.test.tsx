import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewSplitter } from "./PreviewSplitter";

function renderSplitter(position: "right" | "bottom", sizePx = 340) {
  const onResize = vi.fn();
  render(
    <div style={{ width: 1000, height: 600 }}>
      <aside>
        <PreviewSplitter position={position} sizePx={sizePx} onResize={onResize} />
      </aside>
    </div>,
  );
  return { onResize, separator: screen.getByRole("separator") };
}

describe("PreviewSplitter", () => {
  it("grows a right panel with ArrowLeft and shrinks it with ArrowRight", () => {
    const { onResize, separator } = renderSplitter("right", 400);

    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(onResize).toHaveBeenNthCalledWith(1, 416);
    expect(onResize).toHaveBeenNthCalledWith(2, 384);
  });

  it("uses the vertical arrows for a bottom panel", () => {
    const { onResize, separator } = renderSplitter("bottom", 300);

    fireEvent.keyDown(separator, { key: "ArrowUp" });

    expect(onResize).toHaveBeenCalledWith(316);
  });

  it("never goes below the minimum size", () => {
    const { onResize, separator } = renderSplitter("right", 200);

    fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(onResize).toHaveBeenCalledWith(200);
  });

  it("describes its orientation for assistive technology", () => {
    const { separator } = renderSplitter("bottom");

    expect(separator.getAttribute("aria-orientation")).toBe("horizontal");
    expect(separator.getAttribute("aria-valuenow")).toBe("340");
  });
});
