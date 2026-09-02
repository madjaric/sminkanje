"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperienceStore } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const setScrollProgress = useExperienceStore((s) => s.setScrollProgress);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Reduced motion: skip Lenis entirely, use native scroll + a lightweight
    // rAF loop just to keep the progress store (and section reveals) alive.
    if (prefersReducedMotion) {
      let frame = 0;
      const tick = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setScrollProgress(max > 0 ? window.scrollY / max : 0);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      setScrollProgress(limit > 0 ? scroll / limit : 0);
      ScrollTrigger.update();
    });

    // Let GSAP drive Lenis's raf instead of running two independent loops.
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (value !== undefined) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const refreshHandler = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", refreshHandler);
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener("refresh", refreshHandler);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [setScrollProgress]);

  return <>{children}</>;
}
