import type { SiteContent } from "@/lib/content";
import { formatDate } from "@/lib/content";
import { Figure } from "@/components/Figure";
import { SectionHeader } from "@/components/SectionHeader";

export function Writing({ writing }: { writing: SiteContent["writing"] }) {
  return (
    <section className="section" id="writing" aria-labelledby="writing-title">
      <div className="container">
        <SectionHeader
          title={writing.title}
          introduction={writing.introduction}
          id="writing-title"
        />

        <ul className="articles">
          {writing.articles.map((article) => (
            <li key={article.url + article.title} className="article">
              <a
                className="article__link"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Figure
                  image={article.image}
                  ratio="3 / 2"
                  sizes="(max-width: 860px) 100vw, 45vw"
                  className="article__figure"
                />

                <p className="article__meta">
                  <span className="article__category">{article.category}</span>
                  <span className="article__dot" aria-hidden="true">
                    ·
                  </span>
                  <time dateTime={article.published_at}>
                    {formatDate(article.published_at)}
                  </time>
                </p>

                <h3 className="article__title">{article.title}</h3>
                <p className="article__description">{article.description}</p>
                <p className="article__publication">
                  {article.publication}
                  <span className="article__arrow" aria-hidden="true">
                    →
                  </span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
