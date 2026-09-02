"use client";

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/store";
import { hero } from "@/content/hero";
import { CampaignImage } from "@/components/ui/CampaignImage";

const FADE_OUT_BY = 0.1;

/**
 * Sits behind the (now transparent-background) 3D canvas, visible only
 * during the hero. Gives the opening scene a real subject to anchor to —
 * the brush and pigment render on top of it — instead of an empty void,
 * then fades out as the journey moves past the hero so later scenes are
 * unaffected (this is a fixed full-viewport layer, not scoped to a section).
 */
export function HeroPortraitBackdrop() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const unsubscribe = useExperienceStore.subscribe((state) => {
      const next = Math.max(0, 1 - state.scrollProgress / FADE_OUT_BY);
      setOpacity((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
    });
    return unsubscribe;
  }, []);

  if (opacity <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 right-0 w-full md:w-[56vw]">
        <CampaignImage
          src={hero.portraitSrc}
          alt=""
          label="Sminkanje"
          seed="hero"
          className="h-full w-full"
          focus="50% 22%"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0a0908 0%, rgba(10,9,8,0.85) 22%, rgba(10,9,8,0.15) 55%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,9,8,0.5) 0%, transparent 30%, transparent 65%, #0a0908 100%)",
          }}
        />
      </div>
    </div>
  );
}
