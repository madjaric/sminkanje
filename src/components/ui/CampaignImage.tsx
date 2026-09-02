import Image from "next/image";
import { cn } from "@/lib/utils";
import { EditorialFrame } from "./EditorialFrame";

interface CampaignImageProps {
  src?: string;
  alt: string;
  label: string;
  seed?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** CSS object-position, for source photos that need reframing. */
  focus?: string;
}

/**
 * The one place every real photo passes through before it reaches the
 * page. Ten photos pulled from ten different sources never share a
 * lighting setup or color science on their own — this wrapper forces a
 * single grade (slightly desaturated, warmed, contrast-lifted) plus a
 * shared grain and a bottom vignette that grounds any background into the
 * site's dark palette, so disparate source images read as one campaign.
 * Falls back to EditorialFrame when a slot has no photo yet.
 */
export function CampaignImage({
  src,
  alt,
  label,
  seed = label,
  className,
  sizes = "100vw",
  priority,
  focus = "50% 50%",
}: CampaignImageProps) {
  if (!src) {
    return <EditorialFrame label={label} seed={seed} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="campaign-grade object-cover"
        style={{ objectPosition: focus }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,9,8,0) 55%, rgba(10,9,8,0.55) 100%), radial-gradient(120% 90% at 50% 0%, rgba(201,162,77,0.08) 0%, rgba(10,9,8,0) 60%)",
        }}
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </div>
  );
}
