import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";

export function About({ about }: { about: SiteContent["about"] }) {
  return (
    <section className="section section--tint" id="about" aria-labelledby="about-title">
      <div className="container about__inner">
        <Figure
          image={about.portrait}
          ratio="4 / 5"
          sizes="(max-width: 860px) 100vw, 38vw"
          className="about__portrait"
        />

        <div className="about__body">
          <h2 className="section__title" id="about-title">
            {about.title}
          </h2>
          <p className="about__lead">{about.lead}</p>

          {about.paragraphs.map((paragraph, index) => (
            <p key={index} className="about__paragraph">
              {paragraph}
            </p>
          ))}

          {about.highlights.length > 0 ? (
            <ul className="about__highlights">
              {about.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
