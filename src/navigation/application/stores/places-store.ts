import { createStore, type StoreApi } from "zustand/vanilla";
import type { Place } from "../../domain/entities/place";
import type { PlacesGateway } from "../ports/places-gateway";

export interface PlacesState {
  places: Place[];
  load: () => Promise<void>;
}

export type PlacesStore = StoreApi<PlacesState>;

export interface PlacesDependencies {
  placesGateway: PlacesGateway;
}

export function createPlacesStore({ placesGateway }: PlacesDependencies): PlacesStore {
  return createStore<PlacesState>((set) => ({
    places: [],

    load: async () => {
      try {
        set({ places: await placesGateway.listPlaces() });
      } catch {
        set({ places: [] });
      }
    },
  }));
}
