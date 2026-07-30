import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { Reveal } from "@/components/Reveal";

type AboutProps = {
  about: SiteContent["about"];
  ui: SiteContent["ui"];
};

export function About({ about, ui }: AboutProps) {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="container about-grid">
        <Reveal className="about-portrait">
          <div className="about-portrait-wrap">
            <Figure
              image={about.portrait}
              sizes="(max-width: 980px) 80vw, 38vw"
              pendingLabel={ui.image_pending_label}
            />
          </div>
        </Reveal>

        <div className="about-content">
          <Reveal>
            <p className="eyebrow">{about.eyebrow}</p>
            <h2 className="section-title" id="about-title">
              {about.title}
            </h2>
            <p className="about-lead">{about.lead}</p>
          </Reveal>

          <Reveal className="about-paragraphs">
            {about.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </Reveal>

          <Reveal>
            <ul className="highlights">
              {about.highlights.map((highlight) => (
                <li key={highlight}>
                  <span className="highlight-symbol" aria-hidden="true">
                    {ui.highlight_symbol}
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
