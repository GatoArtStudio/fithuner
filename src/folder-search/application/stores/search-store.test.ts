import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchMatch, SearchSummary } from "../../domain/entities/search";
import type { SearchGateway } from "../ports/search-gateway";
import { createSearchStore } from "./search-store";

const found = (name: string): SearchMatch => ({
  path: `/home/${name}`,
  name,
  relativeFolder: "",
  kind: "file",
  sizeInBytes: 1,
  modifiedAtMillis: null,
});

const summary: SearchSummary = { totalMatches: 2, scannedEntries: 10, isTruncated: false, wasCancelled: false };

function setup(currentDirectory: string | null = "/home") {
  let counter = 0;
  const gateway: SearchGateway = {
    startSearch: vi.fn().mockImplementation(async () => `search-${++counter}`),
    cancelSearch: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  };
  const store = createSearchStore({ gateway, currentDirectoryPath: () => currentDirectory, debounceMillis: 200 });
  return { store, gateway };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function typeAndSettle(store: ReturnType<typeof setup>["store"], text: string) {
  store.getState().setText(text);
  await vi.advanceTimersByTimeAsync(200);
}

describe("search store", () => {
  it("waits for the user to stop typing before searching", async () => {
    const { store, gateway } = setup();

    store.getState().setText("r");
    store.getState().setText("re");
    await vi.advanceTimersByTimeAsync(150);
    expect(gateway.startSearch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60);

    expect(gateway.startSearch).toHaveBeenCalledOnce();
    expect(gateway.startSearch).toHaveBeenCalledWith({ root: "/home", text: "re", includeHidden: false, kindFilter: "all" });
    expect(store.getState().status).toEqual({ type: "searching" });
  });

  it("collects streamed matches and selects the first one", async () => {
    const { store } = setup();
    await typeAndSettle(store, "rep");

    store.getState().handleEvent({ type: "matches", searchId: "search-1", matches: [found("a"), found("b")] });
    store.getState().handleEvent({ type: "matches", searchId: "search-1", matches: [found("c")] });

    expect(store.getState().matches.map((match) => match.name)).toEqual(["a", "b", "c"]);
    expect(store.getState().selectedPath).toBe("/home/a");
  });

  it("finishes with the summary", async () => {
    const { store } = setup();
    await typeAndSettle(store, "rep");

    store.getState().handleEvent({ type: "finished", searchId: "search-1", summary, error: null });

    expect(store.getState().status).toEqual({ type: "done", summary });
  });

  it("shows an error from the backend", async () => {
    const { store } = setup();
    await typeAndSettle(store, "rep");

    store.getState().handleEvent({
      type: "finished",
      searchId: "search-1",
      summary,
      error: { kind: "permissionDenied", message: "Permission denied" },
    });

    expect(store.getState().status).toMatchObject({ type: "error", error: { kind: "permissionDenied" } });
  });

  it("cancels the running search when a new one starts and ignores its late events", async () => {
    const { store, gateway } = setup();
    await typeAndSettle(store, "rep");

    await typeAndSettle(store, "report");
    store.getState().handleEvent({ type: "matches", searchId: "search-1", matches: [found("stale")] });

    expect(gateway.cancelSearch).toHaveBeenCalledWith("search-1");
    expect(store.getState().matches).toEqual([]);
  });

  it("replays events that arrive before the search id is known", async () => {
    const { store, gateway } = setup();
    let resolveStart: (id: string) => void = () => {};
    vi.mocked(gateway.startSearch).mockImplementationOnce(() => new Promise((resolve) => (resolveStart = resolve)));
    store.getState().setText("rep");
    await vi.advanceTimersByTimeAsync(200);

    store.getState().handleEvent({ type: "matches", searchId: "search-9", matches: [found("early")] });
    resolveStart("search-9");
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().matches.map((match) => match.name)).toEqual(["early"]);
  });

  it("cancels a search whose id arrives after the user already typed something else", async () => {
    const { store, gateway } = setup();
    let resolveFirst: (id: string) => void = () => {};
    vi.mocked(gateway.startSearch).mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)));
    await typeAndSettle(store, "rep");

    await typeAndSettle(store, "report");
    resolveFirst("late-search");
    await vi.advanceTimersByTimeAsync(0);

    expect(gateway.cancelSearch).toHaveBeenCalledWith("late-search");
  });

  it("restarts immediately when the filter or the hidden switch change", async () => {
    const { store, gateway } = setup();
    await typeAndSettle(store, "rep");

    store.getState().setKindFilter("images");
    await vi.advanceTimersByTimeAsync(0);
    store.getState().toggleIncludeHidden();
    await vi.advanceTimersByTimeAsync(0);

    const calls = vi.mocked(gateway.startSearch).mock.calls;
    expect(calls[calls.length - 1][0]).toMatchObject({ kindFilter: "images", includeHidden: true });
  });

  it("goes back to idle and cancels when the text is cleared", async () => {
    const { store, gateway } = setup();
    await typeAndSettle(store, "rep");
    store.getState().handleEvent({ type: "matches", searchId: "search-1", matches: [found("a")] });

    await typeAndSettle(store, "");

    expect(gateway.cancelSearch).toHaveBeenCalledWith("search-1");
    expect(store.getState()).toMatchObject({ status: { type: "idle" }, matches: [], selectedPath: null });
  });

  it("does not search without a current folder", async () => {
    const { store, gateway } = setup(null);

    await typeAndSettle(store, "rep");

    expect(gateway.startSearch).not.toHaveBeenCalled();
  });

  it("reports a search that cannot be started", async () => {
    const { store, gateway } = setup();
    vi.mocked(gateway.startSearch).mockRejectedValueOnce({ kind: "notFound", message: "Gone" });

    await typeAndSettle(store, "rep");

    expect(store.getState().status).toMatchObject({ type: "error", error: { kind: "notFound" } });
  });

  it("moves the selection through the results without leaving the list", async () => {
    const { store } = setup();
    await typeAndSettle(store, "rep");
    store.getState().handleEvent({ type: "matches", searchId: "search-1", matches: [found("a"), found("b")] });

    store.getState().moveSelection(1);
    store.getState().moveSelection(1);
    expect(store.getState().selectedPath).toBe("/home/b");

    store.getState().moveSelection(-5);
    expect(store.getState().selectedPath).toBe("/home/a");
  });

  it("starts at once when opened with text and resets everything when closed", async () => {
    const { store, gateway } = setup();

    store.getState().open("holiday");
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState()).toMatchObject({ isOpen: true, text: "holiday" });
    expect(gateway.startSearch).toHaveBeenCalledOnce();

    store.getState().close();
    expect(gateway.cancelSearch).toHaveBeenCalledWith("search-1");
    expect(store.getState()).toMatchObject({ isOpen: false, text: "", matches: [] });
  });
});
