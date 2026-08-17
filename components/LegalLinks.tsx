"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import type { LegalKey, LegalLink, SiteContent } from "@/lib/content";
import { isConfiguredEndpoint } from "@/lib/forms";
import { LegalDialog } from "@/components/LegalDialog";

/**
 * The footer's legal links, which open their document over the page.
 *
 * Each link keeps its real href. Only an ordinary left click is intercepted, so
 * every other way of following a link still works: opening in a new tab, the
 * middle button, copying the address, a crawler reading the markup, or a click
 * that lands before this script has finished loading. That is deliberate — a
 * required statement should not be reachable only through JavaScript.
 */
export function LegalLinks({
  links,
  legal,
}: {
  links: LegalLink[];
  legal: SiteContent["legal"];
}) {
  const [open, setOpen] = useState<LegalKey | null>(null);

  // An href of "#" is not an inert link: the browser reads it as the top of the
  // document, so a placeholder would throw the reader back to the hero.
  const configured = links.filter((item) => isConfiguredEndpoint(item.href));
  if (configured.length === 0) return null;

  function onClick(event: MouseEvent<HTMLAnchorElement>, key: LegalKey) {
    // Leave every modified click to the browser, so "open in new tab" and
    // "copy link address" keep behaving as the reader expects.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    setOpen(key);
  }

  return (
    <>
      <ul className="footer-legal">
        {configured.map((item) => (
          <li key={item.label}>
            {item.document ? (
              <a
                href={item.href}
                onClick={(event) => onClick(event, item.document as LegalKey)}
              >
                {item.label}
              </a>
            ) : item.href.startsWith("/") ? (
              // A route on this site, with no document to open: navigate
              // client-side. An absolute URL stays a plain anchor, which is
              // also what next/link expects of an external href.
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ul>

      {open ? (
        <LegalDialog
          doc={legal[open]}
          closeLabel={legal.close_label}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
