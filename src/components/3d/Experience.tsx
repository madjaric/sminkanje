"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useExperienceStore } from "@/lib/store";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { BrushScene } from "./MakeupBrush/BrushScene";
import { CameraRig } from "./CameraRig";
import { AmbientDust } from "./Particles/AmbientDust";

const DPR_BY_QUALITY: Record<"high" | "medium" | "low", [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: [1, 1],
};

/**
 * Product-shot lighting, not a uniformly lit demo scene: one large soft key
 * (an area light, not a point) so the ferrule/handle catch a believable
 * broad highlight, a tight rim light behind-opposite for edge separation
 * against the dark background, and a faint warm bounce — everything else
 * stays dark on purpose so the brush reads by contrast, not exposure.
 */
function Lighting() {
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  return (
    <>
      <ambientLight intensity={0.045} color="#241a14" />
      <rectAreaLight
        position={[1.6, 2.0, 2.4]}
        rotation={[-0.5, 0.6, 0]}
        width={2.4}
        height={3.2}
        intensity={6.5}
        color="#f6dcac"
      />
      <spotLight
        position={[-2.8, 0.6, -2.0]}
        angle={0.32}
        penumbra={0.5}
        intensity={4.5}
        color="#d8c2ff"
        distance={9}
        decay={2}
      />
      <pointLight
        position={[0.2, -1.3, 1.3]}
        intensity={0.3}
        color="#c08b7a"
        distance={3.5}
      />
    </>
  );
}

/**
 * Fixed, full-viewport 3D layer. Sections above it are transparent so the
 * brush + particles read as living behind/through the copy, not as a
 * decorative header canvas.
 */
export function Experience() {
  useDeviceCapability();
  const quality = useExperienceStore((s) => s.quality);
  const setQuality = useExperienceStore((s) => s.setQuality);
  const [dprOverride, setDprOverride] = useState<[number, number] | null>(null);
  const dpr = dprOverride ?? DPR_BY_QUALITY[quality];

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        camera={{ position: [0, 0.2, 6], fov: 32, near: 0.1, far: 30 }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDprOverride([1, 1]);
            if (quality === "high") setQuality("medium");
          }}
        />
        <fog attach="fog" args={["#0a0908", 4, 9]} />
        <Lighting />
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.3} />
          <BrushScene />
          <AmbientDust />
        </Suspense>
        <CameraRig />
        {quality !== "low" && (
          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.78}
              luminanceSmoothing={0.25}
              intensity={quality === "high" ? 0.4 : 0.25}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.15} darkness={0.9} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
