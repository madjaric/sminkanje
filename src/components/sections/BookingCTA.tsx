"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { Reveal } from "@/components/layout/Reveal";
import { useExperienceStore } from "@/lib/store";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" className={className} aria-hidden="true">
      <path d="M0.5 5H14M14 5L9.75 0.75M14 5L9.75 9.25" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={className} aria-hidden="true">
      <path d="M5 9V1M5 1L1.25 4.75M5 1L8.75 4.75" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The site's closing statement — a two-column, near-empty stage where the
 * only material is type, thin gold rules and space. No photo, brush, 3D
 * object or gradient here on purpose: after everything else on the site
 * leans on imagery, ending on typography alone is what makes this read as
 * deliberate rather than like the page just ran out of content.
 */
export function BookingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const setBookingActive = useExperienceStore((s) => s.setBookingActive);

  // Tells the large decorative 3D brush (a fixed layer behind every
  // section) to hide itself while this section is on screen — the closing
  // statement is typography and space only, same as Services/Portfolio.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setBookingActive(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      setBookingActive(false);
    };
  }, [setBookingActive]);

  return (
    <section
      ref={sectionRef}
      id="booking"
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-28 md:px-14"
    >
      <div className="grid flex-1 items-center gap-16 md:grid-cols-2 md:gap-16">
        {/* LEFT — eyebrow + the dominant headline */}
        <Reveal>
          <div className="flex items-center gap-4">
            <p className="font-sans text-xs uppercase tracking-editorial text-gold">Rezervacija</p>
            <span className="h-px w-16 bg-gold/40" aria-hidden="true" />
          </div>
          <h2 className="mt-6 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
            VAŠ NOVI IZGLED
            <br />
            POČINJE OVDE<span className="text-gold">.</span>
          </h2>
        </Reveal>

        {/* RIGHT — intro, CTA, availability note, contact */}
        <Reveal delay={0.1}>
          <p className="max-w-sm font-sans text-base leading-relaxed text-foreground-muted">
            Bilo da je u pitanju vaš poseban dan,
            <br />
            fotografisanje ili poseban događaj —
            <br />
            vaš savršen izgled je udaljen samo jedan termin.
          </p>

          <Link
            href={site.bookHref}
            className="group mt-8 inline-flex w-full items-center justify-between gap-8 border border-gold/50 px-8 py-4 font-sans text-xs uppercase tracking-editorial text-gold transition-colors duration-300 hover:bg-gold hover:text-primary-foreground sm:w-auto"
          >
            Zakaži termin
            <ArrowRightIcon className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <span className="mt-8 block h-px w-16 bg-gold/40" aria-hidden="true" />

          <p className="mt-6 max-w-xs font-serif text-sm italic leading-relaxed text-champagne">
            Dostupno za venčanja, proslave,
            <br />
            editorijal i privatne termine.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-fit items-center gap-4 text-foreground-muted transition-colors duration-300 hover:text-foreground"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/30 text-gold transition-colors duration-300 group-hover:border-gold">
                <InstagramIcon />
              </span>
              <span className="font-sans text-xs uppercase tracking-editorial">Instagram</span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="group flex w-fit items-center gap-4 text-foreground-muted transition-colors duration-300 hover:text-foreground"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/30 text-gold transition-colors duration-300 group-hover:border-gold">
                <MailIcon />
              </span>
              <span className="font-sans text-xs uppercase tracking-editorial">{site.email}</span>
            </a>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <div className="mt-20 shrink-0 md:mt-24">
        <span className="block h-px w-full bg-gold/25" aria-hidden="true" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-sans text-[11px] uppercase tracking-editorial text-foreground-muted">
          <span>&copy; {new Date().getFullYear()} {site.name}</span>
          <a
            href="#hero"
            className="group flex items-center gap-2 transition-colors duration-300 hover:text-foreground"
          >
            Na vrh
            <ArrowUpIcon className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
