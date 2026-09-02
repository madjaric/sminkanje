export const artist = {
  name: "Mila Vuković",
  eyebrow: "Umetnica",
  statement:
    "Petnaest godina izučavanja kako svetlost putuje kožom — da bi svaki look koji kreiram delovao neizbežno, a ne našminkano.",
  // Intentionally unset: drop a real photo at /public/images/artist-portrait.jpg
  // and set this path to use it. Left empty rather than pointed at a stand-in
  // photo of someone else, since this slot claims a specific real identity.
  portraitSrc: undefined as string | undefined,
  portraitAlt: "Portret vizažistkinje Mile Vuković",
};
