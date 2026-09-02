"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

/**
 * The generated brush asset — a single-mesh PBR model (glossy black handle,
 * champagne-gold ferrule, dense sculpted bristle head baked directly into
 * the geometry) exported from an image-to-3D pipeline. Optimized for the
 * web from the master `public/models/brush-original.glb` via gltf-transform
 * (Draco geometry compression + WebP textures resized to 1024px — see PR
 * notes for the full before/after inspection); this is the file every
 * on-site brush instance actually loads.
 */
const BRUSH_MODEL_URL = "/models/brush-web.glb";

/**
 * `useGLTF` caches the parsed GLTF by URL, so every caller — the persistent
 * decorative brush and the Transformation section's dedicated brush alike —
 * shares one fetch/parse of the model. A THREE.Object3D can only live in one
 * place in the scene graph at a time, though, so each instance still needs
 * its own clone; `.clone(true)` duplicates the node hierarchy and transforms
 * while leaving geometry/material/texture references shared, which is what
 * keeps this to a single GPU upload of the heavy data per canvas.
 */
export function useBrushModel() {
  const { scene } = useGLTF(BRUSH_MODEL_URL);
  return useMemo(() => scene.clone(true), [scene]);
}

useGLTF.preload(BRUSH_MODEL_URL);
