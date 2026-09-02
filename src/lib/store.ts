import { create } from "zustand";

export type BrushState = "idle" | "float" | "travel" | "apply" | "swipe" | "exit";

export type SceneId =
  | "hero"
  | "artist"
  | "transformation"
  | "services"
  | "portfolio"
  | "booking-cta";

interface ExperienceStore {
  /** 0..1 progress through the entire scrollable journey. */
  scrollProgress: number;
  setScrollProgress: (value: number) => void;

  activeScene: SceneId;
  setActiveScene: (scene: SceneId) => void;

  brushState: BrushState;
  setBrushState: (state: BrushState) => void;

  /**
   * True while the Transformation section's own dedicated foreground brush
   * (BrushOverlay) is active — the large persistent decorative brush reads
   * it to fade itself out, since the two must never compete for attention.
   */
  transformationActive: boolean;
  setTransformationActive: (value: boolean) => void;

  /**
   * True while the Services, Portfolio, or final Booking section is on
   * screen — each is its own clean, brush-free composition, so the large
   * decorative brush reads these (an IntersectionObserver against the real
   * section element, not a guess from scroll-progress fractions) to hide
   * itself the same way it does for transformationActive.
   */
  servicesActive: boolean;
  setServicesActive: (value: boolean) => void;
  portfolioActive: boolean;
  setPortfolioActive: (value: boolean) => void;
  bookingActive: boolean;
  setBookingActive: (value: boolean) => void;

  /** Resolved once on mount; drives adaptive quality across the 3D layer. */
  quality: "high" | "medium" | "low";
  setQuality: (quality: "high" | "medium" | "low") => void;

  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (value) => set({ scrollProgress: value }),

  activeScene: "hero",
  setActiveScene: (scene) => set({ activeScene: scene }),

  brushState: "idle",
  setBrushState: (state) => set({ brushState: state }),

  transformationActive: false,
  setTransformationActive: (value) => set({ transformationActive: value }),

  servicesActive: false,
  setServicesActive: (value) => set({ servicesActive: value }),
  portfolioActive: false,
  setPortfolioActive: (value) => set({ portfolioActive: value }),
  bookingActive: false,
  setBookingActive: (value) => set({ bookingActive: value }),

  quality: "high",
  setQuality: (quality) => set({ quality }),

  reducedMotion: false,
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));
