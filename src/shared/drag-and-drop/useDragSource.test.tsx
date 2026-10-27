import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DragAndDropProvider } from "./DragAndDropContext";
import { createDragSessionStore } from "./drag-session-store";
import { useDragSource } from "./useDragSource";

function pointer(type: string, clientX: number, clientY: number, init: MouseEventInit = {}) {
  window.dispatchEvent(new MouseEvent(type, { clientX, clientY, ...init }));
}

function setup(canDrop = () => true) {
  const store = createDragSessionStore();
  const onDrop = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DragAndDropProvider store={store} canDrop={canDrop} onDrop={onDrop}>
      {children}
    </DragAndDropProvider>
  );
  const { result } = renderHook(() => useDragSource(), { wrapper });
  document.body.innerHTML = '<div id="folder" data-drop-path="/docs"></div>';
  document.elementFromPoint = vi.fn(() => document.getElementById("folder"));
  return { store, onDrop, beginDrag: result.current };
}

const payload = { paths: ["/a.txt"], label: "a.txt" };
const start = { button: 0, clientX: 0, clientY: 0 };

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDragSource", () => {
  it("does not start a drag before the pointer moves past the threshold", () => {
    const { store, onDrop, beginDrag } = setup();

    act(() => {
      beginDrag(start, payload);
      pointer("pointermove", 2, 1);
      pointer("pointerup", 2, 1);
    });

    expect(store.getState().session).toBeNull();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("drops onto the hovered target as a move", () => {
    const { store, onDrop, beginDrag } = setup();

    act(() => {
      beginDrag(start, payload);
      pointer("pointermove", 40, 40);
    });
    expect(store.getState().session?.hoverPath).toBe("/docs");

    act(() => pointer("pointerup", 40, 40));

    expect(onDrop).toHaveBeenCalledWith({ paths: ["/a.txt"], targetPath: "/docs", isCopy: false });
    expect(store.getState().session).toBeNull();
  });

  it("copies when Ctrl is held", () => {
    const { onDrop, beginDrag } = setup();

    act(() => {
      beginDrag(start, payload);
      pointer("pointermove", 40, 40, { ctrlKey: true });
      pointer("pointerup", 40, 40, { ctrlKey: true });
    });

    expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ isCopy: true }));
  });

  it("ignores targets that cannot accept the dragged items", () => {
    const { store, onDrop, beginDrag } = setup(() => false);

    act(() => {
      beginDrag(start, payload);
      pointer("pointermove", 40, 40);
    });
    expect(store.getState().session?.hoverPath).toBeNull();

    act(() => pointer("pointerup", 40, 40));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("cancels with Escape", () => {
    const { store, onDrop, beginDrag } = setup();

    act(() => {
      beginDrag(start, payload);
      pointer("pointermove", 40, 40);
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      pointer("pointerup", 40, 40);
    });

    expect(store.getState().session).toBeNull();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("only starts with the primary button", () => {
    const { store, beginDrag } = setup();

    act(() => {
      beginDrag({ ...start, button: 2 }, payload);
      pointer("pointermove", 40, 40);
    });

    expect(store.getState().session).toBeNull();
  });
});
