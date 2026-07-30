import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type NavItem = { label: string; href: string };
export type ImageRef = { src: string; alt: string };
export type ButtonRef = { label: string; href: string };
export type TitleSegment = { text: string; accent?: boolean };

export type Article = {
  title: string;
  description: string;
  publication: string;
  published_at: string;
  category: string;
  meta_display: string;
  published_label: string;
  image: ImageRef;
  url: string;
};

export type Workshop = {
  title: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  time: string;
  location: string;
  format: string;
  language: string;
  sessions: number;
  capacity: number;
  available_places: number;
  price: { amount: number; currency: string };
  meta_display: string;
  dates_display: string;
  structure_display: string;
  availability_display: string;
  price_display: string;
  image: ImageRef;
  registration_url: string;
};

export type ExperienceItem = {
  number: string;
  title: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  context: string;
  attribution_display: string;
};

export type SiteContent = {
  site: {
    name: string;
    logo_text: string;
    descriptor: string;
    language: string;
    direction: "rtl" | "ltr";
    email: string;
    location: string;
    url: string;
    /** Tiger mark alone — used where the full lockup would be illegible. */
    mark: ImageRef;
    /** Complete lockup: mark, wordmark and tagline. */
    lockup: ImageRef;
  };
  ui: {
    home_label: string;
    main_navigation_aria: string;
    mobile_navigation_aria: string;
    menu_open: string;
    menu_close: string;
    testimonial_quote_mark: string;
    menu_open_symbol: string;
    menu_close_symbol: string;
    arrow_symbol: string;
    highlight_symbol: string;
    separator_symbol: string;
    brand_home_aria: string;
    image_pending_label: string;
  };
  seo: { title: string; description: string; social_image: string };
  navigation: NavItem[];
  navigation_cta: ButtonRef;
  hero: {
    eyebrow: string;
    title_segments: TitleSegment[];
    description: string;
    note: string;
    scroll_note: string;
    primary_button: ButtonRef;
    secondary_button: ButtonRef;
    portrait: ImageRef;
  };
  writing: {
    eyebrow: string;
    title: string;
    introduction: string;
    scroller_aria: string;
    article_read_label: string;
    drag_hint: string;
    all_writing_label: string;
    all_writing_url: string;
    articles: Article[];
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    paragraphs: string[];
    portrait: ImageRef;
    highlights: string[];
  };
  workshops: {
    eyebrow: string;
    title: string;
    introduction: string;
    empty_message: string;
    reserve_label: string;
    details_labels: {
      dates: string;
      time: string;
      location: string;
      structure: string;
      availability: string;
    };
    items: Workshop[];
  };
  experience: { eyebrow: string; title: string; items: ExperienceItem[] };
  testimonials: { eyebrow: string; title: string; items: Testimonial[] };
  newsletter: {
    eyebrow: string;
    title: string;
    description: string;
    privacy_note: string;
    name_placeholder: string;
    email_placeholder: string;
    button_label: string;
    success_message: string;
    error_message: string;
    sending_label: string;
    form_action: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    email: string;
    form_action: string;
    mailto_fallback_note: string;
    fields: {
      name: string;
      email: string;
      subject: string;
      message: string;
      submit: string;
    };
    success_message: string;
    error_message: string;
    sending_label: string;
    subjects: string[];
  };
  social: { items: NavItem[] };
  footer: {
    sentence: string;
    copyright: string;
    photo_note: string;
    legal: NavItem[];
  };
};

const CONTENT_PATH = path.join(process.cwd(), "content", "site.yaml");

/**
 * Removes the line-break artifact YAML folding leaves on block scalars.
 *
 * A folded scalar (`>`) keeps a trailing newline, which renders as a stray
 * space — visible, for instance, between a quotation's closing full stop and
 * its quote mark.
 *
 * It deliberately strips ONLY whitespace containing a line break. A plain
 * leading or trailing space is meaningful content: `hero.title_segments` uses
 * them to separate the words either side of the accented segment. A blanket
 * `.trim()` welds those segments into one unbreakable token that overflows its
 * column instead of wrapping.
 */
function stripFoldArtifacts<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/^\s*[\r\n]\s*/, "").replace(/\s*[\r\n]\s*$/, "") as T;
  }
  if (Array.isArray(value)) return value.map(stripFoldArtifacts) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        stripFoldArtifacts(inner),
      ]),
    ) as T;
  }
  return value;
}

/**
 * Top-level sections the page composes. If the YAML is edited and one goes
 * missing, fail loudly here with the key name rather than letting a component
 * crash on `undefined` with a stack trace that points nowhere useful.
 */
const REQUIRED_SECTIONS = [
  "site",
  "ui",
  "seo",
  "navigation",
  "navigation_cta",
  "hero",
  "writing",
  "about",
  "workshops",
  "experience",
  "testimonials",
  "newsletter",
  "contact",
  "social",
  "footer",
] as const;

/**
 * Reads content/site.yaml from disk.
 *
 * Deliberately uncached. In production this runs once, at build time, because
 * the page is statically prerendered. In development it re-reads on every
 * request, so editing the YAML and refreshing the browser shows the change
 * immediately — Next's HMR does not watch files that aren't imported as
 * modules, so a refresh is the trigger.
 */
export function getContent(): SiteContent {
  let raw: string;
  try {
    raw = fs.readFileSync(CONTENT_PATH, "utf8");
  } catch {
    throw new Error(
      `Could not read content file at ${CONTENT_PATH}. The site has no content without it.`,
    );
  }

  let data: unknown;
  try {
    data = parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`content/site.yaml is not valid YAML.\n${detail}`);
  }

  if (data === null || typeof data !== "object") {
    throw new Error("content/site.yaml is empty or is not a YAML mapping.");
  }

  const missing = REQUIRED_SECTIONS.filter(
    (key) => !(key in (data as Record<string, unknown>)),
  );
  if (missing.length > 0) {
    throw new Error(
      `content/site.yaml is missing required top-level ${
        missing.length === 1 ? "section" : "sections"
      }: ${missing.join(", ")}`,
    );
  }

  return stripFoldArtifacts(data) as SiteContent;
}
