"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { hero } from "@/content/hero";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduceMotion) return;

      gsap.set(".hero-line", { y: 40, opacity: 0 });
      gsap.set(".hero-eyebrow, .hero-scroll", { opacity: 0 });

      gsap
        .timeline({ delay: 0.3 })
        .to(".hero-eyebrow", { opacity: 1, duration: 0.8, ease: "power2.out" })
        .to(
          ".hero-line",
          { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out" },
          "-=0.4"
        )
        .to(".hero-scroll", { opacity: 1, duration: 0.8 }, "-=0.4");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
    >
      <p className="hero-eyebrow mb-6 font-sans text-xs uppercase tracking-editorial text-foreground-muted">
        {hero.eyebrow}
      </p>

      <h1 className="font-serif text-[13vw] font-medium leading-[0.95] text-foreground sm:text-[9vw] lg:text-[6.5vw]">
        {hero.headline.map((line) => (
          <span key={line} className="hero-line block overflow-hidden">
            {line}
          </span>
        ))}
      </h1>

      <div className="hero-scroll absolute bottom-10 flex flex-col items-center gap-3">
        <span className="font-sans text-[10px] uppercase tracking-editorial text-foreground-muted">
          {hero.scrollHint}
        </span>
        <span className="h-12 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
