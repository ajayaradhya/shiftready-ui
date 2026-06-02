"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query hook. Returns false on the server and first client
 * render, then syncs to the real match after mount. Use for responsive
 * branching in components that rely on inline styles (where Tailwind
 * breakpoints aren't available).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** True when viewport is at or below the mobile breakpoint (<640px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
