import type { SearchEvent, SearchRequest } from "../../domain/entities/search";

export type Unsubscribe = () => void;

export interface SearchGateway {
  startSearch(request: SearchRequest): Promise<string>;
  cancelSearch(searchId: string): Promise<void>;
  subscribe(listener: (event: SearchEvent) => void): Promise<Unsubscribe>;
}
