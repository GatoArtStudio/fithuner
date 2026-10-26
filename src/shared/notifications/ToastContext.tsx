import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { ToastState, ToastStore } from "./toast-store";

const ToastContext = createContext<ToastStore | null>(null);

interface ToastProviderProps {
  store: ToastStore;
  children: ReactNode;
}

export function ToastProvider({ store, children }: ToastProviderProps) {
  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
}

export function useToasts<Selected>(selector: (state: ToastState) => Selected): Selected {
  const store = useContext(ToastContext);
  if (!store) throw new Error("useToasts must be used inside ToastProvider");
  return useStore(store, selector);
}
