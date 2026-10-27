import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createUndoStore } from "../../application/stores/undo-store";
import { UndoProvider } from "../context/UndoContext";
import { useUndoShortcuts } from "./useUndoShortcuts";

function Harness({ isBlocked }: { isBlocked: boolean }) {
  useUndoShortcuts(isBlocked);
  return <input aria-label="field" />;
}

function setup(isBlocked = false) {
  const ok = { succeeded: [], failed: [] };
  const gateway = {
    moveEntries: vi.fn().mockResolvedValue(ok),
    trashEntries: vi.fn().mockResolvedValue(ok),
    restoreEntries: vi.fn().mockResolvedValue(ok),
  };
  const store = createUndoStore({ gateway, afterChange: vi.fn(), notify: vi.fn() });
  store.getState().record({ type: "rename", from: "/a", to: "/b" });
  const wrapper = (children: ReactNode) => <UndoProvider store={store}>{children}</UndoProvider>;
  const view = render(wrapper(<Harness isBlocked={isBlocked} />));
  return { store, gateway, input: view.getByLabelText("field") };
}

async function press(init: KeyboardEventInit, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", { cancelable: true, bubbles: true, ...init });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("useUndoShortcuts", () => {
  it("undoes with Ctrl+Z and redoes with Ctrl+Shift+Z or Ctrl+Y", async () => {
    const { gateway } = setup();

    const undoEvent = await press({ key: "z", ctrlKey: true });
    expect(gateway.moveEntries).toHaveBeenLastCalledWith([{ from: "/b", to: "/a" }]);
    expect(undoEvent.defaultPrevented).toBe(true);

    await press({ key: "Z", ctrlKey: true, shiftKey: true });
    expect(gateway.moveEntries).toHaveBeenLastCalledWith([{ from: "/a", to: "/b" }]);

    await press({ key: "z", ctrlKey: true });
    await press({ key: "y", ctrlKey: true });
    expect(gateway.moveEntries).toHaveBeenCalledTimes(4);
  });

  it("leaves Ctrl+Z to text fields", async () => {
    const { gateway, input } = setup();

    const event = await press({ key: "z", ctrlKey: true }, input);

    expect(gateway.moveEntries).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores plain Z and other modifiers", async () => {
    const { gateway } = setup();

    await press({ key: "z" });
    await press({ key: "z", ctrlKey: true, altKey: true });
    await press({ key: "y", ctrlKey: true, shiftKey: true });

    expect(gateway.moveEntries).not.toHaveBeenCalled();
  });

  it("does nothing while blocked", async () => {
    const { gateway } = setup(true);

    await press({ key: "z", ctrlKey: true });

    expect(gateway.moveEntries).not.toHaveBeenCalled();
  });
});
