"use client";

import { useEffect } from "react";
import { useExperienceStore } from "@/lib/store";

/**
 * Resolves a one-shot rendering quality tier and reduced-motion preference
 * on mount. Cheap device signals only (no benchmarking) so it never blocks
 * first paint. `PerformanceMonitor` (drei) still adjusts DPR live on top of
 * this baseline.
 */
export function useDeviceCapability() {
  const setQuality = useExperienceStore((s) => s.setQuality);
  const setReducedMotion = useExperienceStore((s) => s.setReducedMotion);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    setReducedMotion(reduceMotionQuery.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    reduceMotionQuery.addEventListener("change", onChange);

    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isSmallViewport = window.innerWidth < 768;

    let quality: "high" | "medium" | "low" = "high";
    if ((memory !== undefined && memory <= 4) || cores <= 4) {
      quality = "medium";
    }
    if (isCoarsePointer && isSmallViewport) {
      quality = memory !== undefined && memory <= 4 ? "low" : "medium";
    }

    setQuality(quality);

    return () => reduceMotionQuery.removeEventListener("change", onChange);
  }, [setQuality, setReducedMotion]);
}
