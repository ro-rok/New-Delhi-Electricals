import { useEffect, useMemo, useRef } from "react";
import Lenis, { LenisOptions } from "lenis";

/**
 * Initializes Lenis smooth scrolling with sensible defaults.
 * Call once near the app root or inside page-level components.
 */
export function useLenis(options?: LenisOptions) {
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);
  const mergedOptions = useMemo(
    () => ({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      ...options,
    }),
    [options],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const lenis = new Lenis(mergedOptions);
    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      frameRef.current = requestAnimationFrame(raf);
    };

    frameRef.current = requestAnimationFrame(raf);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [mergedOptions]);

  return lenisRef;
}

export default useLenis;
