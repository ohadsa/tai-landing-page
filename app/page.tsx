import { getContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Writing } from "@/components/Writing";
import { About } from "@/components/About";
import { Workshops } from "@/components/Workshops";
import { Experience } from "@/components/Experience";
import { Testimonials } from "@/components/Testimonials";
import { Newsletter } from "@/components/Newsletter";
import { Contact } from "@/components/Contact";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  const content = getContent();

  return (
    <>
      <SiteHeader
        site={content.site}
        ui={content.ui}
        navigation={content.navigation}
        navigationCta={content.navigation_cta}
        // SiteHeader is a client component and cannot touch the filesystem, so
        // existence is resolved here on the server.
        hasMark={imageExists(content.site.mark.src)}
      />

      <main>
        <Hero hero={content.hero} site={content.site} ui={content.ui} />
        <Writing writing={content.writing} ui={content.ui} />
        <About about={content.about} ui={content.ui} />
        <Workshops workshops={content.workshops} ui={content.ui} />
        <Experience experience={content.experience} />
        <Testimonials testimonials={content.testimonials} ui={content.ui} />
        <Newsletter newsletter={content.newsletter} />
        <Contact contact={content.contact} />
      </main>

      <SiteFooter
        site={content.site}
        social={content.social}
        footer={content.footer}
      />
    </>
  );
}
