import { cn } from "@/lib/utils";

const PALETTE = ["#c9a24d", "#c08b7a", "#8a6a4f", "#e6d3ad"];

function hashToIndex(seed: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash) % mod;
}

interface EditorialFrameProps {
  label: string;
  seed?: string;
  className?: string;
}

/**
 * Stand-in for photography that hasn't been shot yet. Renders a controlled
 * gradient + grain field in brand tones with a quiet editorial label, so
 * every section reads as finished art direction rather than a broken image.
 * Swap for a real photo by rendering next/image in the parent instead.
 */
export function EditorialFrame({ label, seed = label, className }: EditorialFrameProps) {
  const a = PALETTE[hashToIndex(seed, PALETTE.length)];
  const b = PALETTE[hashToIndex(seed + "b", PALETTE.length)];

  return (
    <div
      className={cn(
        "relative flex items-end overflow-hidden border border-white/10 bg-surface",
        className
      )}
      style={{
        backgroundImage: `radial-gradient(120% 140% at 20% 0%, ${a}33 0%, transparent 60%), radial-gradient(120% 140% at 90% 100%, ${b}2b 0%, transparent 55%)`,
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06] mix-blend-overlay">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
      <span className="relative z-10 p-5 font-sans text-[10px] uppercase tracking-editorial text-foreground-muted">
        {label}
      </span>
    </div>
  );
}
