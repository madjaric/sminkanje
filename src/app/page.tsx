import { Experience } from "@/components/3d/Experience";
import { HeroPortraitBackdrop } from "@/components/3d/HeroPortraitBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Transformation } from "@/components/sections/transformation/Transformation";
import { Services } from "@/components/sections/Services";
import { Portfolio } from "@/components/sections/Portfolio";
import { BookingCTA } from "@/components/sections/BookingCTA";

export default function Home() {
  return (
    <>
      <HeroPortraitBackdrop />
      <Experience />
      <Navbar />
      <main className="relative">
        <Hero />
        <Transformation />
        <Services />
        <Portfolio />
        <BookingCTA />
      </main>
    </>
  );
}
