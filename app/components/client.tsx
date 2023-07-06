import type { PropsWithChildren, ReactNode } from "react";

import { useClientOnly } from "~/hooks/client";

interface Props {
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback }: PropsWithChildren<Props>) {
  return useClientOnly(() => children, fallback);
}
