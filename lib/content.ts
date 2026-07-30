import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type NavItem = { label: string; href: string };
export type ImageRef = { src: string; alt: string };
export type ButtonRef = { label: string; href: string };

export type Article = {
  title: string;
  description: string;
  publication: string;
  published_at: string;
  category: string;
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
  image: ImageRef;
  registration_url: string;
};

export type Testimonial = { quote: string; name: string; context: string };

export type SiteContent = {
  site: {
    name: string;
    logo_text: string;
    language: string;
    email: string;
    url: string;
  };
  seo: { title: string; description: string; social_image: string };
  navigation: NavItem[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primary_button: ButtonRef;
    secondary_button: ButtonRef;
    portrait: ImageRef;
  };
  writing: { title: string; introduction: string; articles: Article[] };
  about: {
    title: string;
    lead: string;
    paragraphs: string[];
    portrait: ImageRef;
    highlights: string[];
  };
  workshops: { title: string; introduction: string; items: Workshop[] };
  testimonials: { title: string; items: Testimonial[] };
  newsletter: {
    eyebrow: string;
    title: string;
    description: string;
    provider: string;
    form_action: string;
  };
  contact: {
    title: string;
    description: string;
    email: string;
    subjects: string[];
  };
  social: { instagram?: string; facebook?: string; linkedin?: string };
  footer: { sentence: string; copyright: string };
};

const CONTENT_PATH = path.join(process.cwd(), "content", "site.yaml");

/**
 * Trims every string in the parsed tree.
 *
 * YAML folded scalars (`>`) preserve a trailing newline, which renders as a
 * stray space — visible, for example, between a quotation's final full stop and
 * its closing quote mark. No content field wants surrounding whitespace, so
 * stripping it everywhere is safe and removes a whole class of typographic bug.
 */
function deepTrim<T>(value: T): T {
  if (typeof value === "string") return value.trim() as T;
  if (Array.isArray(value)) return value.map(deepTrim) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, deepTrim(inner)]),
    ) as T;
  }
  return value;
}

/**
 * Top-level sections the page composition depends on. If the YAML is edited and
 * one of these goes missing, fail loudly here with the key name rather than
 * letting a component crash on `undefined` with a stack trace that points
 * nowhere useful.
 */
const REQUIRED_SECTIONS = [
  "site",
  "seo",
  "navigation",
  "hero",
  "writing",
  "about",
  "workshops",
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

  return deepTrim(data) as SiteContent;
}

/** Formats an ISO date (YYYY-MM-DD) for display, e.g. "12 June 2026". */
export function formatDate(iso: string, locale = "en-GB"): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Formats a date range, collapsing a shared month/year where possible. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso} – ${endIso}`;
  }
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const startFmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "long",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(start);
  return `${startFmt} – ${formatDate(endIso)}`;
}

/** Formats a price using the currency code from the YAML. */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code — show the raw values rather than throwing.
    return `${amount} ${currency}`;
  }
}

/** Builds a mailto: URL with the subject pre-filled. */
export function mailto(email: string, subject?: string): string {
  return subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
}
