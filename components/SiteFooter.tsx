import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import { SocialIcon } from "@/components/SocialIcon";
import { isConfiguredEndpoint } from "@/lib/forms";

type SiteFooterProps = {
  site: SiteContent["site"];
  social: SiteContent["social"];
  footer: SiteContent["footer"];
};

export function SiteFooter({ site, social, footer }: SiteFooterProps) {
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
                  <a href={item.href} aria-label={item.label}>
                    <SocialIcon name={item.icon} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <ul className="footer-legal">
            {footer.legal.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          <span>{footer.photo_note}</span>
        </div>
      </div>
    </footer>
  );
}
