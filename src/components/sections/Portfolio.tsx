"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio } from "@/content/portfolio";
import { services } from "@/content/services";
import { CampaignImage } from "@/components/ui/CampaignImage";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/lib/store";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M7.5 1.5L3 5.5L7.5 9.5" : "M3 1.5L7.5 5.5L3 9.5";
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
      <path d="M5 0.5V13M5 13L1 9M5 13L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Cards beyond this ring from the active one aren't rendered — a defensive cap, not a real constraint at the current 5-item count (every item is within ±2 of any active index). */
const MAX_VISIBLE_RING = 2;

/** Reuses the Serbian service name already translated in content/services.ts as the category caption, rather than duplicating the same translation in a second place. */
function categoryLabel(category: string) {
  return services.find((s) => s.category === category)?.name ?? category;
}

/**
 * A directed, editorial reel rather than a browsable grid: exactly one work
 * is the focus at a time, the rest recede into shallow 3D on either side to
 * suggest a curated stack, not a wall of thumbnails. Clicking any card, the
 * arrows, or scrolling all drive the same single `activeIndex` — every part
 * of the section reads off of it, so nothing can fall out of sync.
 */
export function Portfolio() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const setPortfolioActive = useExperienceStore((s) => s.setPortfolioActive);
  const count = portfolio.length;

  const goTo = useCallback(
    (i: number) => setActiveIndex(((i % count) + count) % count),
    [count]
  );

  // Tells the large decorative 3D brush (a fixed layer behind every
  // section) to hide itself while this section is on screen — this section
  // is its own clean, brush-free composition. A real IntersectionObserver
  // against this section, not a guess from scroll-progress fractions, since
  // the Transformation section's own huge pinned scroll range means
  // progress doesn't divide evenly across sections.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPortfolioActive(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      setPortfolioActive(false);
    };
  }, [setPortfolioActive]);

  return (
    <section ref={sectionRef} id="portfolio" className="relative z-10 px-6 py-20 md:px-14 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-sans text-xs uppercase tracking-editorial text-gold">Radovi</p>
        <h2 className="mt-4 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
          Gde umetnost sreće vas
        </h2>
        <div className="mx-auto mt-5 flex items-center justify-center gap-3 md:mt-6" aria-hidden="true">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40 md:w-24" />
          <span className="h-1 w-1 rotate-45 bg-gold/70" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40 md:w-24" />
        </div>
      </div>

      <div
        className="relative mx-auto mt-8 flex h-[400px] items-center justify-center overflow-hidden md:mt-10 md:h-[460px]"
        style={{ perspective: "1400px" }}
      >
        {portfolio.map((item, i) => {
          let ring = i - activeIndex;
          if (ring > count / 2) ring -= count;
          if (ring < -count / 2) ring += count;
          const distance = Math.abs(ring);
          if (distance > MAX_VISIBLE_RING) return null;

          const isActive = ring === 0;
          // Active card sized up ~10% for a clearer hero focus (was 1); side
          // cards brightened from their original 0.55/0.32 so they stay
          // legible, rich photography instead of nearly disappearing —
          // still visibly darker/smaller than the active card either way.
          const scale = isActive ? 1.1 : distance === 1 ? 0.82 : 0.68;
          const rotateY = isActive ? 0 : ring < 0 ? 12 : -12;
          const brightness = isActive ? 1 : distance === 1 ? 0.68 : 0.46;
          const opacity = isActive ? 1 : distance === 1 ? 0.9 : 0.62;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={isActive}
              aria-label={`Prikaži ${item.title}`}
              className={cn(
                "absolute flex w-[190px] flex-col items-center transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:w-[230px]",
                distance > 0 && "hidden md:flex"
              )}
              style={{
                transform: `translateX(calc(${ring} * clamp(150px, 15vw, 240px))) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity,
                filter: `brightness(${brightness})`,
                zIndex: 10 - distance,
              }}
            >
              {/* The warmth reads only as light bleeding right off the
                  photo's own edge — a tight, low-opacity box-shadow, not a
                  separate glow shape behind it — so nothing survives as a
                  visible background cloud once it fades. */}
              <div
                className={cn(
                  "relative aspect-[3/4] w-full overflow-hidden border transition-[box-shadow,border-color] duration-700",
                  isActive
                    ? "border-gold/50 shadow-[0_0_18px_-6px_rgba(201,162,77,0.28)]"
                    : "border-white/5"
                )}
              >
                <CampaignImage
                  src={item.imageSrc}
                  alt={item.title}
                  label={item.title}
                  seed={item.id}
                  priority={isActive}
                  sizes="(min-width: 768px) 25vw, 70vw"
                  className="h-full w-full"
                />
              </div>

              <div className="mt-4 flex flex-col items-center gap-1 text-center">
                <span
                  className={cn(
                    "font-sans text-xs transition-colors duration-500",
                    isActive ? "text-gold" : "text-foreground-muted/50"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "font-sans font-medium uppercase tracking-wide text-foreground transition-all duration-500",
                    isActive ? "text-base md:text-lg" : "text-xs md:text-sm"
                  )}
                >
                  {item.title}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-editorial text-foreground-muted">
                  {categoryLabel(item.category)}
                </span>
                {isActive && <span className="mt-1 h-px w-10 bg-gold/40" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-6 md:mt-12">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Prethodni rad"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-foreground-muted transition-colors duration-300 hover:border-gold/50 hover:text-foreground"
        >
          <ChevronIcon direction="left" />
        </button>

        <div className="flex items-center gap-4 font-sans text-xs tabular-nums tracking-editorial text-foreground-muted">
          <span className="h-px w-10 bg-white/15" aria-hidden="true" />
          <span>
            <span className="text-gold">{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className="mx-1">/</span>
            {String(count).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-white/15" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Sledeći rad"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-foreground-muted transition-colors duration-300 hover:border-gold/50 hover:text-foreground"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 font-sans text-[10px] uppercase tracking-editorial text-foreground-muted md:absolute md:bottom-12 md:right-14 md:mt-0">
        Skroluj do Usluga
        <ArrowDownIcon />
      </div>
    </section>
  );
}
