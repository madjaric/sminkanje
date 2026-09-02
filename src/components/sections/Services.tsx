"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { CampaignImage } from "@/components/ui/CampaignImage";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/lib/store";

/** Fixed row height driving the sidebar's sliding marker math below. */
const ITEM_HEIGHT = 80;
/** Small intentional delay before a hover commits, so a quick sweep across all five bottom cards settles on wherever the cursor actually rests instead of flickering through every one. */
const HOVER_DELAY = 160;

/**
 * Per-photo object-position. The five prepared photos share one source
 * aspect (16:9) but the hero slot is much closer to square and the subject
 * isn't centered the same way in every shot — without this a plain 50/50
 * center-crop would cut into a couple of the faces.
 */
const SERVICE_FOCUS: Record<string, string> = {
  bridal: "66% 38%",
  "soft-glam": "50% 45%",
  "full-glam": "38% 32%",
  editorial: "34% 30%",
  education: "50% 42%",
};

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" className={className} aria-hidden="true">
      <path d="M0.5 5H14M14 5L9.75 0.75M14 5L9.75 9.25" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M7.5 1.5L3 5.5L7.5 9.5" : "M3 1.5L7.5 5.5L3 9.5";
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const hoverTimeout = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const setServicesActive = useExperienceStore((s) => s.setServicesActive);
  const active = services[activeIndex];
  const count = services.length;

  useEffect(
    () => () => {
      if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    },
    []
  );

  // Tells the large decorative 3D brush (a fixed layer behind every
  // section) to hide itself while this section is on screen — this is its
  // own clean, brush-free composition. A real IntersectionObserver against
  // this section, not a guess from scroll-progress fractions, since the
  // Transformation section's own huge pinned scroll range means progress
  // doesn't divide evenly across sections.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setServicesActive(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      setServicesActive(false);
    };
  }, [setServicesActive]);

  const scheduleActivate = useCallback((i: number) => {
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    hoverTimeout.current = window.setTimeout(() => setActiveIndex(i), HOVER_DELAY);
  }, []);

  const activateNow = useCallback((i: number) => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setActiveIndex(i);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative z-10 flex flex-col py-20 md:min-h-screen md:py-0"
    >
      <div className="relative grid grid-cols-1 gap-y-10 pt-8 md:flex-1 md:grid-cols-[200px_360px_1fr] md:gap-x-10 md:pt-0 lg:grid-cols-[220px_400px_1fr] lg:gap-x-14">
        {/* LEFT — vertical category nav (desktop only; the bottom strip covers this role on mobile). A fixed top offset rather than vertical centering — matches Hero/Transformation's own convention, and keeps this clear of the fixed navbar regardless of viewport height (centering within a full-height row left too little headroom on short viewports). */}
        <nav aria-label="Kategorije usluga" className="relative hidden pl-6 md:block md:pl-14">
          <span className="absolute left-6 top-28 h-[calc(100%-7rem)] w-px bg-white/10 md:left-14" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute left-6 top-28 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(201,162,77,0.55)] transition-transform duration-500 ease-out md:left-14"
            style={{ transform: `translateY(${activeIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2 - 3}px)` }}
          />
          <ul className="md:pt-28">
            {services.map((service, i) => (
              <li key={service.id} style={{ height: ITEM_HEIGHT }}>
                <button
                  type="button"
                  onClick={() => activateNow(i)}
                  className="flex h-full w-full flex-col justify-center gap-2 pl-6 text-left"
                >
                  <span
                    className={cn(
                      "font-sans text-xs transition-colors duration-300",
                      i === activeIndex ? "text-gold" : "text-foreground-muted/50"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap font-sans text-sm uppercase tracking-[0.14em] transition-colors duration-300",
                      i === activeIndex ? "text-gold" : "text-foreground-muted"
                    )}
                  >
                    {service.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* CENTER — counter, title, description, price, CTA for the active service */}
        <div className="flex flex-col justify-center pl-6 md:justify-start md:pl-0 md:pt-28">
          <div key={active.id} className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-500 ease-out">
            <p className="font-sans text-sm tracking-editorial text-foreground-muted">
              <span className="text-gold">{String(activeIndex + 1).padStart(2, "0")}</span>
              <span className="mx-1.5">/</span>
              <span>{String(count).padStart(2, "0")}</span>
            </p>

            <div>
              <h2 className="font-serif text-5xl uppercase leading-[0.95] text-foreground md:text-6xl lg:text-7xl">
                {active.name}
              </h2>
              <span className="mt-6 block h-px w-16 bg-gold/40" aria-hidden="true" />
            </div>

            <p className="max-w-xs font-serif text-lg italic leading-relaxed text-foreground-muted">
              {active.shortDescription}
            </p>

            <p className="font-sans text-sm uppercase tracking-editorial">
              <span className="text-gold/80">Od</span>{" "}
              <span className="text-xl text-gold">&euro;{active.priceFrom}</span>
            </p>

            <Link
              href={site.bookHref}
              className="group mt-2 inline-flex w-fit items-center gap-4 border border-gold/40 px-7 py-3.5 font-sans text-[11px] uppercase tracking-editorial text-foreground transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              Pogledaj detalje
              <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* RIGHT — hero photo, edge-to-edge to the viewport's right side, feathered into the dark scene on its other two exposed edges */}
        <div className="relative h-[46vh] min-h-[280px] md:h-full md:min-h-0">
          <div
            className="absolute inset-0"
            style={{
              maskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%)",
              WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 7%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 7%)",
              }}
            >
              {services.map((service, i) => (
                <CampaignImage
                  key={service.id}
                  src={service.imageSrc}
                  alt={service.name}
                  label={service.name}
                  seed={`hero-${service.id}`}
                  priority={i === 0}
                  sizes="(min-width: 768px) 55vw, 100vw"
                  focus={SERVICE_FOCUS[service.id]}
                  className={cn(
                    "absolute inset-0 h-full w-full transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    i === activeIndex ? "z-10 scale-100 opacity-100" : "scale-[1.035] opacity-0"
                  )}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM — all five categories, edge-to-edge, always visible */}
      <div className="relative shrink-0 border-t border-white/10">
        <div className="flex overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible">
          {services.map((service, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={service.id}
                type="button"
                onMouseEnter={() => scheduleActivate(i)}
                onFocus={() => scheduleActivate(i)}
                onClick={() => activateNow(i)}
                aria-current={isActive}
                className={cn(
                  "group relative h-[165px] w-[230px] shrink-0 overflow-hidden border-r border-white/10 text-left last:border-r-0 md:h-[190px] md:w-auto"
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-[5px] left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-gold/60 bg-background"
                  />
                )}

                <CampaignImage
                  src={service.imageSrc}
                  alt={service.name}
                  label={service.name}
                  seed={`nav-${service.id}`}
                  sizes="20vw"
                  focus={SERVICE_FOCUS[service.id]}
                  className="absolute inset-0 h-full w-full"
                />

                <div
                  className={cn(
                    "absolute inset-0 bg-background transition-opacity duration-500",
                    isActive ? "opacity-[0.08]" : "opacity-60 group-hover:opacity-45"
                  )}
                  aria-hidden="true"
                />

                {isActive && (
                  <span className="absolute inset-0 z-10 border border-gold/50" aria-hidden="true" />
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p
                    className={cn(
                      "font-sans text-xs transition-colors duration-300",
                      isActive ? "text-gold" : "text-foreground-muted/60"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 font-serif text-lg text-foreground md:text-xl">{service.name}</p>
                  <p className="mt-1 font-sans text-[11px] uppercase tracking-editorial text-foreground-muted">
                    Od &euro;{service.priceFrom}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Prev / next — minimal, numberless; the cards themselves already show all five and which one's active. */}
        <div className="flex items-center justify-center gap-3 py-5">
          <button
            type="button"
            onClick={() => activateNow(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-foreground-muted transition-colors duration-300 hover:border-gold/50 hover:text-foreground disabled:opacity-30"
          >
            <ChevronIcon direction="left" />
          </button>

          <button
            type="button"
            onClick={() => activateNow(Math.min(count - 1, activeIndex + 1))}
            disabled={activeIndex === count - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-foreground-muted transition-colors duration-300 hover:border-gold/50 hover:text-foreground disabled:opacity-30"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
