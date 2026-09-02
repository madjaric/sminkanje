"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/store";
import { pigmentFragmentShader, pigmentVertexShader } from "./shaders";

const BASE_COUNTS = { high: 220, medium: 100, low: 36 } as const;

const INTENSITY_BY_BRUSH_STATE: Record<string, number> = {
  idle: 0.5,
  float: 0.7,
  travel: 0.6,
  apply: 1.4,
  swipe: 1.6,
  exit: 0.3,
};

interface PigmentParticlesProps {
  /** Local-space radius the cloud scatters within before drift is applied. */
  radius?: number;
  color?: string;
  /** When false, ignores brush state and holds a constant, low intensity. */
  reactive?: boolean;
  /** Multiplies the base per-quality count — use <1 for a sparse ambient field. */
  density?: number;
}

/**
 * Fine floating pigment/powder. One draw call (THREE.Points + a custom
 * shader). Sizes and brightness are both heavily skewed toward small/dim so
 * the field reads as fine cosmetic dust — a few sharp bright flecks among
 * many faint ones — rather than a uniform field of glitter dots. Intensity
 * reacts to brush state so it visibly "puffs" on apply/swipe.
 */
export function PigmentParticles({
  radius = 0.5,
  color = "#e6d3ad",
  reactive = true,
  density = 1,
}: PigmentParticlesProps) {
  const quality = useExperienceStore((s) => s.quality);
  const count = Math.max(4, Math.round(BASE_COUNTS[quality] * density));
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentIntensity = useRef(0.5);

  // Lazy useState initializer: runs exactly once per mounted instance, unlike
  // useMemo which React may discard and recompute — important since this
  // scatters particles with Math.random and must not reshuffle on rerender.
  const [geometry] = useState(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const brightness = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = Math.random() * 10;
      // Cubed bias: most particles land small (fine dust); a rare few land
      // large (soft, closer-feeling bokeh flecks).
      scales[i] = 0.18 + Math.pow(Math.random(), 3.2) * 2.6;
      // Quartic bias: most particles are dim/matte pigment; only a rare
      // fleck is bright enough to actually catch the bloom pass.
      brightness[i] = Math.pow(Math.random(), 4);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    return geo;
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const { brushState, reducedMotion } = useExperienceStore.getState();
    materialRef.current.uniforms.uTime.value = reducedMotion
      ? 0
      : state.clock.elapsedTime;

    const target = reactive ? INTENSITY_BY_BRUSH_STATE[brushState] ?? 0.5 : 0.4;
    currentIntensity.current +=
      (target - currentIntensity.current) * (reducedMotion ? 1 : 0.06);
    materialRef.current.uniforms.uIntensity.value = currentIntensity.current;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={pigmentVertexShader}
        fragmentShader={pigmentFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
