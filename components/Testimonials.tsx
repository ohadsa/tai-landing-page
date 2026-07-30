import type { SiteContent } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

type TestimonialsProps = {
  testimonials: SiteContent["testimonials"];
  ui: SiteContent["ui"];
};

export function Testimonials({ testimonials, ui }: TestimonialsProps) {
  if (testimonials.items.length === 0) return null;

  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="container">
        <Reveal>
          <p className="eyebrow">{testimonials.eyebrow}</p>
          <h2 className="section-title" id="testimonials-title">
            {testimonials.title}
          </h2>
        </Reveal>

        <ul className="testimonial-grid">
          {testimonials.items.map((item, index) => (
            // The <li> stays the grid item so the 1px gap keeps drawing the
            // hairlines between cells; the reveal wrapper sits inside it.
            <li className="testimonial" key={item.attribution_display}>
              <Reveal index={index}>
                <figure>
                  <span className="quote-mark" aria-hidden="true">
                    {ui.testimonial_quote_mark}
                  </span>
                  <blockquote>{item.quote}</blockquote>
                  <figcaption>{item.attribution_display}</figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
