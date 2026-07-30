import type { SiteContent } from "@/lib/content";
import { formatDateRange, formatPrice } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { SectionHeader } from "@/components/SectionHeader";

export function Workshops({
  workshops,
}: {
  workshops: SiteContent["workshops"];
}) {
  return (
    <section className="section" id="workshops" aria-labelledby="workshops-title">
      <div className="container">
        <SectionHeader
          title={workshops.title}
          introduction={workshops.introduction}
          id="workshops-title"
        />

        <ul className="workshops">
          {workshops.items.map((workshop) => {
            const soldOut = workshop.available_places <= 0;

            return (
              <li key={workshop.slug} className="workshop">
                <Figure
                  image={workshop.image}
                  ratio="3 / 2"
                  sizes="(max-width: 860px) 100vw, 40vw"
                  className="workshop__figure"
                />

                <div className="workshop__body">
                  <h3 className="workshop__title">{workshop.title}</h3>
                  <p className="workshop__description">{workshop.description}</p>

                  <dl className="workshop__details">
                    <div>
                      <dt>Dates</dt>
                      <dd>
                        {formatDateRange(workshop.start_date, workshop.end_date)}
                      </dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{workshop.time}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>
                        {workshop.location} · {workshop.format}
                      </dd>
                    </div>
                    <div>
                      <dt>Language</dt>
                      <dd>{workshop.language}</dd>
                    </div>
                    <div>
                      <dt>Sessions</dt>
                      <dd>{workshop.sessions}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>
                        {formatPrice(
                          workshop.price.amount,
                          workshop.price.currency,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="workshop__footer">
                    <p
                      className={`workshop__places${soldOut ? " workshop__places--full" : ""}`}
                    >
                      {soldOut
                        ? "Fully booked"
                        : `${workshop.available_places} of ${workshop.capacity} places left`}
                    </p>

                    <a
                      className="btn btn--primary"
                      href={workshop.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
