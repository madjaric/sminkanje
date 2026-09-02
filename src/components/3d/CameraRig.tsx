"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCameraRig } from "./useCameraRig";

export function CameraRig() {
  const rig = useCameraRig();
  const { camera, size } = useThree();

  useFrame((_, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    rig(perspectiveCamera, delta);

    // The keyframes are tuned for a landscape aspect. On a narrow/portrait
    // viewport (phones), pull the camera back along its own view direction
    // so the brush isn't cropped horizontally — sacrifices some tightness
    // of framing for correctness, which reads fine since it just shows a
    // little more of the scene rather than clipping the subject.
    const aspect = size.width / size.height;
    if (aspect < 1.2) {
      const distanceScale = THREE.MathUtils.clamp(1.2 / aspect, 1, 1.85);
      const forward = new THREE.Vector3();
      perspectiveCamera.getWorldDirection(forward);
      perspectiveCamera.position.addScaledVector(
        forward,
        -perspectiveCamera.position.length() * (distanceScale - 1) * 0.12
      );
    }
  });

  return null;
}
