# Tai Atar — Coming-Soon Page

**Date:** 2026-07-30
**Status:** Approved, ready for implementation planning

## Purpose

Put a credible placeholder on the Tai Atar domain today. The product it will eventually
advertise is undefined, so the page commits to nothing beyond the name. It exists to make
the domain resolve to something intentional rather than a GoDaddy parking page.

This is explicitly throwaway. When the real site is built, `app/page.tsx` is replaced
wholesale. Nothing here is designed to be extended.

## Scope

**In scope:** one static page, deployed to Vercel, served over HTTPS on the customer's
GoDaddy domain.

**Out of scope:** email capture, analytics, contact forms, social links, multiple routes,
CMS, any backend. These were considered and rejected — email capture would add a storage
dependency and a privacy obligation for a list nobody has committed to using.

## Content

The complete text of the page:

| Slot | Text |
| --- | --- |
| Wordmark | `TAI ATAR` |
| Subline | `coming soon` |
| Footer | `© 2026 Tai Atar` |

The brand name is written "Tai Atar" — two words, both capitalised — everywhere it appears
in prose, metadata, and copy. The wordmark renders it uppercase as a typographic treatment
only.

No tagline. One was considered and dropped: any tagline written now would describe a
product that does not exist yet.

## Stack

Next.js (App Router) with TypeScript and Tailwind v4, scaffolded via `create-next-app`.

A single static `index.html` would be a better technical fit for a page this size — no
build step, no dependencies, no failure modes. Next.js was chosen deliberately because the
real site is expected to be Next.js and the customer prefers to start there. This trade is
recorded, not disputed.

The page has no server code, no data fetching, and no client-side interactivity. It should
prerender to static HTML at build time.

## Structure

```
taiatar-landing-page/
├── app/
│   ├── layout.tsx      # <html>, font loading, metadata
│   ├── page.tsx        # the page
│   └── globals.css     # design tokens, glow keyframes
├── public/             # favicon, OG image
└── docs/superpowers/specs/
```

## Visual design

Dark and minimal. One full-viewport section; content centred on both axes.

| Element | Specification |
| --- | --- |
| Background | `#0a0a0b` |
| Glow | Large soft radial gradient behind the wordmark. Cool off-white with a faint violet cast. Drifts and changes opacity on a ~14s loop. Pure CSS — no image assets. |
| Wordmark | `TAI ATAR`, uppercase, `letter-spacing: 0.3em`, `font-size: clamp(1.75rem, 7vw, 4.5rem)`, colour `#f5f5f0` |
| Rule | 1px hairline, ~180px wide, gradient fading to transparent at both ends |
| Subline | Lowercase, letter-spaced, small, colour `#8a8a85` |
| Footer | Pinned to the bottom of the viewport, very low contrast |
| Entrance | Staggered fade-up on load, ~600ms total |

The faint violet cast on the glow is intentional: it distinguishes the page from a default
template. There is no brand palette yet, so it stays subtle and is trivial to change.

Fonts load through `next/font`, which self-hosts them at build time. The page must make no
runtime request to any third-party host.

### Motion and accessibility

All animation — the glow loop and the entrance transition — is disabled under
`prefers-reduced-motion: reduce`. The page must be fully legible and correctly laid out
with animation off.

Text contrast: the wordmark and subline meet WCAG AA against the background. The footer is
decorative and deliberately below AA; it carries no information the page needs.

### Responsive behaviour

Correct from 320px viewport width upward. The wordmark scales with the viewport via
`clamp()` and must never wrap to a second line or overflow horizontally.

## Metadata

`app/layout.tsx` sets: page title, description, Open Graph tags, `theme-color` matching the
background, and a favicon.

The Open Graph `url` and the metadata base require the production domain. That value is an
input the customer supplies before deployment — see Sequencing.

## Deployment

1. Commit and push to a new GitHub repository.
2. Import the repository into Vercel. Framework preset is detected automatically; no build
   configuration is needed.
3. Add the customer's domain in the Vercel project's Domains settings, both apex and `www`.
   The apex is canonical; `www` is configured as a permanent redirect to it, so the site is
   reachable at one address only.
4. In GoDaddy's DNS manager, create the records Vercel displays: an `A` record for the apex
   and a `CNAME` for `www`. Use the values from Vercel's dashboard rather than any value
   written here — Vercel's published IPs have changed historically.
5. Wait for Vercel to verify the domain and provision the TLS certificate.

GoDaddy hosting is not used. GoDaddy serves only as registrar and DNS host.

## Sequencing

The build is not blocked on the domain. Work proceeds in this order:

1. Build the page and verify it on `localhost:3000`. The domain is not needed.
2. Customer reviews it locally and requests changes.
3. Customer provides the exact domain.
4. Metadata is filled in with that domain, then deploy and configure DNS.

If the domain is available before step 3, it is used immediately and the ordering is
irrelevant. The page must never ship with a guessed or placeholder domain in its metadata —
an incorrect Open Graph URL is worse than an absent one.

## Acceptance criteria

- `npm run build` completes with no errors. Any warnings are investigated and either fixed
  or explained — they are not ignored.
- `npm run dev` serves the page at `localhost:3000`, rendering as specified.
- Layout is correct at 320px, 768px, and 1440px viewport widths.
- No errors or warnings in the browser console.
- With `prefers-reduced-motion: reduce` active, no animation runs and the page is fully
  legible.
- The page loads no resources from third-party hosts.
- After deployment: the domain and its `www` subdomain both resolve to the page over HTTPS
  with a valid certificate.
