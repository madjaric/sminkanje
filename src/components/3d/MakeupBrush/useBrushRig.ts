import { useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore, type BrushState } from "@/lib/store";

interface Keyframe {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
}

/** One keyframe per scene, evenly spaced across the 0..1 scroll journey. */
const RAW_KEYFRAMES: Array<{
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}> = [
  { position: [0.42, 0.28, 0], rotation: [0, 0, -0.22], scale: 0.92 }, // hero
  // "transformation" now runs its own dedicated foreground brush overlay
  // (see components/sections/transformation/BrushOverlay.tsx) — this global
  // brush deliberately recedes small and distant so the two don't compete.
  { position: [-2.0, 0.7, -1.8], rotation: [0.2, -0.3, 0.1], scale: 0.55 }, // transformation
  { position: [1.3, 0.05, -0.3], rotation: [-0.2, 0.8, 0.4], scale: 1.1 }, // services
  { position: [-1.4, 0.15, -0.7], rotation: [0.4, -0.6, -0.3], scale: 1 }, // portfolio
  { position: [0, -0.05, 1.0], rotation: [0.05, 0, -0.1], scale: 1.2 }, // booking-cta
];

const SCENE_COUNT = RAW_KEYFRAMES.length;

/**
 * Mobile-only hero composition correction. CameraRig.tsx clears the brush
 * from the hero headline (a downward re-aim) but — per its own comment —
 * deliberately does *not* move the camera's position to shrink the brush:
 * doing that broke the PBR material's reflections (moving the camera far
 * enough to matter shifts every surface's view-reflection vector away from
 * the studio environment's key, reading as flat matte black regardless of
 * added light). So apparent *size* is controlled here instead, by scaling
 * the object itself — camera stays at its normal distance, so the
 * reflections that make it read as a lit, physical brush stay intact.
 *
 * This also nudges it toward the upper-right (so it settles as a corner-ish
 * detail rather than dead center) and adds a little extra roll for a raked
 * diagonal entry, ramped identically to CameraRig's own narrow-aspect ramp
 * (full strength by aspect 1.0) so the two corrections read as one coherent
 * mobile composition instead of drifting apart at different aspects.
 */
const MOBILE_REFERENCE_ASPECT = 1.2;
const MOBILE_FULL_BELOW_ASPECT = 1.0;
const MOBILE_SCALE_MULT = 0.42;
const MOBILE_POSITION_X_SHIFT = 0.12;
const MOBILE_POSITION_Y_SHIFT = -0.4;
const MOBILE_EXTRA_ROLL_DEG = -8;

function buildKeyframes(): Keyframe[] {
  return RAW_KEYFRAMES.map((k) => ({
    position: new THREE.Vector3(...k.position),
    rotation: new THREE.Euler(...k.rotation),
    scale: k.scale,
  }));
}

function resolveBrushState(progress: number): BrushState {
  const segment = 1 / (SCENE_COUNT - 1);
  if (progress < 0.015) return "idle";
  if (progress < segment * 0.6) return "float";
  const transformationStart = segment * 2 - segment * 0.3;
  const transformationEnd = segment * 3;
  if (progress >= transformationStart && progress < transformationEnd) {
    return "apply";
  }
  const servicesStart = segment * 3;
  const servicesEnd = segment * 3.6;
  if (progress >= servicesStart && progress < servicesEnd) {
    return "swipe";
  }
  if (progress > 0.97) return "exit";
  return "travel";
}

export function useBrushRig() {
  const { size } = useThree();
  const keyframes = useMemo(() => buildKeyframes(), []);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        keyframes.map((k) => k.position),
        false,
        "catmullrom",
        0.4
      ),
    [keyframes]
  );

  const smoothedPosition = useRef(keyframes[0].position.clone());
  const smoothedQuaternion = useRef(
    new THREE.Quaternion().setFromEuler(keyframes[0].rotation)
  );
  const targetPosition = useRef(new THREE.Vector3());
  const targetQuaternion = useRef(new THREE.Quaternion());
  const qA = useRef(new THREE.Quaternion());
  const qB = useRef(new THREE.Quaternion());
  const lastBrushState = useRef<BrushState>("idle");
  const smoothedHide = useRef(0);

  return (group: THREE.Group, elapsedTime: number, delta: number) => {
    const {
      scrollProgress,
      reducedMotion,
      setBrushState,
      transformationActive,
      servicesActive,
      portfolioActive,
      bookingActive,
    } = useExperienceStore.getState();

    const segments = SCENE_COUNT - 1;
    const scaled = Math.min(scrollProgress, 0.9999) * segments;
    const segmentIndex = Math.floor(scaled);
    const localT = scaled - segmentIndex;

    curve.getPoint(Math.min(scrollProgress, 1), targetPosition.current);

    qA.current.setFromEuler(keyframes[segmentIndex].rotation);
    qB.current.setFromEuler(
      keyframes[Math.min(segmentIndex + 1, segments)].rotation
    );
    targetQuaternion.current.slerpQuaternions(qA.current, qB.current, localT);

    let targetScale = THREE.MathUtils.lerp(
      keyframes[segmentIndex].scale,
      keyframes[Math.min(segmentIndex + 1, segments)].scale,
      localT
    );

    // Idle organic drift, layered on top of the scroll-driven path.
    if (!reducedMotion) {
      const driftAmount = 0.05;
      targetPosition.current.y += Math.sin(elapsedTime * 0.6) * driftAmount;
      targetPosition.current.x += Math.cos(elapsedTime * 0.4) * driftAmount * 0.5;
    }

    // Mobile hero composition correction (see constants above) — folded
    // into the *targets* before smoothing/lerping below, not applied as a
    // post-multiply on the final group transform: group.scale.setScalar
    // further down lerps FROM group.scale.x itself, so mutating the scale
    // after that call would feed a partially-corrected value back in as
    // next frame's starting point, settling at a distorted equilibrium
    // instead of the intended value. Position/rotation targets are
    // recomputed fresh every frame either way, so adjusting them here is
    // safe regardless.
    const aspect = size.width / size.height;
    if (aspect < MOBILE_REFERENCE_ASPECT) {
      const t = THREE.MathUtils.clamp(
        (MOBILE_REFERENCE_ASPECT - aspect) / (MOBILE_REFERENCE_ASPECT - MOBILE_FULL_BELOW_ASPECT),
        0,
        1
      );
      targetScale *= THREE.MathUtils.lerp(1, MOBILE_SCALE_MULT, t);
      targetPosition.current.x += THREE.MathUtils.lerp(0, MOBILE_POSITION_X_SHIFT, t);
      targetPosition.current.y += THREE.MathUtils.lerp(0, MOBILE_POSITION_Y_SHIFT, t);
      const extraRoll = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(THREE.MathUtils.lerp(0, MOBILE_EXTRA_ROLL_DEG, t))
      );
      targetQuaternion.current.premultiply(extraRoll);
    }

    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-4.5 * delta);
    smoothedPosition.current.lerp(targetPosition.current, smoothing);
    smoothedQuaternion.current.slerp(targetQuaternion.current, smoothing);

    group.position.copy(smoothedPosition.current);
    group.quaternion.copy(smoothedQuaternion.current);
    group.scale.setScalar(
      THREE.MathUtils.lerp(group.scale.x || 1, targetScale, smoothing)
    );

    // Fully hide the large decorative brush while the Transformation
    // section's own dedicated foreground brush (BrushOverlay) is active, or
    // while the Services, Portfolio, or final Booking section is on screen —
    // each is its own clean, brush-free composition. All these flags come
    // from real IntersectionObservers against the actual section elements
    // (see Transformation.tsx, Services.tsx, Portfolio.tsx, BookingCTA.tsx),
    // not a guess from scroll-progress fractions — the Transformation
    // section's own huge pinned scroll range means scroll-progress doesn't
    // divide evenly across sections, so an earlier fraction-based version of
    // this gate could drift out of sync with what's actually on screen.
    // Scaling toward ~0 and pushing it back behind the camera (rather than
    // just toggling opacity, which this brush's materials aren't set up for)
    // guarantees no bristles, flyaways or particles peek through at any
    // angle.
    const hideTarget =
      transformationActive || servicesActive || portfolioActive || bookingActive ? 1 : 0;
    const hideSmoothing = reducedMotion ? 1 : 1 - Math.exp(-9 * delta);
    smoothedHide.current += (hideTarget - smoothedHide.current) * hideSmoothing;
    group.scale.multiplyScalar(Math.max(1 - smoothedHide.current, 0.0001));
    group.position.z -= smoothedHide.current * 6;
    group.visible = smoothedHide.current < 0.995;

    const nextState = resolveBrushState(scrollProgress);
    if (nextState !== lastBrushState.current) {
      lastBrushState.current = nextState;
      setBrushState(nextState);
    }
  };
}
