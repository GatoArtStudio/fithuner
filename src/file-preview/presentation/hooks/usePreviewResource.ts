import { useEffect, useRef, useState } from "react";

type ResourceState<Data> =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: Data }
  | { status: "error"; message: string };

interface Settled<Data> {
  key: string;
  data: Data | null;
  message: string | null;
}

function messageOf(failure: unknown): string {
  if (typeof failure === "object" && failure !== null && "message" in failure) {
    return String((failure as { message: unknown }).message);
  }
  return "Could not load the preview";
}

export function usePreviewResource<Data>(key: string | null, load: () => Promise<Data>): ResourceState<Data> {
  const [settled, setSettled] = useState<Settled<Data> | null>(null);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (key === null) return;
    let isStale = false;
    loadRef.current().then(
      (data) => {
        if (!isStale) setSettled({ key, data, message: null });
      },
      (failure: unknown) => {
        if (!isStale) setSettled({ key, data: null, message: messageOf(failure) });
      },
    );
    return () => {
      isStale = true;
    };
  }, [key]);

  if (key === null) return { status: "idle" };
  if (settled?.key !== key) return { status: "loading" };
  if (settled.message !== null) return { status: "error", message: settled.message };
  return { status: "ready", data: settled.data as Data };
}
