import type { SiteContent } from "@/lib/content";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export function SiteFooter({
  footer,
  social,
}: {
  footer: SiteContent["footer"];
  social: SiteContent["social"];
}) {
  // Empty strings in the YAML mean "no account" — skip them rather than
  // rendering a link that goes nowhere.
  const links = Object.entries(social).filter(
    ([, url]) => typeof url === "string" && url.trim() !== "",
  );

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__sentence">{footer.sentence}</p>

        {links.length > 0 ? (
          <ul className="footer__social">
            {links.map(([key, url]) => (
              <li key={key}>
                <a
                  className="link"
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SOCIAL_LABELS[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="footer__copyright">{footer.copyright}</p>
      </div>
    </footer>
  );
}
