"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SiteContent } from "@/lib/content";

type SiteHeaderProps = {
  site: SiteContent["site"];
  ui: SiteContent["ui"];
  navigation: SiteContent["navigation"];
  navigationCta: SiteContent["navigation_cta"];
  /** Resolved on the server; false means the file is missing, so fall back to
   *  the wordmark alone rather than rendering a broken image. */
  hasMark: boolean;
  /**
   * Prepended to every navigation href.
   *
   * The YAML holds bare fragments (`#writing`) because the whole site used to
   * be one page. From a document at its own route, `#writing` addresses a
   * section of *that* document and finds nothing, so the legal pages pass "/"
   * to send the reader home first. Defaults to "" — the homepage renders
   * exactly the markup it always did.
   */
  hrefPrefix?: string;
};

export function SiteHeader({
  site,
  ui,
  navigation,
  navigationCta,
  hasMark,
  hrefPrefix = "",
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 22);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Close the menu when the viewport grows past the breakpoint that hides the
  // toggle, otherwise the panel stays expanded with no way to dismiss it.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 981px)");
    const close = () => query.matches && setMenuOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, []);

  // The overlay covers the viewport, so letting the page scroll underneath
  // means dismissing it drops the reader somewhere they never chose.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Escape is the expected way out of a full-screen overlay.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className={scrolled ? "site-header scrolled" : "site-header"}>
        <div className="container nav">
          <a
            className="brand"
            href={`${hrefPrefix}#top`}
            aria-label={ui.brand_home_aria}
          >
            {hasMark ? (
              // Decorative: the link already carries an accessible name, so
              // announcing the mark as well would just repeat it.
              <Image
                className="brand-mark"
                src={site.mark.src}
                alt=""
                aria-hidden="true"
                width={768}
                height={544}
                priority
              />
            ) : null}
            <span className="logo">{site.logo_text}</span>
            <span className="brand-divider" aria-hidden="true" />
            <span className="brand-descriptor">{site.descriptor}</span>
          </a>

          <nav className="nav-links" aria-label={ui.main_navigation_aria}>
            {navigation.map((item) => (
              <a key={item.href} href={`${hrefPrefix}${item.href}`}>
                {item.label}
              </a>
            ))}
            <a className="nav-cta" href={`${hrefPrefix}${navigationCta.href}`}>
              {navigationCta.label}
            </a>
          </nav>

          <button
            type="button"
            className="menu-button"
            aria-label={menuOpen ? ui.menu_close : ui.menu_open}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">
              {menuOpen ? ui.menu_close_symbol : ui.menu_open_symbol}
            </span>
          </button>
        </div>
      </header>

      {/*
        A sibling of <header>, not a child. `.site-header.scrolled` applies
        backdrop-filter, which creates a containing block for position:fixed
        descendants — nested here, the overlay would size to the header bar
        instead of the viewport, and would paint over its own close button.
      */}
      <nav
        id="mobile-nav"
        className={menuOpen ? "mobile-nav open" : "mobile-nav"}
        aria-label={ui.mobile_navigation_aria}
      >
        <div className="mobile-nav-inner">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={`${hrefPrefix}${item.href}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href={`${hrefPrefix}${navigationCta.href}`}
            onClick={() => setMenuOpen(false)}
          >
            {navigationCta.label}
          </a>
        </div>
      </nav>
    </>
  );
}
