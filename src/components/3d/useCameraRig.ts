import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/store";

interface CameraKeyframe {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

/** One keyframe per scene — mirrors the scene order used by useBrushRig. */
const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { position: [0, 0.05, 8.4], lookAt: [0.15, 0.1, 0], fov: 32 }, // hero — wide, distant
  // Transformation is its own DOM/SVG composition with a dedicated brush
  // overlay canvas — the persistent camera just holds a calm ambient frame
  // here instead of pushing in, so it doesn't fight that foreground scene.
  { position: [-1.6, 0.15, 5.5], lookAt: [-0.5, 0.1, 0], fov: 30 }, // transformation
  { position: [1.6, 0.1, 4.2], lookAt: [0.6, 0, 0], fov: 30 }, // services
  { position: [-1.8, 0.2, 3.6], lookAt: [-0.6, 0.1, 0], fov: 28 }, // portfolio — pass through
  { position: [0, -0.1, 4.8], lookAt: [0, -0.2, 0], fov: 30 }, // education
  { position: [1.2, 0.2, 4.6], lookAt: [0.4, 0.1, 0], fov: 30 }, // testimonials
  { position: [0, 0.05, 3.2], lookAt: [0, 0, 0], fov: 28 }, // booking-cta — settle
];

const SEGMENTS = CAMERA_KEYFRAMES.length - 1;

export function useCameraRig() {
  const positionCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_KEYFRAMES.map((k) => new THREE.Vector3(...k.position)),
        false,
        "catmullrom",
        0.4
      ),
    []
  );
  const lookAtCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_KEYFRAMES.map((k) => new THREE.Vector3(...k.lookAt)),
        false,
        "catmullrom",
        0.4
      ),
    []
  );

  const smoothedPosition = useRef(
    new THREE.Vector3(...CAMERA_KEYFRAMES[0].position)
  );
  const smoothedLookAt = useRef(
    new THREE.Vector3(...CAMERA_KEYFRAMES[0].lookAt)
  );
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const smoothedFov = useRef(CAMERA_KEYFRAMES[0].fov);

  return (camera: THREE.PerspectiveCamera, delta: number) => {
    const { scrollProgress, reducedMotion } = useExperienceStore.getState();
    const clamped = Math.min(scrollProgress, 1);

    positionCurve.getPoint(clamped, targetPosition.current);
    lookAtCurve.getPoint(clamped, targetLookAt.current);

    const scaled = clamped * SEGMENTS;
    const segmentIndex = Math.min(Math.floor(scaled), SEGMENTS - 1);
    const localT = scaled - segmentIndex;
    const targetFov = THREE.MathUtils.lerp(
      CAMERA_KEYFRAMES[segmentIndex].fov,
      CAMERA_KEYFRAMES[segmentIndex + 1].fov,
      localT
    );

    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-3.2 * delta);
    smoothedPosition.current.lerp(targetPosition.current, smoothing);
    smoothedLookAt.current.lerp(targetLookAt.current, smoothing);
    smoothedFov.current = THREE.MathUtils.lerp(
      smoothedFov.current,
      targetFov,
      smoothing
    );

    camera.position.copy(smoothedPosition.current);
    camera.lookAt(smoothedLookAt.current);
    if (camera.fov !== smoothedFov.current) {
      camera.fov = smoothedFov.current;
      camera.updateProjectionMatrix();
    }
  };
}
