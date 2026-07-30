import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { Reveal } from "@/components/Reveal";

type WorkshopsProps = {
  workshops: SiteContent["workshops"];
  ui: SiteContent["ui"];
};

export function Workshops({ workshops, ui }: WorkshopsProps) {
  const labels = workshops.details_labels;

  return (
    <section className="workshops" id="workshops" aria-labelledby="workshops-title">
      <div className="container">
        <div className="workshop-head">
          <Reveal>
            <p className="eyebrow">{workshops.eyebrow}</p>
            <h2 className="section-title" id="workshops-title">
              {workshops.title}
            </h2>
          </Reveal>
          <Reveal>
            <p className="section-copy">{workshops.introduction}</p>
          </Reveal>
        </div>

        {workshops.items.length === 0 ? (
          <p className="workshops-empty">{workshops.empty_message}</p>
        ) : (
          <ul className="workshop-grid">
            {workshops.items.map((workshop, index) => (
              <li key={workshop.slug}>
                <Reveal index={index}>
                  <article className="workshop-card">
                    <div className="workshop-image">
                      <Figure
                        image={workshop.image}
                        sizes="(max-width: 980px) 100vw, 45vw"
                        pendingLabel={ui.image_pending_label}
                      />
                    </div>

                    <div className="workshop-body">
                      <span className="workshop-kicker">
                        {workshop.meta_display}
                      </span>
                      <h3 className="workshop-title">{workshop.title}</h3>
                      <p className="workshop-description">
                        {workshop.description}
                      </p>

                      <dl className="workshop-details">
                        <div className="detail">
                          <dt className="detail-label">{labels.dates}</dt>
                          <dd className="detail-value">
                            {workshop.dates_display}
                          </dd>
                        </div>
                        <div className="detail">
                          <dt className="detail-label">{labels.time}</dt>
                          <dd className="detail-value">{workshop.time}</dd>
                        </div>
                        <div className="detail">
                          <dt className="detail-label">{labels.location}</dt>
                          <dd className="detail-value">{workshop.location}</dd>
                        </div>
                        <div className="detail">
                          <dt className="detail-label">{labels.structure}</dt>
                          <dd className="detail-value">
                            {workshop.structure_display}
                          </dd>
                        </div>
                        <div className="detail">
                          <dt className="detail-label">{labels.availability}</dt>
                          <dd className="detail-value availability">
                            {workshop.availability_display}
                          </dd>
                        </div>
                      </dl>

                      <div className="workshop-actions">
                        <span className="price">{workshop.price_display}</span>
                        <a
                          className="button primary"
                          href={workshop.registration_url}
                        >
                          <span>{workshops.reserve_label}</span>
                          <span className="button-arrow" aria-hidden="true">
                            {ui.arrow_symbol}
                          </span>
                        </a>
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
