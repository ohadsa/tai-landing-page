import type { Metadata, Viewport } from "next";
import { Noto_Sans_Hebrew, Noto_Serif_Hebrew } from "next/font/google";
import { getContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import "./globals.css";

const sans = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-sans-he",
  display: "swap",
});

const serif = Noto_Serif_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-serif-he",
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
    // Stamps the deployed commit into the page so you can confirm which version
    // is live: view source and look for <meta name="build">.
    other: {
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    },
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName: site.name,
      type: "website",
      url: site.url,
      locale: site.language,
      // Only advertise a social image once the file exists — a broken og:image
      // renders as a blank card wherever the link is shared.
      ...(imageExists(seo.social_image)
        ? { images: [{ url: seo.social_image }] }
        : {}),
    },
  };
}

export const viewport: Viewport = {
  /**
   * Paints the browser chrome above the page — the status bar strip on iOS,
   * the toolbar on Android.
   *
   * Must equal --cream exactly. The scrolled header renders cream at 84% over
   * a cream page, so anything else leaves a visible seam right above it. The
   * reference template shipped #f6eee3 here, one shade off the palette.
   */
  themeColor: "#f7f0e7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { site } = getContent();

  return (
    <html
      lang={site.language}
      dir={site.direction}
      className={`${sans.variable} ${serif.variable}`}
      // The inline script below adds `js` to this element before React
      // hydrates, so the class list it finds never matches what the server
      // rendered. Scoped to <html>; it does not mask mismatches anywhere else.
      suppressHydrationWarning
    >
      <head>
        {/*
          Marks that scripting is available. The scroll-reveal animation hides
          content until an observer reveals it, so without this flag a failed or
          disabled bundle would leave the page blank. CSS only applies the
          hidden state under `.js`.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
