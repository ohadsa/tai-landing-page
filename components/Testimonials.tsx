import type { SiteContent } from "@/lib/content";

export function Testimonials({
  testimonials,
}: {
  testimonials: SiteContent["testimonials"];
}) {
  if (testimonials.items.length === 0) return null;

  return (
    <section
      className="section section--tint"
      aria-labelledby="testimonials-title"
    >
      <div className="container">
        <h2 className="section__title section__title--centred" id="testimonials-title">
          {testimonials.title}
        </h2>

        <ul className="testimonials">
          {testimonials.items.map((item) => (
            <li key={item.name + item.context} className="testimonial">
              <figure>
                <blockquote className="testimonial__quote">
                  {item.quote}
                </blockquote>
                <figcaption className="testimonial__author">
                  <span className="testimonial__name">{item.name}</span>
                  <span className="testimonial__context">{item.context}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
