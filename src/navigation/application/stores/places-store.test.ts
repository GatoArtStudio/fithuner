import { describe, expect, it, vi } from "vitest";
import { createPlacesStore } from "./places-store";

describe("places store", () => {
  it("loads the places from the gateway", async () => {
    const places = [{ label: "Home", path: "/home/ana", kind: "home" as const }];
    const store = createPlacesStore({ placesGateway: { listPlaces: vi.fn().mockResolvedValue(places) } });

    await store.getState().load();

    expect(store.getState().places).toEqual(places);
  });

  it("falls back to an empty list on failure", async () => {
    const store = createPlacesStore({ placesGateway: { listPlaces: vi.fn().mockRejectedValue(new Error("boom")) } });

    await store.getState().load();

    expect(store.getState().places).toEqual([]);
  });
});
