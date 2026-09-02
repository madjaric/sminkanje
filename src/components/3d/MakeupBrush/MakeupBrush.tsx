"use client";

import { useBrushModel } from "./useBrushModel";

/**
 * The generated 3D brush model (see useBrushModel.ts), recentered and
 * uniformly rescaled so its local envelope matches the procedural brush it
 * replaced — handle base at y≈-2.16, bristle tip at y≈1.85 — since every
 * other file that positions or frames "the brush" (useBrushRig's keyframes,
 * BrushScene's tip light/particle placement, BrushOverlay's camera, and
 * path.ts's contact-point math for the Transformation reveal) was tuned
 * against that envelope and shouldn't need to change.
 *
 * The source GLB (public/models/brush-original.glb, inspected via
 * gltf-transform before integrating) is already Y-up with bristles toward
 * +Y — no rotation or axis correction needed — with its origin at the very
 * bottom of the handle (bboxMin.y = 0) and its bristle tip at
 * bboxMax.y ≈ 1.9003. Matching the old envelope is therefore a single
 * uniform scale (never non-uniform — that would distort the model) plus a
 * Y offset:
 *   scale  = (1.85 - (-2.16)) / 1.9003 ≈ 2.1104
 *   offset = -2.16 (shifts the handle-bottom origin, y=0, down to -2.16)
 */
const MODEL_SCALE = 2.1104;
const MODEL_Y_OFFSET = -2.16;

export function MakeupBrush() {
  const model = useBrushModel();

  return (
    <group dispose={null}>
      <primitive object={model} scale={MODEL_SCALE} position={[0, MODEL_Y_OFFSET, 0]} />
    </group>
  );
}
