# Editing the site

Every visible string lives in **`content/site.yaml`** — including interface labels, button
text, and accessible names. Nothing else needs editing to change what the site says.

- **Locally** (`npm run dev`): save the file, refresh the browser.
- **Live**: commit and push. Vercel rebuilds automatically, roughly 40 seconds.

To confirm which version is live, view source and find `<meta name="build" content="…">`.
It holds the deployed commit's short SHA.

## Rules that will bite you

**Indentation is spaces, never tabs**, and it is meaningful. Keep the existing shape.

**Quote anything containing a colon-space** or starting with a special character:

```yaml
title: "כתיבה: תרגול"   # quotes required
```

**If the build fails, read the error.** A missing top-level section is named explicitly; a
YAML syntax error reports the line. Both fail the build rather than shipping a broken page.

## Language and direction

```yaml
site:
  language: "he"
  direction: "rtl"
```

These drive `<html lang>` and `<html dir>`. Switching `direction` to `ltr` flips the whole
layout — the CSS uses logical properties (`inset-inline-start`, not `left`), so it mirrors
without further changes.

## The hero title

The headline is built from segments so one word can be accented:

```yaml
hero:
  title_segments:
    - text: "אני כותבת על החיים שאנחנו "   # note the trailing space
    - text: "נושאות"
      accent: true                          # orange, italic
    - text: " בתוכנו."                      # note the leading space
```

**The leading and trailing spaces are load-bearing.** They are what separates the words.
Remove them and the three segments weld into one unbreakable word that overflows its column
instead of wrapping. A test guards this, but it is easy to "tidy" by accident.

## Images

Image slots render as labelled placeholders showing the path they expect. Drop a real file
at that path and it appears, with no layout shift.

| YAML field | File location | Shape |
| --- | --- | --- |
| `hero.portrait.src` | `public/images/hero-portrait.jpg` | Portrait, ~3:4 |
| `about.portrait.src` | `public/images/about-portrait.jpg` | Portrait, ~3:4 |
| `writing.articles[].image.src` | `public/images/…` | Landscape, ~1.18:1 |
| `workshops.items[].image.src` | `public/images/…` | Landscape, ~1.55:1 |
| `seo.social_image` | `public/images/hero-portrait.jpg` | 1200 × 630 px |

The path is relative to `public/`, so `/images/hero-portrait.jpg` means the file
`public/images/hero-portrait.jpg`.

Always write a real `alt`. It is read aloud by screen readers and is what shows inside the
placeholder while the file is missing. `og:image` is only advertised once the file exists —
better than a link preview that renders blank.

## Forms

Both forms are wired for **Formspree**. Create a form there and paste the endpoint:

```yaml
newsletter:
  form_action: "https://formspree.io/f/xxxxxxxx"
contact:
  form_action: "https://formspree.io/f/yyyyyyyy"
```

Until you do:

- **The newsletter section does not render at all.** A form posting nowhere clears the
  field and implies success while the address reaches no one.
- **The contact form opens the visitor's mail client** with the subject and message
  pre-filled, and says so in a note above the button.

`"#"` counts as unconfigured — the reference template used it as a placeholder, and as a
form action it silently posts to the current page.

Success, error, and sending states all read their text from the YAML
(`success_message`, `error_message`, `sending_label`).

## Workshops

Display strings are written out rather than computed, so the Hebrew reads exactly as you
want it:

```yaml
dates_display: "12 בספטמבר 2026 – 3 באוקטובר 2026"
structure_display: "4 מפגשים · עד 12 משתתפות"
availability_display: "5 מקומות נותרו"
price_display: "₪1,200"
```

The machine-readable fields beside them (`start_date`, `capacity`, `available_places`) are
kept for the `<time>` element and future use. **Update both** — nothing derives one from
the other.

Empty the `items` list and the section shows `workshops.empty_message` instead.

## Interface strings

The `ui:` block holds everything that is not body copy — menu labels, the arrow and bullet
symbols, and accessible names like `main_navigation_aria`. Translating the site means
editing this block too; nothing is hardcoded in the components.

## Checking your work

```bash
npm test       # asserts the page still renders from the YAML
npm run build
```
