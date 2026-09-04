"use client";

import { Suspense, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MakeupBrush } from "./MakeupBrush";
import { useBrushRig } from "./useBrushRig";
import { PigmentParticles } from "../Particles/PigmentParticles";
import { useExperienceStore } from "@/lib/store";

/** Matches useBrushRig.ts / CameraRig.tsx's own narrow-aspect threshold and ramp. */
const MOBILE_REFERENCE_ASPECT = 1.2;
const MOBILE_FULL_BELOW_ASPECT = 1.0;
/**
 * The real fix for "brush reads as flat black on mobile" is in CameraRig.tsx
 * (it no longer moves the camera's *position* on narrow aspects — doing so
 * broke the PBR material's environment reflections). These two lights are a
 * modest supplementary boost on top of that fix, not a substitute for it: on
 * mobile the brush sits over a darker slice of the hero (versus the lighter
 * portrait area it can land on at wider aspects) and reads smaller overall,
 * so a little extra local contrast keeps the ferrule/bristle separation
 * legible. This one is the existing reflector light, riding in the brush's
 * own group (so it always hits it regardless of position/rotation) —
 * boosting only its intensity, ramped with aspect.
 */
const MOBILE_LIGHT_BOOST = 2.4;
/**
 * useBrushRig.ts's mobile composition adds a little extra roll around local
 * Z (on top of the hero keyframe's own Z-only rotation) for a diagonal
 * lean. The reflector light above sits off-axis (x=0.15, y=1.55), so that
 * same roll swings it — around the mesh, in the XY-plane — slightly away
 * from a camera-facing position. A second, mobile-only fill sitting near
 * the local Z axis (x≈0, y≈0) stays camera-facing regardless of roll, since
 * rotating around Z doesn't move points that sit on it.
 */
const MOBILE_FILL_LIGHT_INTENSITY = 1.5;

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
  const { size } = useThree();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    rig(groupRef.current, state.clock.elapsedTime, delta);
  });

  const aspect = size.width / size.height;
  const mobileT = THREE.MathUtils.clamp(
    (MOBILE_REFERENCE_ASPECT - aspect) / (MOBILE_REFERENCE_ASPECT - MOBILE_FULL_BELOW_ASPECT),
    0,
    1
  );
  const lightIntensity = 0.55 * THREE.MathUtils.lerp(1, MOBILE_LIGHT_BOOST, mobileT);
  const fillLightIntensity = MOBILE_FILL_LIGHT_INTENSITY * mobileT;

  return (
    <group ref={groupRef} dispose={null}>
      <Suspense fallback={null}>
        <MakeupBrush />
      </Suspense>
      {/* Guarantees the bristles catch a highlight regardless of camera
          angle or global lighting — a real product shot would rely on a
          reflector card right at the subject, not just the room's key. */}
      <pointLight position={[0.15, 1.55, 0.35]} intensity={lightIntensity} color="#f3e2bd" distance={1.4} decay={2} />
      {/* Mobile-only fill, see MOBILE_FILL_LIGHT_INTENSITY above — zero
          intensity (and so a no-op) on desktop, where mobileT is always 0. */}
      <pointLight position={[0, 0.2, 1.1]} intensity={fillLightIntensity} color="#fff3da" distance={2.4} decay={1.4} />
      <group position={[0, 1.5, 0]}>
        <PigmentParticles key={quality} radius={0.4} color="#e6d3ad" />
      </group>
    </group>
  );
}
