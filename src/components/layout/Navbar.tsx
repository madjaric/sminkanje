"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" className={className} aria-hidden="true">
      <path d="M0.5 5H14M14 5L9.75 0.75M14 5L9.75 9.25" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}

/** Two thin rules that morph into an X — same restrained stroke weight as the site's other line-art icons, not a boxed/rounded "app" hamburger. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
      <line
        x1="0"
        y1={open ? 7 : 0.75}
        x2="22"
        y2={open ? 7 : 0.75}
        stroke="currentColor"
        strokeWidth="1.2"
        style={{ transformOrigin: "11px 7px", transform: open ? "rotate(45deg)" : "none", transition: "y 300ms ease, transform 300ms ease" }}
      />
      <line
        x1="0"
        y1={open ? 7 : 13.25}
        x2="22"
        y2={open ? 7 : 13.25}
        stroke="currentColor"
        strokeWidth="1.2"
        style={{ transformOrigin: "11px 7px", transform: open ? "rotate(-45deg)" : "none", transition: "y 300ms ease, transform 300ms ease" }}
      />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Background-scroll lock (and its release) is set imperatively, inline in
  // the same handler that changes `open`, rather than in a useEffect keyed
  // on `open`. A nav link's onClick both closes the menu and lets the
  // browser's native `href="#anchor"` jump run as that same click's default
  // action — that default action fires right after the synchronous handler
  // returns, which is *before* React commits the re-render and runs any
  // effect cleanup. An effect-based unlock was still setting
  // documentElement.overflow back to "hidden" at that point, silently
  // swallowing the anchor jump (Lenis drives real native scroll here, so a
  // non-scrollable root well and truly blocks it). Setting the style
  // directly, synchronously, closes that gap. Lenis (see
  // SmoothScrollProvider) never needs to be reached into to pause it —
  // clamping the root's own overflow already stops its native scroll dead.
  const openMenu = () => {
    document.documentElement.style.overflow = "hidden";
    setOpen(true);
  };
  const close = () => {
    document.documentElement.style.overflow = "";
    setOpen(false);
  };

  // Defensive: clears a leftover lock if this ever unmounts while open
  // (Navbar lives at the root layout, so in practice it doesn't).
  useEffect(() => () => {
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <Link
          href="#"
          onClick={close}
          className="-m-2 p-2 font-serif text-lg tracking-wide text-foreground"
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="-m-2 p-2 font-sans text-[11px] uppercase tracking-editorial text-foreground-muted transition-colors duration-300 hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* md:contents drops this wrapper's own box on desktop — its child
            (the CTA link) then sits directly in the header's flex row exactly
            as before this component grew a mobile menu trigger, so desktop
            spacing/DOM is unaffected. Below md it's a real flex row, grouping
            the CTA and the hamburger together as one item on the header's
            right edge instead of justify-between spacing three items evenly
            (which would strand the CTA in the middle). */}
        <div className="flex items-center gap-5 md:contents">
          <Link
            href={site.bookHref}
            onClick={close}
            className="group relative -m-2 p-2 font-sans text-[11px] uppercase tracking-editorial text-foreground"
          >
            <span className="relative z-10">Zakaži termin</span>
            <span className="absolute bottom-1 left-2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
          </Link>

          <button
            type="button"
            onClick={() => (open ? close() : openMenu())}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Zatvori meni" : "Otvori meni"}
            className="-m-2 p-2 text-foreground md:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </header>

      {/* Mobile nav overlay — sits below the header (z-40) so the trigger
          stays on top of it and keeps working as the close control, above
          everything else on the page. Kept mounted (not conditionally
          rendered) so the open/close transition can animate both ways;
          inert to touch/click and hidden from the accessibility tree while
          closed via pointer-events + aria-hidden rather than unmounting. */}
      <div
        id="mobile-nav"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-30 flex flex-col justify-center bg-background px-6 pb-16 transition-opacity duration-400 ease-out md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav aria-label="Mobilna navigacija" className="flex flex-col">
          {site.nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={close}
              tabIndex={open ? 0 : -1}
              className="border-b border-white/10 py-5 font-serif text-3xl text-foreground transition-[color,transform,opacity] duration-500 ease-out hover:text-gold"
              style={{
                transitionDelay: open ? `${80 + i * 60}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href={site.bookHref}
          onClick={close}
          tabIndex={open ? 0 : -1}
          className="group mt-10 inline-flex w-fit items-center gap-4 border border-gold/50 px-8 py-4 font-sans text-xs uppercase tracking-editorial text-gold transition-[opacity,transform,background-color,color] duration-500 ease-out hover:bg-gold hover:text-primary-foreground"
          style={{
            transitionDelay: open ? `${80 + site.nav.length * 60}ms` : "0ms",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(8px)",
          }}
        >
          Zakaži termin
          <ArrowRightIcon className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </>
  );
}
