import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sminkanje — Umetnost šminkanja",
  description:
    "Interaktivno iskustvo umetnosti šminkanja. Jedna četkica. Jedna neprekidna priča.",
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
