import { getContent } from "@/lib/content";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Writing } from "@/components/Writing";
import { About } from "@/components/About";
import { Workshops } from "@/components/Workshops";
import { Testimonials } from "@/components/Testimonials";
import { Newsletter } from "@/components/Newsletter";
import { Contact } from "@/components/Contact";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  const content = getContent();

  return (
    <>
      <Nav logoText={content.site.logo_text} items={content.navigation} />
      <main>
        <Hero hero={content.hero} />
        <Writing writing={content.writing} />
        <About about={content.about} />
        <Workshops workshops={content.workshops} />
        <Testimonials testimonials={content.testimonials} />
        <Newsletter newsletter={content.newsletter} />
        <Contact contact={content.contact} />
      </main>
      <SiteFooter footer={content.footer} social={content.social} />
    </>
  );
}
