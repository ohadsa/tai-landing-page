import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import { SocialIcon } from "@/components/SocialIcon";
import { LegalLinks } from "@/components/LegalLinks";
import { isConfiguredEndpoint } from "@/lib/forms";

type SiteFooterProps = {
  site: SiteContent["site"];
  social: SiteContent["social"];
  footer: SiteContent["footer"];
  /** The documents the footer's legal links open. */
  legal: SiteContent["legal"];
};

export function SiteFooter({ site, social, footer, legal }: SiteFooterProps) {
  // The footer's dark ground is what this logo was drawn for, so the full
  // lockup belongs here rather than squeezed into the header bar.
  const hasLockup = imageExists(site.lockup.src);
  // An icon whose href is still "#" would look like a working link and lead
  // nowhere, so it waits until a real profile URL is in the YAML.
  const socialLinks = social.items.filter((item) =>
    isConfiguredEndpoint(item.href),
  );

  return (
    <footer className="site-footer">
      <div className="container">
        <div
          className={`footer-grid${socialLinks.length === 0 ? " without-social" : ""}`}
        >
          <div>
            {hasLockup ? (
              <Image
                className="footer-lockup"
                src={site.lockup.src}
                alt={site.lockup.alt}
                width={768}
                height={720}
              />
            ) : (
              <div className="footer-name">{site.name}</div>
            )}
          </div>

          {socialLinks.length > 0 && (
            <ul className="footer-social">
              {socialLinks.map((item) => (
                <li key={item.label}>
                  {/* Profiles live on other sites, so they open alongside this
                      page rather than replacing it. noreferrer accompanies
                      noopener so the target learns nothing about the visit. */}
                  <a
                    href={item.href}
                    aria-label={item.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon name={item.icon} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          {/* Renders the links and, when one is pressed, the dialog it opens.
              A client component, because the dialog needs state; the filtering
              of unconfigured hrefs lives with it. Sits on the copyright line
              rather than in a column of its own, at the same small size. */}
          <LegalLinks links={footer.legal} legal={legal} />
        </div>
      </div>
    </footer>
  );
}
