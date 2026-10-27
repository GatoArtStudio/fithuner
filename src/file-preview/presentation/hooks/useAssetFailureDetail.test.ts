import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAssetFailureDetail } from "./useAssetFailureDetail";

afterEach(() => vi.unstubAllGlobals());

describe("useAssetFailureDetail", () => {
  it("does nothing while the asset has not failed", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAssetFailureDetail("asset://x", false));

    expect(result.current).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [403, "Fithuner is not allowed to read this file (HTTP 403)"],
    [404, "The file could not be found (HTTP 404)"],
    [500, "The file server answered HTTP 500"],
  ])("explains an HTTP %d answer", async (status, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));

    const { result } = renderHook(() => useAssetFailureDetail("asset://x", true));

    await waitFor(() => expect(result.current).toBe(expected));
  });

  it("says the file itself is the problem when it can be read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 206 }));

    const { result } = renderHook(() => useAssetFailureDetail("asset://x", true));

    await waitFor(() => expect(result.current).toBe("The file was read, but the browser could not decode it"));
  });

  it("reports blocked requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { result } = renderHook(() => useAssetFailureDetail("asset://x", true));

    await waitFor(() => expect(result.current).toBe("The request was blocked (Failed to fetch)"));
  });
});
