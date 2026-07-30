import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";

type SiteFooterProps = {
  site: SiteContent["site"];
  social: SiteContent["social"];
  footer: SiteContent["footer"];
};

export function SiteFooter({ site, social, footer }: SiteFooterProps) {
  // The footer's dark ground is what this logo was drawn for, so the full
  // lockup belongs here rather than squeezed into the header bar.
  const hasLockup = imageExists(site.lockup.src);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
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
            <p className="footer-sentence">{footer.sentence}</p>
          </div>

          <ul className="footer-links">
            {social.items.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>

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
