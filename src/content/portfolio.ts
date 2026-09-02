import type { ServiceCategory } from "@/types/booking";

export interface PortfolioItem {
  id: string;
  title: string;
  category: ServiceCategory;
  imageSrc: string;
  description?: string;
  /** Relative depth used to place the panel in the immersive gallery scene. */
  depth: number;
  /** Deliberately varied per item so the gallery reads as curated, not gridded. */
  aspect: "3/4" | "4/5" | "1/1" | "2/3";
}

export const portfolio: PortfolioItem[] = [
  { id: "p2", title: "Noir", category: "editorial", imageSrc: "/images/portfolio/02.jpg", depth: -1.4, aspect: "3/4" },
  { id: "p3", title: "Prirodni sjaj", category: "soft-glam", imageSrc: "/images/portfolio/03.jpg", depth: -0.6, aspect: "1/1" },
  { id: "p4", title: "Rozo zlato", category: "full-glam", imageSrc: "/images/portfolio/04.jpg", depth: -2.1, aspect: "4/5" },
  { id: "p5", title: "Zlatni čas", category: "editorial", imageSrc: "/images/portfolio/05.jpg", depth: -1, aspect: "3/4" },
  { id: "p6", title: "Rosnati sjaj", category: "full-glam", imageSrc: "/images/portfolio/06.jpg", depth: -1.8, aspect: "2/3" },
];
