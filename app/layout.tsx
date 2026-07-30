import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { getContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Metadata comes from the `seo` block in content/site.yaml, so editing the YAML
 * updates the browser tab and social previews along with the page body.
 */
export function generateMetadata(): Metadata {
  const { seo, site } = getContent();

  return {
    metadataBase: new URL(site.url),
    alternates: { canonical: "/" },
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName: site.name,
      type: "website",
      url: site.url,
      // Only advertise a social image once the file actually exists — a broken
      // og:image renders as a blank card wherever the link is shared.
      ...(imageExists(seo.social_image)
        ? { images: [{ url: seo.social_image }] }
        : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { site } = getContent();

  return (
    <html lang={site.language} className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
