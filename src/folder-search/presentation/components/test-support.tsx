import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import type { SearchGateway } from "../../application/ports/search-gateway";
import { createSearchStore } from "../../application/stores/search-store";
import type { SearchMatch } from "../../domain/entities/search";
import { SearchProvider } from "../context/SearchContext";

export function match(name: string, overrides: Partial<SearchMatch> = {}): SearchMatch {
  return {
    path: `/home/docs/${name}`,
    name,
    relativeFolder: "docs",
    kind: "file",
    sizeInBytes: 2048,
    modifiedAtMillis: null,
    ...overrides,
  };
}

export function renderWithSearch(ui: ReactElement, { matches = [] as SearchMatch[], text = "" } = {}) {
  const gateway: SearchGateway = {
    startSearch: vi.fn().mockResolvedValue("search-1"),
    cancelSearch: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  };
  const store = createSearchStore({ gateway, currentDirectoryPath: () => "/home", debounceMillis: 0 });
  store.setState({ isOpen: true, text, matches, selectedPath: matches[0]?.path ?? null });
  const result = render(<SearchProvider store={store}>{ui}</SearchProvider>);
  return { ...result, store, gateway };
}
