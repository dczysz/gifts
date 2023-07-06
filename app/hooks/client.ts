import { useEffect, useState } from "react";

export function useClientOnly<T extends any>(value: () => T, initialValue?: T) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    setState(value());
  }, [value]);

  return state;
}
