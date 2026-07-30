import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";

export function Hero({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="hero__title">{hero.title}</h1>
          <p className="hero__description">{hero.description}</p>
          <div className="hero__actions">
            <a className="btn btn--primary" href={hero.primary_button.href}>
              {hero.primary_button.label}
            </a>
            <a className="btn btn--ghost" href={hero.secondary_button.href}>
              {hero.secondary_button.label}
            </a>
          </div>
        </div>

        <Figure
          image={hero.portrait}
          ratio="4 / 5"
          sizes="(max-width: 860px) 100vw, 42vw"
          className="hero__portrait"
          priority
        />
      </div>
    </section>
  );
}
