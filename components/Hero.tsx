import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { HeroPortrait } from "@/components/HeroPortrait";

type HeroProps = {
  hero: SiteContent["hero"];
  site: SiteContent["site"];
  ui: SiteContent["ui"];
};

/**
 * The hero is above the fold, so it animates on load rather than on scroll — a
 * scroll reveal here would fire immediately anyway.
 *
 * It also must not be wrapped in <Reveal>: `.hero-copy` carries the
 * scroll-driven exit animation, and an element cannot hold both a reveal
 * transition and an animation on the same properties. The animation wins and
 * pins the element visible, breaking the entry.
 */
export function Hero({ hero, site, ui }: HeroProps) {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-in hero-in-1">{hero.eyebrow}</p>

          <h1 className="hero-title hero-in hero-in-2">
            {hero.title_segments.map((segment, index) => (
              <span key={index} className={segment.accent ? "accent" : undefined}>
                {segment.text}
              </span>
            ))}
          </h1>

          <p className="hero-description hero-in hero-in-3">{hero.description}</p>

          <div className="hero-actions hero-in hero-in-4">
            <a className="button primary" href={hero.primary_button.href}>
              <span>{hero.primary_button.label}</span>
              <span className="button-arrow" aria-hidden="true">
                {ui.arrow_symbol}
              </span>
            </a>
            <a className="button" href={hero.secondary_button.href}>
              {hero.secondary_button.label}
            </a>
          </div>

          <p className="hero-note hero-in hero-in-5">{hero.note}</p>
        </div>

        <div className="hero-visual hero-in hero-in-3">
          <HeroPortrait>
            <div className="portrait-frame">
              <Figure
                image={hero.portrait}
                sizes="(max-width: 980px) 83vw, 42vw"
                pendingLabel={ui.image_pending_label}
                priority
              />
            </div>
            <div className="portrait-caption">
              <span>{site.name}</span>
              <span>{site.location}</span>
            </div>
          </HeroPortrait>
        </div>
      </div>

      <div className="scroll-note">
        <span>{hero.scroll_note}</span>
        <span className="scan" aria-hidden="true" />
      </div>
    </section>
  );
}
