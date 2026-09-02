import Link from "next/link";
import { site } from "@/content/site";
import { BookingFlow } from "@/features/booking/components/BookingFlow";

export const metadata = {
  title: `Zakazivanje — ${site.name}`,
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="font-serif text-lg text-foreground">
          {site.name}
        </Link>
        <Link
          href="/"
          className="font-sans text-[11px] uppercase tracking-editorial text-foreground-muted hover:text-foreground"
        >
          Zatvori
        </Link>
      </header>
      <BookingFlow />
    </div>
  );
}
