import type { Place } from "../../domain/entities/place";

export interface PlacesGateway {
  listPlaces(): Promise<Place[]>;
}
