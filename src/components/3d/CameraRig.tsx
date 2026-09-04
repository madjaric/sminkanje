"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCameraRig } from "./useCameraRig";

/**
 * The scroll keyframes (see useCameraRig.ts / useBrushRig.ts) were tuned by
 * eye against a landscape-ish frame — 1.2 aspect is roughly where that
 * reads right, and is the threshold below which the correction below kicks
 * in.
 *
 * An earlier version of this file also pulled the camera *back* along its
 * view direction on narrow aspects, to match the horizontal frustum width
 * REFERENCE_ASPECT would give at the same distance (PerspectiveCamera.fov
 * is a *vertical* FOV, so a fixed fov's horizontal extent shrinks with
 * aspect — half-width = distance * tan(vfov/2) * aspect). That math was
 * correct, but moving the *camera's own world position* by several units
 * turned out to visibly break the brush's PBR material: metallic/reflective
 * shading depends on the view-reflection vector at each surface point,
 * which is a function of camera *position*, not just framing — pulling the
 * camera back that far shifted every surface's reflection enough that the
 * studio environment's bright key stopped being what's reflected toward
 * the camera, and the whole brush read as flat, matte black regardless of
 * how much extra light was added on top (confirmed by isolating the pull-
 * back as the sole active change and reproducing the same blackout with
 * every other mobile adjustment disabled). Re-aiming via lookAt, by
 * contrast, changes the camera's *orientation* only — reflection vectors
 * only depend on position, so this is safe. Apparent on-screen *size* is
 * instead handled entirely by useBrushRig.ts's own mobile scale-down
 * (which shrinks the object, not the camera-to-object relationship).
 */
const REFERENCE_ASPECT = 1.2;
/**
 * Shrinking the brush is useBrushRig.ts's job now (see the note above) —
 * this only clears it from the hero headline. The hero headline is
 * DOM-centered (flex items-center), and the brush's world position sits
 * close to this rig's own lookAt (both near the world origin), so however
 * small useBrushRig.ts makes it, it still projects near the exact same
 * screen-center the text occupies. Re-aiming the camera a few degrees
 * downward in world space moves the frame's vertical center below the
 * brush's actual height, pushing it toward the upper part of the viewport —
 * clear of the vertically-centered headline beneath it — without moving
 * the brush itself or touching any Hero DOM/typography.
 */
const MAX_VERTICAL_NUDGE_DEG = 9;
/**
 * The nudge above reaches full strength by this aspect (and stays there for
 * anything narrower) rather than fading out all the way down to 1.2 —
 * clearing DOM-centered text doesn't get easier just because a viewport is
 * only mildly narrow, so a slow fade left moderately-narrow aspects
 * (tablets, ~0.6–1.0) under-cleared.
 */
const VERTICAL_NUDGE_FULL_BELOW_ASPECT = 1.0;

export function CameraRig() {
  const rig = useCameraRig();
  const { camera, size } = useThree();

  useFrame((_, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    rig(perspectiveCamera, delta);

    const aspect = size.width / size.height;
    if (aspect < REFERENCE_ASPECT) {
      const nudgeNarrowness = THREE.MathUtils.clamp(
        (REFERENCE_ASPECT - aspect) / (REFERENCE_ASPECT - VERTICAL_NUDGE_FULL_BELOW_ASPECT),
        0,
        1
      );
      const currentDistance = perspectiveCamera.position.length();
      const forward = new THREE.Vector3();
      perspectiveCamera.getWorldDirection(forward);

      // Re-aim at a point straight ahead but nudged down in world Y, rather
      // than rotating the camera directly — sidesteps reasoning about
      // rotateX's sign/handedness, since lookAt's contract is exactly "this
      // point becomes the frame's center," so nudging its Y down is
      // guaranteed to push everything else up-frame regardless of the
      // camera's current orientation. Camera *position* is untouched.
      const aimPoint = perspectiveCamera.position
        .clone()
        .addScaledVector(forward, currentDistance);
      aimPoint.y -=
        currentDistance *
        Math.tan(THREE.MathUtils.degToRad(MAX_VERTICAL_NUDGE_DEG * nudgeNarrowness));
      perspectiveCamera.lookAt(aimPoint);
    }
  });

  return null;
}
