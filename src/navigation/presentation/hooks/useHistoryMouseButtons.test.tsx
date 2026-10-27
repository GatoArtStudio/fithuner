import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createNavigationStore } from "../../application/stores/navigation-store";
import { NavigationProvider } from "../context/NavigationContext";
import { useHistoryMouseButtons } from "./useHistoryMouseButtons";

function Area({ isBlocked }: { isBlocked: boolean }) {
  return <div data-testid="area" {...useHistoryMouseButtons(isBlocked)} />;
}

async function setup(isBlocked = false) {
  const openDirectory = vi.fn(async (path?: string) => path ?? "/home");
  const store = createNavigationStore({ openDirectory });
  await store.getState().navigateTo("/a");
  await store.getState().navigateTo("/b");
  openDirectory.mockClear();
  render(
    <NavigationProvider store={store}>
      <Area isBlocked={isBlocked} />
    </NavigationProvider>,
  );
  return { openDirectory, area: screen.getByTestId("area") };
}

describe("useHistoryMouseButtons", () => {
  it("goes back with the back button and forward with the forward button", async () => {
    const { openDirectory, area } = await setup();

    fireEvent.mouseUp(area, { button: 3 });
    await vi.waitFor(() => expect(openDirectory).toHaveBeenLastCalledWith("/a"));

    fireEvent.mouseUp(area, { button: 4 });
    await vi.waitFor(() => expect(openDirectory).toHaveBeenLastCalledWith("/b"));
  });

  it("ignores the other mouse buttons", async () => {
    const { openDirectory, area } = await setup();

    fireEvent.mouseUp(area, { button: 0 });
    fireEvent.mouseUp(area, { button: 1 });
    fireEvent.mouseUp(area, { button: 2 });

    expect(openDirectory).not.toHaveBeenCalled();
  });

  it("stops the webview from navigating on its own", async () => {
    const { area } = await setup();

    expect(fireEvent.mouseDown(area, { button: 3 })).toBe(false);
    expect(fireEvent.mouseUp(area, { button: 4 })).toBe(false);
    expect(fireEvent(area, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 3 }))).toBe(false);
    expect(fireEvent.mouseDown(area, { button: 0 })).toBe(true);
  });

  it("does not walk the history while blocked", async () => {
    const { openDirectory, area } = await setup(true);

    fireEvent.mouseUp(area, { button: 3 });

    expect(openDirectory).not.toHaveBeenCalled();
  });
});
