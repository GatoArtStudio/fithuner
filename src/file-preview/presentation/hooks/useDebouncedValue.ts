import { useEffect, useState } from "react";

export function useDebouncedValue<Value>(value: Value, delayMillis: number): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMillis);
    return () => clearTimeout(timer);
  }, [value, delayMillis]);

  return debounced;
}
