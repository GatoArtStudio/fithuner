import { invoke } from "@tauri-apps/api/core";
import type { PlacesGateway } from "../../../application/ports/places-gateway";
import type { Place } from "../../../domain/entities/place";

export const tauriPlacesGateway: PlacesGateway = {
  listPlaces: () => invoke<Place[]>("list_places"),
};
