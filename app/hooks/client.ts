import { useEffect, useState } from "react";

export function useClientOnly<T>(value: () => T, initialValue?: T) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    setState(value());
  }, [value]);

  return state;
}
