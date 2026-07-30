# Editing the site

All text, links, dates, prices, and image paths live in one file: **`content/site.yaml`**.
Nothing else needs to be touched to change what the site says.

## Changing text

Edit `content/site.yaml` and save.

- **Locally** (`npm run dev`): refresh the browser. The change appears immediately.
- **Live** (Vercel): commit and push. Vercel rebuilds automatically, roughly 40 seconds.

The site is prerendered at build time, so a live change needs a push. There is no admin
panel — editing content means editing this file.

## Rules that will bite you

**Indentation is meaningful.** YAML uses spaces, never tabs. Keep the existing indentation
exactly as it is.

**Wrap text in quotes** when it contains a colon followed by a space, or starts with a
special character:

```yaml
title: "Writing: a practice"   # quotes required — the colon would break it
```

**Long text uses `>`.** The indented block that follows is joined into one paragraph:

```yaml
description: >
  This becomes a single paragraph
  even though it is written across two lines.
```

**If the build fails**, read the error. A missing top-level section is reported by name, and
a YAML syntax error reports the line. Both fail the build rather than shipping a broken
page.

## Adding images

Image slots currently render as labelled placeholders showing the file path they expect.
Drop a real file at that path and it appears — no code change, no layout shift.

| YAML field | Put the file at | Shape |
| --- | --- | --- |
| `hero.portrait.src` | `public/images/portraits/hero.jpg` | Portrait, 4:5 |
| `about.portrait.src` | `public/images/portraits/about.jpg` | Portrait, 4:5 |
| `writing.articles[].image.src` | `public/images/articles/<name>.jpg` | Landscape, 3:2 |
| `workshops.items[].image.src` | `public/images/workshops/<name>.jpg` | Landscape, 3:2 |
| `seo.social_image` | `public/images/social-preview.jpg` | 1200 × 630 px |

The path in the YAML is relative to `public/`, so `/images/portraits/hero.jpg` means the
file `public/images/portraits/hero.jpg`.

Always write a real `alt` description. It is read aloud by screen readers, and it is what
shows inside the placeholder while the image is missing.

The social preview image is only advertised once the file exists. Until then no `og:image`
tag is emitted at all — better than a link preview that renders as a blank card.

## Turning on the newsletter

The newsletter section is **hidden** while `newsletter.form_action` is empty.

This is deliberate. A form with no action posts to the current page: the visitor watches the
field clear, assumes they subscribed, and nobody receives anything. Paste your real
Mailchimp (or other provider) form URL into `form_action` and the section appears:

```yaml
newsletter:
  provider: "mailchimp"
  form_action: "https://example.us1.list-manage.com/subscribe/post?u=...&id=..."
```

With `provider: "mailchimp"` the email field is named `EMAIL`, which is what Mailchimp
expects. Any other provider gets `email`.

## Contact

There is no contact form and no backend. Each subject in `contact.subjects` becomes a link
that opens the visitor's email client with that subject already filled in, addressed to
`contact.email`.

To change the options, edit the list. To change the destination, edit `contact.email`.

## Social links

Leave a platform as an empty string (`""`) and it is omitted from the footer entirely,
rather than rendering a link that goes nowhere:

```yaml
social:
  instagram: "https://instagram.com/example"
  facebook: ""     # not shown
  linkedin: ""     # not shown
```

## Workshops

`available_places` drives the line under each workshop. Set it to `0` and it reads
"Fully booked" instead of "N of M places left".

Dates are ISO format (`YYYY-MM-DD`) and are formatted for display automatically — a range
inside one year collapses to "12 September – 3 October 2026".

`price.currency` takes a currency code (`ILS`, `USD`, `EUR`). An unrecognised code falls
back to showing the raw number and code rather than failing the build.

## Checking your work

```bash
npm test     # asserts the page still renders from the YAML
npm run build
```
