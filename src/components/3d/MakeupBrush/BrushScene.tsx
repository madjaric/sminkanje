"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MakeupBrush } from "./MakeupBrush";
import { useBrushRig } from "./useBrushRig";
import { PigmentParticles } from "../Particles/PigmentParticles";
import { useExperienceStore } from "@/lib/store";

/**
 * Scroll choreography, particle emission and the reflector light live here —
 * deliberately separate from MakeupBrush.tsx, which only loads and shades
 * the asset. Swapping the model again later means touching MakeupBrush.tsx
 * alone; this file and useBrushRig.ts don't change.
 */
export function BrushScene() {
  const groupRef = useRef<THREE.Group>(null);
  const quality = useExperienceStore((s) => s.quality);
  const rig = useBrushRig();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    rig(groupRef.current, state.clock.elapsedTime, delta);
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Suspense fallback={null}>
        <MakeupBrush />
      </Suspense>
      {/* Guarantees the bristles catch a highlight regardless of camera
          angle or global lighting — a real product shot would rely on a
          reflector card right at the subject, not just the room's key. */}
      <pointLight position={[0.15, 1.55, 0.35]} intensity={0.55} color="#f3e2bd" distance={1.4} decay={2} />
      <group position={[0, 1.5, 0]}>
        <PigmentParticles key={quality} radius={0.4} color="#e6d3ad" />
      </group>
    </group>
  );
}
