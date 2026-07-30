import type { SiteContent } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export function Experience({
  experience,
}: {
  experience: SiteContent["experience"];
}) {
  return (
    <section className="experience" aria-labelledby="experience-title">
      <div className="container experience-layout">
        <Reveal className="experience-title">
          <p className="eyebrow">{experience.eyebrow}</p>
          <h2 className="section-title" id="experience-title">
            {experience.title}
          </h2>
        </Reveal>

        <ul className="experience-list">
          {experience.items.map((item, index) => (
            <li key={item.number}>
              <Reveal index={index}>
                <article className="experience-item">
                  <span className="experience-number">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
