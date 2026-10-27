import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { PreviewGateway } from "../../application/ports/preview-gateway";
import type { PreviewState, PreviewStore } from "../../application/stores/preview-store";

interface PreviewContextValue {
  store: PreviewStore;
  gateway: PreviewGateway;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

interface PreviewProviderProps extends PreviewContextValue {
  children: ReactNode;
}

export function PreviewProvider({ children, ...value }: PreviewProviderProps) {
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

function usePreviewContext(): PreviewContextValue {
  const value = useContext(PreviewContext);
  if (!value) throw new Error("Preview hooks must be used inside PreviewProvider");
  return value;
}

export function usePreview<Selected>(selector: (state: PreviewState) => Selected): Selected {
  return useStore(usePreviewContext().store, selector);
}

export function usePreviewGateway(): PreviewGateway {
  return usePreviewContext().gateway;
}
