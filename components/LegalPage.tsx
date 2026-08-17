import Link from "next/link";
import { getContent, type LegalDocument } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocumentBody } from "@/components/LegalDocumentBody";

/**
 * A legal document on a page of its own, at /privacy or /accessibility.
 *
 * The footer opens these documents in a dialog instead of navigating, so this
 * route is the fallback rather than the usual path in: it serves a direct link,
 * a link opened in a new tab, a search engine, and any visitor whose JavaScript
 * did not run. A statement the law requires should not exist only inside a
 * script, and the text is shared with the dialog so the two cannot diverge.
 *
 * Reads the surrounding chrome itself rather than taking it as props: the header
 * and footer are composed per page here (app/page.tsx does the same) instead of
 * living in the root layout.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  const content = getContent();

  return (
    <>
      <SiteHeader
        site={content.site}
        ui={content.ui}
        navigation={content.navigation}
        navigationCta={content.navigation_cta}
        hasMark={imageExists(content.site.mark.src)}
        // The YAML's hrefs are bare fragments meant for the one-page site.
        // From here they have to travel home before they can scroll.
        hrefPrefix="/"
      />

      <main className="legal">
        <article className="container legal-inner">
          <LegalDocumentBody doc={doc} />

          <p className="legal-back">
            <Link href="/">{content.legal.back_label}</Link>
          </p>
        </article>
      </main>

      <SiteFooter
        site={content.site}
        social={content.social}
        footer={content.footer}
        legal={content.legal}
      />
    </>
  );
}
