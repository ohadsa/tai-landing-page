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

The headline is built from segments so a line can be accented or set on its own row:

```yaml
hero:
  title_segments:
    - text: "תאי אתר"
    - text: "סדנאות כתיבה."
      accent: true              # orange, italic
      break_before: true        # starts a new line
```

**Every segment must be separated from the one before it** — either by `break_before: true`
or by a leading/trailing space, as in `"…שאנחנו "` followed by `"נושאות"`. With neither, the
segments weld into one unbreakable word that overflows its column instead of wrapping. A test
guards this, but spaces are easy to "tidy" away by accident.

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

A form posts to whatever `form_action` names. Any relay that accepts a `POST` of form
fields works; nothing in the code is tied to one provider.

The contact form ships pointed at **FormSubmit**, which needs no account:

```yaml
contact:
  form_action: "https://formsubmit.co/ajax/tai.atar22@gmail.com"
```

**The first submission must be activated once.** FormSubmit emails an "Activate Form" link
to that address the first time anyone presses send; until someone clicks it, submissions are
refused and the visitor sees the error message. This is deliberate on their side, so a form
cannot be pointed at a stranger's inbox.

To move to Formspree instead, create a form there and swap the URL for
`https://formspree.io/f/xxxxxxxx`. The newsletter block works the same way and is hidden
entirely while its `form_action` is empty, since a form posting nowhere clears the field and
implies success while the address reaches no one.

`"#"` counts as unconfigured: the reference template used it as a placeholder, and as a form
action it silently posts to the current page. With no endpoint at all the contact form falls
back to opening the visitor's mail client, says so in a note above the button, and confirms
afterwards with `mailto_opened_message`.

**A 2xx is not proof of delivery.** FormSubmit answers `200` with `{"success":"false"}`
before activation, and Formspree answers `200` with an `errors` array on a validation
failure. `rejectedDespiteOk` in `lib/forms.ts` catches both, so the thank-you only ever
appears for a submission that was really accepted. Add a case there for any new provider.

Success, error, and sending states all read their text from the YAML
(`success_message`, `error_message`, `sending_label`).

### Reserving a workshop place

Pressing **שמירת מקום** on a workshop card jumps to the contact form and fills it in:

```yaml
contact:
  reserve_subject: "הרשמה לסדנה"          # must be one of `subjects` below
  reserve_message: "אשמח לשמור מקום בסדנה \"{workshop}\"."
```

`{workshop}` becomes the card's title. If `reserve_subject` is not in the `subjects` list the
select would render blank, so the code leaves the subject alone in that case and a test
guards it.

## Social links

The footer draws each `social.items` entry as an icon, chosen by its `icon:` key
(`instagram`, `facebook`, `linkedin`). `label` becomes the link's accessible name.

**An item whose `href` is still `"#"` is not rendered.** The same rule as the forms: an icon
that goes nowhere looks like a working link. Paste the real profile URL and it appears.

## Workshops

Display strings are written out rather than computed, so the Hebrew reads exactly as you
want it:

```yaml
dates_display: "9 באוקטובר – 6 בנובמבר"
structure_display: "5 מפגשים · עד 12 משתתפים"
```

The machine-readable fields beside them (`start_date`, `sessions`, `capacity`) are kept for
the `<time>` element and future use. **Update both** — nothing derives one from the other.

Empty the `items` list and the section shows `workshops.empty_message` instead.

## Interface strings

The `ui:` block holds everything that is not body copy: menu labels, the arrow and separator
symbols, and accessible names like `main_navigation_aria`. Translating the site means
editing this block too; nothing is hardcoded in the components.

## Checking your work

```bash
npm test       # asserts the page still renders from the YAML
npm run build
```
