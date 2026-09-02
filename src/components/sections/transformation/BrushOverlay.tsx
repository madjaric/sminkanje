"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { MakeupBrush } from "@/components/3d/MakeupBrush/MakeupBrush";
import { PigmentParticles } from "@/components/3d/Particles/PigmentParticles";

/**
 * A small, self-contained canvas holding only the brush. Its screen
 * position and tilt are controlled by ordinary CSS on the wrapper element
 * (see Transformation.tsx) rather than 3D camera projection — this keeps
 * "the brush drives the reveal" interaction simple and exact, and fully
 * decoupled from the persistent site-wide Experience canvas, whose own
 * brush stays small and distant for the duration of this section.
 */
export function BrushOverlay() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 22, near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.25} color="#3a2f26" />
      <directionalLight position={[2, 3, 4]} intensity={1.7} color="#f6dcac" />
      <directionalLight position={[-2, -1, 2]} intensity={0.5} color="#d8c2ff" />
      <pointLight position={[0, 1.3, 1]} intensity={0.7} color="#f3e2bd" distance={2.2} decay={2} />
      <Suspense fallback={null}>
        <group scale={0.62}>
          <MakeupBrush />
          <group position={[0, 1.5, 0]}>
            <PigmentParticles radius={0.32} color="#e6d3ad" reactive={false} density={0.5} />
          </group>
        </group>
      </Suspense>
    </Canvas>
  );
}
