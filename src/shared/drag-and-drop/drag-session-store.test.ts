import { describe, expect, it } from "vitest";
import { createDragSessionStore } from "./drag-session-store";

const session = { label: "a.txt", itemCount: 1, x: 0, y: 0, hoverPath: null, isCopy: false };

describe("drag session store", () => {
  it("starts, updates and ends a session", () => {
    const store = createDragSessionStore();

    store.getState().begin(session);
    store.getState().update({ x: 5, hoverPath: "/docs" });
    expect(store.getState().session).toMatchObject({ x: 5, hoverPath: "/docs", label: "a.txt" });

    store.getState().end();
    expect(store.getState().session).toBeNull();
  });

  it("ignores updates when there is no session", () => {
    const store = createDragSessionStore();

    store.getState().update({ x: 5 });

    expect(store.getState().session).toBeNull();
  });
});
