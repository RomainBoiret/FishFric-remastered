import { useSyncExternalStore } from "react";

/** True after hydration on the client; false during SSR. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
