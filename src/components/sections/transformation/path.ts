/**
 * The reveal is a boundary curve running top-to-bottom across the face, not
 * a thin stroke traveling along a path and not a straight vertical split.
 * At progress 0 the boundary sits fully off the right edge — "before" is
 * 100% visible, nothing of "after" shows. As progress advances toward 1,
 * the boundary sweeps in from the right and travels down-and-across row by
 * row (top rows clear first, matching the "upper → central → final" staging
 * on the right), finishing fully off the left edge at progress 1 — "after"
 * is then 100% visible with nothing of "before" left. At any moment,
 * everything above the brush's current height has already resolved to
 * "after" while everything below is still "before" — the brush reads as
 * the leading edge of the transformation, not a rectangular wipe.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * How far the boundary travels once fully "passed" — from resting just
 * past the right edge to finishing just past the left edge, clearing the
 * frame completely in both directions (see baseCurve's range below).
 */
const SWEEP_DISTANCE = 1.15;
/** Vertical softness of the brush's leading edge, in the same 0..1 units as t/progress. */
const EDGE_SOFTNESS = 0.07;

/**
 * Resting (not-yet-reached) boundary position at height t (0 = hairline,
 * 1 = chin/neck) — always just beyond the right edge (>1, roughly 1.02-1.1)
 * so no "after" shows before the sweep reaches that row, but close enough
 * that the brush (which rides this same curve, see brushPositionAt) reads
 * as poised right at the edge rather than floating in empty space well
 * outside the frame. The gentle wobble carries through into the mid-sweep
 * edge shape, so the reveal line follows a soft, organic contour rather
 * than a flat rectangular one once it's part-way across.
 */
function baseCurve(t: number): number {
  return 1.04 + 0.055 * Math.sin(t * Math.PI) - 0.025 * t;
}

function smoothstep01(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/**
 * How far down the sweep has traveled, with headroom on both ends so the
 * very top row (t=0) starts completely untouched at progress 0 and the
 * very bottom row (t=1) finishes completely revealed at progress 1 — the
 * transition band itself is EDGE_SOFTNESS wide, so without this headroom
 * the extreme rows would only ever reach a half-revealed state.
 */
function sweepAt(progress: number): number {
  return -EDGE_SOFTNESS + progress * (1 + 2 * EDGE_SOFTNESS);
}

/** Normalized x (0..1) of the reveal boundary at height t, for a given scroll progress. */
export function boundaryXAt(t: number, progress: number): number {
  const dist = t - sweepAt(progress);
  const revealRaw = (EDGE_SOFTNESS - dist) / (2 * EDGE_SOFTNESS);
  const reveal = smoothstep01(revealRaw);
  return baseCurve(t) - reveal * SWEEP_DISTANCE;
}

const SAMPLES = 20;

/** Filled-region "d": everything to the right of the boundary curve (the "after" side). */
export function boundarySvgPathD(progress: number, viewW: number, viewH: number): string {
  const points: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = boundaryXAt(t, progress) * viewW;
    const y = t * viewH;
    points.push(`L ${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${viewW},0 ${points.join(" ")} L ${viewW},${viewH} Z`;
}

/** Where the brush sits: right at the current leading edge of the sweep. */
export function brushPositionAt(progress: number): Point {
  const y = Math.min(0.92, Math.max(0.06, progress));
  return { x: boundaryXAt(y, progress), y };
}

/** Brush tilt in degrees, from the boundary's local slope at the brush's height. */
export function brushTiltAt(progress: number, frameWidth: number, frameHeight: number): number {
  const y = brushPositionAt(progress).y;
  const dt = 0.015;
  const x0 = boundaryXAt(Math.max(0, y - dt), progress) * frameWidth;
  const x1 = boundaryXAt(Math.min(1, y + dt), progress) * frameWidth;
  const dx = x1 - x0;
  const dy = dt * 2 * frameHeight;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

interface WristKeyframe {
  p: number;
  deg: number;
}

/**
 * Named "wrist" positions across the stroke, each one a deliberate gesture
 * rather than a sample off a wave — this is what makes the result read as
 * a sequence of intentional adjustments instead of a periodic wiggle. The
 * four groups match the choreography brief:
 *
 *  - ENTRY (0 - 0.20): the brush arrives and leans into first contact
 *    (-3.4°), then eases off that lean as it settles into the stroke. The
 *    first segment is deliberately the widest span of the whole sequence
 *    (0 → 0.10) so this initial rotation unfolds more gradually than any
 *    later gesture — the "slightly slower" first-contact feel the tip's
 *    own (unchanged) constant-speed translation can't provide by itself.
 *  - PRIMARY SWEEP (0.20 - 0.34): a rising lean *into* the upcoming turn
 *    toward the cheek — the "lead" — arriving already angled rather than
 *    reacting to the curve after the fact.
 *  - BLENDING (0.34 - 0.72): two contrasting moments around the cheek — a
 *    pronounced rotation into the stroke (+7.4°, the biggest gesture of
 *    the sequence), a settle, then a small rotation *back* (-3.0°, the
 *    "lag") before handing off to the lower face. Reads as a wrist
 *    genuinely changing its mind mid-blend, not a mirrored bounce.
 *  - FINISHING (0.72 - 1.00): one more deliberate angle change well into
 *    the lower face, then a settle at the very end rather than the brush
 *    simply sliding out at whatever angle it last had.
 *
 * A pure function of scroll progress — not wall-clock time — so it's
 * fully deterministic and reverses cleanly when scrolling back up;
 * applying it only requires the wrapper's rotation to pivot around the
 * bristle tip (see Transformation.tsx's transform-origin), since this is
 * layered on top of, not a replacement for, the tip's own boundary-
 * following position.
 */
const WRIST_KEYFRAMES: WristKeyframe[] = [
  { p: 0.0, deg: 0 },
  { p: 0.1, deg: -3.4 },
  { p: 0.2, deg: 0.6 },
  { p: 0.34, deg: 3.2 },
  { p: 0.45, deg: 7.4 },
  { p: 0.55, deg: 1.8 },
  { p: 0.63, deg: -3.0 },
  { p: 0.72, deg: 0.4 },
  { p: 0.88, deg: 4.6 },
  { p: 1.0, deg: 1.2 },
];

/**
 * Monotonic cubic Hermite interpolation (Fritsch-Carlson) through a small
 * set of keyframes. Chosen over a raw Catmull-Rom/spline fit specifically
 * because it *cannot* overshoot past a keyframe's own value on the way to
 * it — each segment stays monotonic between its two endpoints — which is
 * what keeps every gesture above reading as "arrive here, settle" rather
 * than an elastic bounce past the target. The keyframe sequence as a
 * whole still rises and falls freely (monotonicity is only enforced
 * per-segment), which is exactly what a sequence of distinct gestures
 * needs.
 */
function monotonicCubicAt(keyframes: WristKeyframe[], p: number): number {
  const n = keyframes.length;
  if (p <= keyframes[0].p) return keyframes[0].deg;
  if (p >= keyframes[n - 1].p) return keyframes[n - 1].deg;

  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(keyframes[i + 1].p - keyframes[i].p);
    d.push((keyframes[i + 1].deg - keyframes[i].deg) / h[i]);
  }

  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] === 0 || d[i] === 0 || d[i - 1] < 0 !== d[i] < 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    if (a < 0) m[i] = 0;
    if (b < 0) m[i + 1] = 0;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }

  let seg = 0;
  for (let i = 0; i < n - 1; i++) {
    if (p >= keyframes[i].p && p <= keyframes[i + 1].p) {
      seg = i;
      break;
    }
  }
  const y0 = keyframes[seg].deg;
  const y1 = keyframes[seg + 1].deg;
  const t = (p - keyframes[seg].p) / h[seg];
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * y0 + h10 * h[seg] * m[seg] + h01 * y1 + h11 * h[seg] * m[seg + 1];
}

/** Additional rotation layered on top of the boundary-slope tilt (brushTiltAt above) — see WRIST_KEYFRAMES for the choreography this traces. */
export function brushHandTiltAt(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return monotonicCubicAt(WRIST_KEYFRAMES, p);
}
