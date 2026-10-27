import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithPreview } from "../test-support";
import { ImagePreview } from "./ImagePreview";
import type { PreviewVariant } from "./ProviderProps";

const target = { path: "/files/photo.png", name: "photo.png", kind: "file" as const, sizeInBytes: 10, modifiedAtMillis: null };

function defineSize(element: HTMLElement, width: number, height: number, properties: [string, string]) {
  Object.defineProperty(element, properties[0], { configurable: true, value: width });
  Object.defineProperty(element, properties[1], { configurable: true, value: height });
}

async function setup(variant: PreviewVariant = "quicklook") {
  await renderWithPreview(<ImagePreview target={target} variant={variant} onOpenExternally={vi.fn()} />);
  const image = screen.getByRole("img", { name: "photo.png" });
  const frame = image.parentElement as HTMLElement;
  defineSize(frame, 400, 300, ["clientWidth", "clientHeight"]);
  defineSize(image, 400, 200, ["offsetWidth", "offsetHeight"]);
  frame.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300 }) as DOMRect;
  return { image, frame };
}

describe("ImagePreview zoom and pan", () => {
  it("starts fitted and explains how to zoom in Quick Look only", async () => {
    const { image } = await setup();
    expect(image.style.transform).toBe("translate(0px, 0px) scale(1)");
    expect(screen.getByText("Scroll to zoom · drag to move")).toBeTruthy();
  });

  it("does not show the hint in the side panel", async () => {
    await setup("panel");
    expect(screen.queryByText("Scroll to zoom · drag to move")).toBeNull();
  });

  it("zooms in with the wheel and shows the percentage", async () => {
    const { image, frame } = await setup();

    fireEvent.wheel(frame, { deltaY: -300, clientX: 200, clientY: 150 });

    expect(image.style.transform).toMatch(/scale\(1\.5\d*\)/);
    expect(screen.getByText(/^1[45]\d%$/)).toBeTruthy();
    expect(screen.queryByText("Scroll to zoom · drag to move")).toBeNull();
  });

  it("zooms out with the wheel", async () => {
    const { image, frame } = await setup();

    fireEvent.wheel(frame, { deltaY: 500, clientX: 200, clientY: 150 });

    expect(Number(/scale\(([\d.]+)\)/.exec(image.style.transform)?.[1])).toBeLessThan(1);
  });

  it("prevents the page from scrolling while zooming", async () => {
    const { frame } = await setup();

    expect(fireEvent.wheel(frame, { deltaY: -100 })).toBe(false);
  });

  it("moves a zoomed image when dragging and stops at the edges", async () => {
    const { image, frame } = await setup();
    fireEvent.wheel(frame, { deltaY: -462, clientX: 200, clientY: 150 });
    const zoomed = image.style.transform;

    fireEvent.pointerDown(frame, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 130, clientY: 90, pointerId: 1 });

    expect(image.style.transform).not.toBe(zoomed);
    expect(image.style.transform).toContain("translate(30px, -10px)");
    expect(frame.getAttribute("data-panning")).toBe("true");

    fireEvent.pointerMove(frame, { clientX: 5000, clientY: 5000, pointerId: 1 });
    fireEvent.pointerUp(frame, { pointerId: 1 });

    expect(frame.getAttribute("data-panning")).toBe("false");
    const [, x, y] = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(image.style.transform) ?? [];
    expect(Number(x)).toBeLessThan(400);
    expect(Number(y)).toBeLessThan(300);
  });

  it("does not move an image that fits", async () => {
    const { image, frame } = await setup();

    fireEvent.pointerDown(frame, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 160, clientY: 160, pointerId: 1 });

    expect(image.style.transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("goes back to fit with a double click or the Fit button", async () => {
    const { image, frame } = await setup();

    fireEvent.wheel(frame, { deltaY: -300, clientX: 200, clientY: 150 });
    fireEvent.doubleClick(frame);
    expect(image.style.transform).toBe("translate(0px, 0px) scale(1)");

    fireEvent.wheel(frame, { deltaY: -300, clientX: 200, clientY: 150 });
    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(image.style.transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("ignores buttons other than the main one for panning", async () => {
    const { frame } = await setup();

    fireEvent.pointerDown(frame, { button: 2, clientX: 0, clientY: 0, pointerId: 1 });

    expect(frame.getAttribute("data-panning")).toBe("false");
  });
});
