"use client";

import { useExperienceStore } from "@/lib/store";
import { PigmentParticles } from "./PigmentParticles";

/**
 * A larger, sparser, slow-drifting cloud that fills the scene independent
 * of brush state — the "very subtle" background powder the hero calls for.
 * Reuses the same shader as the brush trail at low, constant intensity.
 */
export function AmbientDust() {
  const quality = useExperienceStore((s) => s.quality);
  return (
    <group position={[0, 0, -0.5]}>
      <PigmentParticles
        key={quality}
        radius={2.6}
        color="#8a6a4f"
        reactive={false}
        density={0.32}
      />
    </group>
  );
}
