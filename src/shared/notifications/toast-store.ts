import { createStore, type StoreApi } from "zustand/vanilla";

export type ToastTone = "info" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

export type ToastStore = StoreApi<ToastState>;

export function createToastStore(): ToastStore {
  let nextId = 1;

  return createStore<ToastState>((set) => ({
    toasts: [],
    push: (message, tone = "info") =>
      set(({ toasts }) => ({ toasts: [...toasts, { id: nextId++, message, tone }] })),
    dismiss: (id) => set(({ toasts }) => ({ toasts: toasts.filter((toast) => toast.id !== id) })),
  }));
}
