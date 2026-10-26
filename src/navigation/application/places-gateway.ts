import type { Place } from "../domain/place";

export interface PlacesGateway {
  listPlaces(): Promise<Place[]>;
}
