"use client";

import Link from "next/link";
import { site } from "@/content/site";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
      <Link
        href="#"
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

      <Link
        href={site.bookHref}
        className="group relative -m-2 p-2 font-sans text-[11px] uppercase tracking-editorial text-foreground"
      >
        <span className="relative z-10">Zakaži termin</span>
        <span className="absolute bottom-1 left-2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
      </Link>
    </header>
  );
}
