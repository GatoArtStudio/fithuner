import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";
import { usePreviewResource } from "./usePreviewResource";

describe("usePreviewResource", () => {
  it("is idle without a key", () => {
    const { result } = renderHook(() => usePreviewResource(null, vi.fn()));

    expect(result.current).toEqual({ status: "idle" });
  });

  it("loads the resource and exposes it", async () => {
    const { result } = renderHook(() => usePreviewResource("a", async () => "content"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: "content" }));
  });

  it("reports failures with their message", async () => {
    const { result } = renderHook(() =>
      usePreviewResource("a", () => Promise.reject({ kind: "notFound", message: "It vanished" })),
    );

    await waitFor(() => expect(result.current).toEqual({ status: "error", message: "It vanished" }));
  });

  it("ignores a slow response for a key that is no longer current", async () => {
    let resolveSlow: (value: string) => void = () => {};
    const loaders: Record<string, () => Promise<string>> = {
      slow: () => new Promise((resolve) => (resolveSlow = resolve)),
      fast: async () => "fast result",
    };
    const { result, rerender } = renderHook(({ key }) => usePreviewResource(key, loaders[key]), {
      initialProps: { key: "slow" },
    });

    rerender({ key: "fast" });
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: "fast result" }));
    await act(async () => resolveSlow("slow result"));

    expect(result.current).toEqual({ status: "ready", data: "fast result" });
  });
});

describe("useDebouncedValue", () => {
  it("only propagates the last value after the delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    rerender({ value: "c" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe("c");
    vi.useRealTimers();
  });
});
