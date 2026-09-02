"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { artist } from "@/content/artist";
import { site } from "@/content/site";
import { transformation } from "@/content/transformation";
import { CampaignImage } from "@/components/ui/CampaignImage";
import { useExperienceStore } from "@/lib/store";
import { BrushOverlay } from "./BrushOverlay";
import { boundarySvgPathD, brushHandTiltAt, brushPositionAt, brushTiltAt } from "./path";

gsap.registerPlugin(ScrollTrigger);

const VIEW_W = 300;
const VIEW_H = 400;

/**
 * Feathers the portrait into a soft head-and-shoulders silhouette instead
 * of a visible rectangle. Split into three independent masks applied to
 * three *nested* divs (see the CENTER portrait markup below) rather than
 * one clever gradient, after tracing a real visible-rectangle bug back to
 * exactly this being a single off-center radial gradient:
 *
 * A single `radial-gradient(66% 78% at 50% 36%, ...)` sizes its 100% stop
 * as an ellipse with those radii — which, measured from a center already
 * offset toward the top (36%), reaches the *bottom* edge (64% away) at only
 * ~82% of its own radius, but reaches the *top* edge (36% away) at just
 * ~46% of it. The gradient's stops were tuned to look right at the bottom;
 * at the top edge that same math left alpha at ~90%+ — i.e. the box's own
 * hard rectangular boundary was hit while the mask was still nearly fully
 * opaque there, which is exactly what reads as "a visible rectangle" (most
 * noticeable at the top and sides, since the shoulder-heavy bottom fade
 * happened to mostly hide the same bug there).
 *
 * A single radial gradient can't fix this: an off-center ellipse with one
 * radius pair *cannot* simultaneously finish fading before a near edge and
 * a far edge. So the organic core (this constant) only has to look right
 * in the middle of the frame — CORE_EDGE_SAFETY_X/Y below independently
 * *guarantee* zero alpha at all four edges, regardless of the core's own
 * math, by being applied as their own nested mask layers (nested `mask-image`
 * uses are multiplicative — no `mask-composite` needed, which also sidesteps
 * that property's inconsistent cross-browser support).
 */
const PORTRAIT_CORE_MASK =
  "radial-gradient(70% 82% at 50% 42%, rgba(0,0,0,1) 38%, rgba(0,0,0,0.9) 58%, rgba(0,0,0,0.5) 76%, rgba(0,0,0,0.15) 90%, rgba(0,0,0,0) 100%)";
/** Guarantees the left/right edges reach zero alpha, independent of the core mask above. */
const PORTRAIT_EDGE_SAFETY_X =
  "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 13%, rgba(0,0,0,1) 87%, rgba(0,0,0,0) 100%)";
/**
 * Guarantees the top/bottom edges reach zero alpha. The bottom gets a much
 * longer runway (fade starts at 52%) than the top (fade starts at 88%) so
 * shoulders dissolve gradually while the hairline isn't eaten into as much.
 */
const PORTRAIT_EDGE_SAFETY_Y =
  "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 100%)";

/**
 * A large, very soft warm halo shared by the whole section (portrait,
 * timeline, and the quiet corner behind the bio copy) — this is what ties
 * everything into "one cinematic composition" rather than each element
 * having its own isolated treatment. Sits behind the grid content; kept to
 * three broad, low-opacity gold/champagne/brown blobs rather than any hard
 * shape, so it reads as ambient light, not a visible glow outline.
 */
const AMBIENT_ATMOSPHERE = `
  radial-gradient(50% 60% at 48% 40%, rgba(201,162,77,0.10) 0%, rgba(201,162,77,0) 72%),
  radial-gradient(34% 42% at 84% 26%, rgba(232,201,145,0.07) 0%, rgba(232,201,145,0) 72%),
  radial-gradient(30% 38% at 12% 74%, rgba(150,112,68,0.05) 0%, rgba(150,112,68,0) 72%)
`;

/**
 * Vertical anchor offset for the brush wrapper, so the rendered bristle
 * *tip* — not the wrapper's own arbitrary center — lands on the boundary
 * point driven by path.ts. Derived from BrushOverlay.tsx's camera/group
 * setup: the tip sits at local y=1.85 (MakeupBrush.tsx's calibrated
 * envelope), scaled by BrushOverlay's outer group scale (0.62) to a
 * view-space y of ~1.147. With the camera at z=7 and a 22° vertical FOV
 * looking at the origin, the frustum's half-height at that depth is
 * 7·tan(11°) ≈ 1.361, putting the tip ~84.3% up the frame, i.e. ~7.9% down
 * from the top — that's where this wrapper needs to translate to, not an
 * eyeballed fraction of its own box.
 *
 * The same 7.9% also has to be the wrapper's `transform-origin` (see the
 * JSX below), not just its translate offset. CSS's default origin is the
 * box's own center, so any `rotate()` swings the box (and the tip inside
 * it) around that center — for a small tilt the resulting tip drift is
 * negligible, but applyProgress below layers on brushHandTiltAt's own
 * extra rotation for a more expressive brushing motion, and that would
 * visibly walk the tip off the reveal boundary under the default origin.
 * Pivoting at the tip instead means rotation only ever swings the brush
 * *body* around a fixed tip — exactly the "arcing stroke, tip planted"
 * look this is going for, and it holds regardless of how much rotation
 * is added on top.
 */
const BRUSH_TIP_ANCHOR_Y = 7.9;
const BRUSH_TIP_TOP_OFFSET = `-${BRUSH_TIP_ANCHOR_Y}%`;

/**
 * The site's central set piece: an artist bio, a three-stage timeline, and
 * a before/after portrait whose reveal boundary is a curve running the
 * full height of the face. At progress 0 "before" is 100% visible and
 * "after" is fully hidden; as progress advances the boundary sweeps in
 * from the right and travels down the face, clearing top-to-bottom so the
 * three stages on the right read as upper → central → final areas, until
 * "after" is 100% visible at progress 1 (see path.ts). The brush overlay
 * tracks that same boundary at its own row, so everything above it has
 * already resolved to "after" while everything below is still "before" —
 * it reads as leading the reveal, not an independent element that happens
 * to pass over it.
 */
export function Transformation() {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const brushWrapperRef = useRef<HTMLDivElement>(null);
  const portraitSizeRef = useRef({ width: VIEW_W, height: VIEW_H });
  const [activeStage, setActiveStage] = useState(0);
  const initialPathD = boundarySvgPathD(0, VIEW_W, VIEW_H);
  const setTransformationActive = useExperienceStore((s) => s.setTransformationActive);
  const transformationActive = useExperienceStore((s) => s.transformationActive);
  // Gates the before/after portrait fetches behind a generous IntersectionObserver
  // lead distance instead of loading them at mount. A one-way latch (never reset
  // back to false) — once fetched, the browser cache keeps them ready regardless
  // of scrolling back up, so re-observing would only waste a network round trip.
  const [transformationImagesReady, setTransformationImagesReady] = useState(false);

  useEffect(() => {
    const portrait = portraitRef.current;
    if (!portrait) return;
    const measure = () => {
      const rect = portrait.getBoundingClientRect();
      portraitSizeRef.current = { width: rect.width, height: rect.height };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(portrait);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Hero is exactly 100vh with zero gap above this section, so any positive
    // bottom rootMargin here would already overlap the viewport at rest (scroll
    // 0) — firing immediately instead of once the user actually starts
    // scrolling. rootMargin 0 fires the instant the section begins entering
    // the real viewport, which is still well ahead of the reveal itself: the
    // pin doesn't even engage (scrubbing hasn't started) until a further
    // "top 85%" -> "top top" scroll span past that point. Separate from the
    // pin/scrub observers below: this only ever needs to fire once, so it
    // disconnects immediately rather than tracking transformationActive's
    // on/off state.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTransformationImagesReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // This is a single pinned "poster" screen — bio, portrait and timeline
    // sharing one viewport. On narrow screens the columns stack instead,
    // which no longer fits one screen, so the pin/scrub sequence is skipped
    // there in favor of just showing the finished look.
    const supportsPinnedLayout = window.matchMedia("(min-width: 768px)").matches;

    const applyProgress = (progress: number) => {
      const path = maskPathRef.current;
      if (path) {
        path.setAttribute("d", boundarySvgPathD(progress, VIEW_W, VIEW_H));
      }

      const wrapper = brushWrapperRef.current;
      const point = brushPositionAt(progress);
      if (wrapper) {
        const { width, height } = portraitSizeRef.current;
        const angle = brushTiltAt(progress, width, height);
        // A small hand-adjustment accent layered on top of the boundary
        // slope (see brushHandTiltAt's own comment) — reads as a wrist
        // adjusting mid-stroke rather than the brush only ever tracking
        // the mask's geometry. Safe to add regardless of magnitude since
        // the wrapper's transform-origin (below) pivots at the tip, not
        // the box center, so this never moves the tip off the boundary.
        const handTilt = brushHandTiltAt(progress);
        wrapper.style.left = `${point.x * 100}%`;
        wrapper.style.top = `${point.y * 100}%`;
        // Tilt follows the boundary's local slope more closely than before
        // (0.45 vs. a barely-there 0.32) so the brush visibly angles into
        // the curve it's revealing, instead of just riding along it flat.
        wrapper.style.transform = `translate(-50%, ${BRUSH_TIP_TOP_OFFSET}) rotate(${angle * 0.45 + handTilt}deg)`;
      }

      const stage = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
      setActiveStage((prev) => (prev === stage ? prev : stage));
    };

    if (reduceMotion || !supportsPinnedLayout) {
      applyProgress(1);
      // No pin here, so there's no hard "entering the pinned state" moment —
      // fall back to intersection so the large decorative brush still hides
      // itself while this section is the one on screen.
      const observer = new IntersectionObserver(
        ([entry]) => setTransformationActive(entry.isIntersecting),
        { threshold: 0.35 }
      );
      observer.observe(section);
      return () => {
        observer.disconnect();
        setTransformationActive(false);
      };
    }

    applyProgress(0);

    const ctx = gsap.context(() => {
      // The section is visible (and the portrait already on screen) well
      // before the pin itself engages at "top top" — it scrolls into view
      // like any normal section first. Hiding the large brush only on the
      // pin's own onEnter left a window right before that where it was
      // still visible overlapping the portrait. This separate, unpinned
      // trigger starts the hide as soon as the section is mostly in view,
      // and only clears it once the section has fully scrolled away again
      // on the way back up — the pin trigger below owns the forward exit
      // (leaving into the next section) and the backward re-entry (scrolling
      // back up from a later section), so the two never fight over the
      // shared "top top" boundary.
      ScrollTrigger.create({
        trigger: section,
        scroller: document.body,
        start: "top 85%",
        end: "top top",
        onEnter: () => setTransformationActive(true),
        onLeaveBack: () => setTransformationActive(false),
      });

      ScrollTrigger.create({
        trigger: section,
        scroller: document.body,
        start: "top top",
        end: "+=180%",
        scrub: 0.7,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => applyProgress(self.progress),
      });

      // Unpinning at "+=180%" doesn't teleport this section's content away —
      // it resumes normal scroll flow from wherever it is, which still takes
      // a bit more scrolling to actually clear the viewport. Clearing the
      // flag right on the pin's own onLeave reintroduced the exact problem
      // this was built to avoid, just at the exit instead of the entry: the
      // large brush reappearing while the (now unpinned, but still visible)
      // portrait/timeline were still on screen. This trigger keeps it hidden
      // for the whole pin duration and that extra scroll-away buffer, only
      // releasing once the section has fully scrolled past the top of the
      // viewport — and re-hides immediately if scrolling back up into it.
      ScrollTrigger.create({
        trigger: section,
        scroller: document.body,
        start: "top top",
        // "bottom top" would measure the section's own natural (unpinned)
        // height, which doesn't know the pin above consumes an *extra*
        // 180% of viewport scroll before this element even starts moving
        // again — that made an earlier version of this trigger release
        // while still deep inside the pin. Matching the pin's own "+=180%"
        // coordinate system, plus a further 100% for the post-unpin
        // scroll-away, sizes this correctly regardless of the section's
        // actual content height.
        end: "+=280%",
        onEnter: () => setTransformationActive(true),
        onEnterBack: () => setTransformationActive(true),
        onLeave: () => setTransformationActive(false),
      });
    }, section);

    // next/font's `display: swap` renders a fallback font first, then swaps
    // to the real one — reflowing the bio/timeline text and shifting this
    // section's height out from under ScrollTrigger's initial measurement,
    // which briefly overlaps the following section right at the pin's end
    // boundary. Refreshing once the real fonts are in re-measures against
    // the settled layout.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      ctx.revert();
      setTransformationActive(false);
    };
  }, [setTransformationActive]);

  return (
    <section
      ref={sectionRef}
      id="artist"
      className="relative z-10 flex min-h-screen flex-col justify-center overflow-visible px-6 pb-24 pt-28 md:h-screen md:overflow-hidden md:px-14 md:pb-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: AMBIENT_ATMOSPHERE }}
      />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-14 md:grid md:grid-cols-[300px_1fr_300px] md:items-center md:gap-10">
        {/* LEFT — artist */}
        <div className="max-w-sm">
          <p className="mb-5 font-sans text-xs uppercase tracking-editorial text-foreground-muted">
            {artist.eyebrow}
          </p>
          <h2
            className="mb-7 font-serif text-4xl leading-[1.05] text-foreground md:text-5xl"
            style={{ textShadow: "0 0 40px rgba(232,201,145,0.22), 0 0 90px rgba(150,112,68,0.12)" }}
          >
            {artist.name}
          </h2>
          <p className="max-w-xs font-serif text-lg italic leading-relaxed text-foreground-muted">
            {artist.statement}
          </p>
          <button
            type="button"
            className="group mt-9 flex items-center gap-4 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-gold transition-colors duration-300 group-hover:border-gold">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <path d="M0 0L12 7L0 14V0Z" />
              </svg>
            </span>
            <span className="font-sans text-[11px] uppercase tracking-editorial text-foreground-muted transition-colors duration-300 group-hover:text-foreground">
              {transformation.watchShowreelLabel}
            </span>
          </button>
        </div>

        {/* CENTER — portrait + brush-driven reveal */}
        <div
          ref={portraitRef}
          className="relative mx-auto aspect-[3/4] h-[58vh] max-h-[640px] w-auto md:h-[64vh]"
        >
          {/* Portrait imagery, masked into a soft silhouette rather than a
              visible rectangle — both `before` and `after` sit inside this
              same three-layer masked stack (see PORTRAIT_CORE_MASK's
              comment for why it's three nested divs and not one gradient)
              so the cutout shape never changes as the reveal progresses. */}
          <div
            className="absolute inset-0"
            style={{
              maskImage: PORTRAIT_EDGE_SAFETY_X,
              WebkitMaskImage: PORTRAIT_EDGE_SAFETY_X,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          >
          <div
            className="absolute inset-0"
            style={{
              maskImage: PORTRAIT_EDGE_SAFETY_Y,
              WebkitMaskImage: PORTRAIT_EDGE_SAFETY_Y,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          >
          <div
            className="absolute inset-0"
            style={{
              maskImage: PORTRAIT_CORE_MASK,
              WebkitMaskImage: PORTRAIT_CORE_MASK,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          >
            {/* bg-transparent overrides CampaignImage's default bg-surface
                (#171310) — a hair lighter and warmer than the page's true
                black — which was otherwise showing through wherever the
                source PNG's own alpha dips below 255 near its edges
                (confirmed by inspecting the raw pixel data: both before.png
                and after.png are genuine RGBA with soft edge alpha, not
                flat-opaque images, so that fallback fill was visible as a
                faint but real color mismatch against the page background). */}
            {transformationImagesReady && (
              <CampaignImage
                src={transformation.beforeImageSrc}
                alt="Before"
                label={transformation.beforeLabel}
                seed="before"
                priority
                className="absolute inset-0 h-full w-full bg-transparent"
              />
            )}

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                {/* filterUnits is userSpaceOnUse with bounds a bit larger than
                    the viewBox: the default objectBoundingBox region clips the
                    blur/turbulence spillover right at the shape's own edges,
                    which would flatten the feathering back to a hard line. */}
                <filter
                  id="reveal-feather"
                  filterUnits="userSpaceOnUse"
                  x={-60}
                  y={-60}
                  width={VIEW_W + 120}
                  height={VIEW_H + 120}
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.012 0.02"
                    numOctaves={2}
                    seed={4}
                    result="noise"
                  />
                  <feDisplacementMap
                    in="blur"
                    in2="noise"
                    scale="26"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
                <mask id="reveal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
                  <path
                    ref={maskPathRef}
                    d={initialPathD}
                    fill="#ffffff"
                    filter="url(#reveal-feather)"
                  />
                </mask>
              </defs>
              <image
                href={transformationImagesReady ? transformation.afterImageSrc : undefined}
                x="0"
                y="0"
                width={VIEW_W}
                height={VIEW_H}
                preserveAspectRatio="xMidYMid slice"
                mask="url(#reveal-mask)"
                style={{
                  filter:
                    "contrast(1.07) saturate(0.88) brightness(0.96) sepia(0.1) hue-rotate(-6deg)",
                }}
              />
            </svg>

            {/* Darkens the outer band toward the page's near-black before the
                silhouette mask above fades it to fully transparent — without
                this, `before.jpg`'s lighter studio background would fade to
                nothing rather than reading as sinking into shadow. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 82% at 50% 42%, rgba(10,9,8,0) 36%, rgba(28,20,14,0.55) 62%, rgba(10,9,8,0.94) 82%, #0a0908 100%)",
              }}
            />

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,9,8,0) 55%, rgba(10,9,8,0.5) 100%), radial-gradient(120% 90% at 50% 0%, rgba(201,162,77,0.06) 0%, rgba(10,9,8,0) 60%)",
              }}
            />
          </div>
          </div>
          </div>

          {/* The dedicated transformation brush — kept outside the
              silhouette mask above (it's not part of the portrait cutout),
              and faded with the large decorative brush's own visibility so
              there's never a moment with one fully gone and the other not
              yet in, or vice versa. */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: transformationActive ? 1 : 0 }}
          >
            <div
              ref={brushWrapperRef}
              className="pointer-events-none absolute h-[46%] w-[40%]"
              style={{
                left: "53%",
                top: "6%",
                transform: `translate(-50%, ${BRUSH_TIP_TOP_OFFSET})`,
                transformOrigin: `50% ${BRUSH_TIP_ANCHOR_Y}%`,
              }}
            >
              <BrushOverlay />
            </div>
          </div>
        </div>

        {/* RIGHT — timeline */}
        <div className="max-w-xs md:justify-self-end">
          {transformation.stages.map((stage, i) => (
            <div key={stage.number} className="relative flex gap-5 pb-10 last:pb-0">
              <div className="relative flex w-3 shrink-0 flex-col items-center">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-500 ${
                    i <= activeStage ? "bg-gold" : "bg-white/15"
                  }`}
                  style={
                    i === activeStage
                      ? { boxShadow: "0 0 14px 3px rgba(232,201,145,0.35)" }
                      : undefined
                  }
                />
                {i < transformation.stages.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-white/10" />
                )}
              </div>
              <div>
                <p
                  className={`font-sans text-xs tabular-nums transition-colors duration-500 ${
                    i <= activeStage ? "text-gold" : "text-foreground-muted"
                  }`}
                >
                  {stage.number}
                </p>
                <p className="mt-1 font-sans text-xs uppercase tracking-editorial text-foreground">
                  {stage.title}
                </p>
                <p className="mt-2 max-w-[13rem] font-sans text-sm text-foreground-muted">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM bar */}
      <div className="absolute inset-x-0 bottom-8 flex items-center justify-between px-6 md:px-14">
        <div />

        <div className="hidden items-center gap-3 font-sans text-[11px] uppercase tracking-editorial text-foreground-muted sm:flex">
          <span className={activeStage === 0 ? "text-gold" : undefined}>01</span>
          <span className="relative h-px w-16 bg-white/15">
            <span
              className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500"
              style={{ width: `${(activeStage / 2) * 100}%` }}
            />
          </span>
          <span className={activeStage === 2 ? "text-gold" : undefined}>03</span>
        </div>

        <div className="flex items-center gap-6 font-sans text-[11px] uppercase tracking-editorial text-foreground-muted">
          <Link href={site.social.instagram} className="hidden transition-colors duration-300 hover:text-foreground md:inline" target="_blank" rel="noopener noreferrer">
            Instagram
          </Link>
          <Link href={site.social.tiktok} className="hidden transition-colors duration-300 hover:text-foreground lg:inline" target="_blank" rel="noopener noreferrer">
            TikTok
          </Link>
          <span className="flex items-center gap-2">
            {transformation.scrollCue}
            <span className="h-8 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
          </span>
        </div>
      </div>
    </section>
  );
}
