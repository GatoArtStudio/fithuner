import { invoke } from "@tauri-apps/api/core";
import type { PlacesGateway } from "../application/places-gateway";
import type { Place } from "../domain/place";

export const tauriPlacesGateway: PlacesGateway = {
  listPlaces: () => invoke<Place[]>("list_places"),
};
