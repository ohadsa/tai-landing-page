import type { SiteContent } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { Reveal } from "@/components/Reveal";
import { ArticleScroller } from "@/components/ArticleScroller";

type WritingProps = {
  writing: SiteContent["writing"];
  ui: SiteContent["ui"];
};

export function Writing({ writing, ui }: WritingProps) {
  return (
    <section className="writing" id="writing" aria-labelledby="writing-title">
      <div className="container writing-head">
        <Reveal>
          <p className="eyebrow">{writing.eyebrow}</p>
          <h2 className="section-title" id="writing-title">
            {writing.title}
          </h2>
        </Reveal>
        <Reveal>
          <p className="section-copy">{writing.introduction}</p>
        </Reveal>
      </div>

      <ArticleScroller label={writing.scroller_aria}>
        {writing.articles.map((article) => (
          <article className="article-card" key={article.title}>
            <a href={article.url}>
              <div className="article-media">
                <Figure
                  image={article.image}
                  sizes="(max-width: 650px) 82vw, 31vw"
                  pendingLabel={ui.image_pending_label}
                />
              </div>

              <div className="article-meta">
                <span>{article.meta_display}</span>
                <time dateTime={article.published_at}>
                  {article.published_label}
                </time>
              </div>

              <h3 className="article-title">{article.title}</h3>
              <p className="article-description">{article.description}</p>

              <span className="article-link">
                <span>{writing.article_read_label}</span>
                <span aria-hidden="true">{ui.arrow_symbol}</span>
              </span>
            </a>
          </article>
        ))}
      </ArticleScroller>

      <div className="container writing-bottom">
        <span className="drag-hint">{writing.drag_hint}</span>
        <a className="button" href={writing.all_writing_url}>
          <span>{writing.all_writing_label}</span>
          <span className="button-arrow" aria-hidden="true">
            {ui.arrow_symbol}
          </span>
        </a>
      </div>
    </section>
  );
}
