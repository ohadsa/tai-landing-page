# Tai Atar Coming-Soon Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dark, minimal coming-soon page for Tai Atar, live over HTTPS on the customer's GoDaddy domain.

**Architecture:** A single statically-prerendered Next.js App Router route. No server code, no data fetching, no client-side interactivity. Layout and typography come from Tailwind utilities; the animated glow, the hairline rule, and the entrance transition are hand-written CSS in `globals.css`, because they are one-off visual effects that utility classes express badly. Content correctness is guarded by Vitest component tests; visual correctness is verified in a real browser at three breakpoints.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, `next/font` (Geist), Vitest + React Testing Library, Vercel, GoDaddy DNS.

## Global Constraints

These apply to every task. Each task's requirements implicitly include this section.

- **Brand name is `Tai Atar`** — two words, both capitalised — in all prose, metadata, copy, and commit messages. Uppercase display is a CSS `text-transform` treatment only; the DOM text stays `Tai Atar` so screen readers pronounce it as a name.
- **The page's complete text is exactly three strings:** `Tai Atar` (wordmark), `coming soon` (subline), `© 2026 Tai Atar` (footer). No tagline. Adding copy is out of scope.
- **No runtime requests to third-party hosts.** Fonts are self-hosted via `next/font`. No analytics, no CDN scripts, no remote images.
- **All animation is disabled under `prefers-reduced-motion: reduce`**, and the page must be fully legible and correctly laid out with animation off.
- **Layout is correct from 320px viewport width upward.** The wordmark must never wrap to a second line and must never overflow horizontally.
- **No guessed domain values.** `metadataBase` and the Open Graph `url` stay unset until the customer supplies the real domain in Task 5. An incorrect Open Graph URL is worse than an absent one.
- **The apex domain is canonical**; `www` permanently redirects to it.
- **Colours:** background `#0a0a0b`, primary text `#f5f5f0`, muted text `#8a8a85`.
- **`npm run build` must complete with no errors.** Warnings are investigated and either fixed or explained — never ignored.
- This page is throwaway. When the real site is built, `app/page.tsx` is replaced wholesale. Do not build abstractions for reuse.

---

### Task 1: Scaffold the Next.js project

Produces a project that builds and runs, showing a bare dark page with no content. All boilerplate is stripped in this task so later tasks start from a clean slate.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore` (all generated)
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (all generated, then rewritten)
- Delete: `app/favicon.ico`, `public/*.svg` (generated boilerplate)

**Interfaces:**
- Consumes: nothing — this is the first task.
- Produces: a working Next.js project rooted at the repo root (no `src/` directory), with the `@/*` import alias mapped to the repo root. Later tasks import as `@/app/page`.

- [ ] **Step 1: Scaffold into the existing repo**

The repo already contains `docs/` and `.git/`. `create-next-app` accepts a non-empty directory as long as no generated file collides, and it detects the existing git repo and skips `git init`.

```bash
cd /Users/ohadsaada/dev/taiatar-landing-page
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

If a flag is rejected because the CLI version differs, run `npx create-next-app@latest --help`, find the current equivalent, and use it. Do not drop a requirement to make the command run — `--app`, `--typescript`, `--tailwind`, and `--no-src-dir` are all required by this plan. If prompted about Turbopack, accept the default.

- [ ] **Step 2: Verify the scaffold landed and the spec survived**

```bash
ls app/ && cat tsconfig.json | grep -A3 '"paths"' && ls docs/superpowers/specs/
```

Expected: `app/` contains `layout.tsx`, `page.tsx`, `globals.css`. `tsconfig.json` maps `"@/*"` to `["./*"]`. The spec file is still present. If `docs/` was disturbed, restore it with `git checkout -- docs` before continuing.

- [ ] **Step 3: Verify the build passes before any edits**

```bash
npm run build
```

Expected: build completes, no errors. This establishes a known-good baseline — if the build breaks later, the cause is your change, not the scaffold.

- [ ] **Step 4: Strip the boilerplate**

Delete the generated marketing assets:

```bash
rm -f app/favicon.ico public/*.svg
```

Replace `app/page.tsx` entirely with a placeholder that renders nothing. Real content arrives in Task 2.

```tsx
export default function Home() {
  return <main />;
}
```

Replace `app/globals.css` entirely:

```css
@import "tailwindcss";

@theme {
  --color-ink: #0a0a0b;
  --color-bone: #f5f5f0;
  --color-muted: #8a8a85;
}

html,
body {
  background-color: var(--color-ink);
  color: var(--color-bone);
  -webkit-font-smoothing: antialiased;
}
```

Replace `app/layout.tsx` entirely. Metadata is deliberately minimal here — Task 4 fills it in properly.

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Tai Atar",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify the build still passes and the page is blank**

```bash
npm run build
```

Expected: build completes with no errors. The route `/` is listed as static (`○` in the route table) — confirm this. If it is listed as dynamic (`ƒ`), something is forcing server rendering and must be fixed before continuing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js project and strip boilerplate

Bare dark page that builds static. Colour tokens defined; content,
visual design, and metadata follow in later tasks.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Page content, test-first

Produces the three required strings on the page, guarded by tests. Nothing is styled yet — the page will look plain and wrong, and that is expected.

The test harness is set up here rather than in Task 1 because this is the first task that needs it.

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `app/page.test.tsx`
- Modify: `app/page.tsx`, `package.json` (test script)

**Interfaces:**
- Consumes: the project scaffold from Task 1, including the `@/*` alias.
- Produces: `npm test` runs the Vitest suite once and exits. `app/page.tsx` default-exports `Home(): JSX.Element` rendering an `<h1>`, a `<hr>`, a `<p>`, and a `<footer>`. Task 3 styles these exact elements.

- [ ] **Step 1: Install the test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.tsx"],
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add the test script to `package.json` — inside the existing `"scripts"` object, alongside `dev`, `build`, and `start`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the failing test**

Create `app/page.test.tsx`. These tests encode the content contract from the spec: the exact three strings, and the brand name in its two-word form.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("coming-soon page", () => {
  it("renders the brand name as two capitalised words in the DOM", () => {
    render(<Home />);
    // Uppercase display is a CSS treatment; the DOM text must stay "Tai Atar"
    // so screen readers pronounce it as a name rather than spelling it out.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Tai Atar$/,
    );
  });

  it("renders the coming soon subline", () => {
    render(<Home />);
    expect(screen.getByText("coming soon")).toBeInTheDocument();
  });

  it("renders the copyright footer", () => {
    render(<Home />);
    expect(screen.getByText("© 2026 Tai Atar")).toBeInTheDocument();
  });

  it("renders no other text", () => {
    const { container } = render(<Home />);
    // textContent runs adjacent elements together with no separator, so the
    // expectation is the three strings concatenated. Any stray copy added to
    // the page breaks this.
    const expected = ["Tai Atar", "coming soon", "© 2026 Tai Atar"].join("");
    expect(container.textContent).toBe(expected);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL. All four tests fail — `Home` currently renders an empty `<main />`, so `getByRole("heading")` and `getByText` find nothing.

- [ ] **Step 5: Write the minimal implementation**

Replace `app/page.tsx` entirely. Class names are attached now so Task 3 only has to write CSS, but no styles exist yet.

```tsx
export default function Home() {
  return (
    <main className="page">
      <div aria-hidden="true" className="glow" />

      <div className="stack">
        <h1 className="wordmark reveal reveal-1">Tai Atar</h1>
        <hr className="rule reveal reveal-2" />
        <p className="subline reveal reveal-3">coming soon</p>
      </div>

      <footer className="footer">© 2026 Tai Atar</footer>
    </main>
  );
}
```

The glow div is `aria-hidden` and empty — it is pure decoration and must not appear in the accessibility tree or in the text-content assertion.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS, 4 tests.

- [ ] **Step 7: Verify the build still passes**

```bash
npm run build
```

Expected: no errors. The `/` route is still static (`○`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add page content with Vitest coverage

Three strings, test-guarded: wordmark, subline, footer. A whole-page
text assertion locks the copy down so styling work cannot silently
introduce stray text. Unstyled for now.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Visual design

Produces the finished look: dark canvas, animated glow, letter-spaced wordmark, hairline rule, staggered entrance. This is the task where the page starts looking like the design.

Correctness here is visual, so verification is done in a real browser rather than in jsdom — jsdom does not lay out or paint, so it cannot tell you whether the wordmark overflows at 320px.

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the class names `page`, `glow`, `stack`, `wordmark`, `rule`, `subline`, `footer`, `reveal`, `reveal-1`, `reveal-2`, `reveal-3` rendered by `app/page.tsx` in Task 2. Do not rename them; do not modify `page.tsx` in this task.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the styles**

Append to `app/globals.css`, below the existing `@theme` block and base styles:

```css
/* Layout ------------------------------------------------------------- */

.page {
  position: relative;
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 1.5rem;
}

.stack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Glow --------------------------------------------------------------- */

.glow {
  position: absolute;
  left: 50%;
  top: 45%;
  width: min(120vw, 900px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    rgb(196 181 253 / 0.16) 0%,
    rgb(226 232 240 / 0.07) 32%,
    transparent 68%
  );
  filter: blur(40px);
  animation: breathe 14s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.75;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -52%) scale(1.08);
  }
}

/* Typography --------------------------------------------------------- */

.wordmark {
  font-size: clamp(1.75rem, 7vw, 4.5rem);
  font-weight: 300;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  /* letter-spacing adds trailing space after the last glyph, which shifts
     the text left of true centre; the indent cancels it out */
  text-indent: 0.3em;
  white-space: nowrap;
  color: var(--color-bone);
}

.rule {
  width: min(180px, 40vw);
  height: 1px;
  border: 0;
  margin: clamp(1.25rem, 4vw, 2rem) 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(245 245 240 / 0.35),
    transparent
  );
}

.subline {
  font-size: 0.8125rem;
  letter-spacing: 0.35em;
  text-indent: 0.35em;
  color: var(--color-muted);
}

.footer {
  position: absolute;
  bottom: 1.5rem;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  color: rgb(245 245 240 / 0.22);
}

/* Entrance ----------------------------------------------------------- */

.reveal {
  opacity: 0;
  animation: rise 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.reveal-1 {
  animation-delay: 80ms;
}
.reveal-2 {
  animation-delay: 220ms;
}
.reveal-3 {
  animation-delay: 340ms;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion ----------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  .glow {
    animation: none;
  }
  .reveal {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Leave it running for the remaining steps. It serves on `http://localhost:3000` unless that port is taken — read the actual URL from the output and use it.

- [ ] **Step 3: Verify layout at 1440px**

Open `http://localhost:3000` in a browser at 1440×900. Confirm:
- Background is near-black, wordmark is centred both horizontally and vertically.
- The glow sits behind the wordmark and is visibly moving over a 14s cycle.
- Wordmark reads `TAI ATAR` in wide-tracked uppercase; the rule sits below it; `coming soon` below that.
- Footer sits at the bottom of the viewport, very dim.
- Content faded up on load, staggered.

- [ ] **Step 4: Verify layout at 768px and 320px**

Resize to 768×1024, then to 320×568. At **both** widths confirm the wordmark stays on **one line** and is **fully visible with clear space on both sides**.

Do not check this by looking for a horizontal scrollbar. `.page` sets `overflow: hidden`, so an overflowing wordmark is silently **clipped** rather than producing a scrollbar — the absence of a scrollbar proves nothing. Look at the glyphs: both the `T` of `TAI` and the `R` of `ATAR` must be complete and not touching the viewport edge.

Confirm it numerically as well, in the devtools console:

```js
const w = document.querySelector(".wordmark");
console.log(w.scrollWidth, w.clientWidth, window.innerWidth);
```

Expected: `scrollWidth` is less than or equal to `clientWidth` (nothing clipped), and `clientWidth` is comfortably under `innerWidth`.

320px is the hard case. If the wordmark clips or wraps there, lower the clamp minimum in `.wordmark` from `1.75rem` to `1.5rem` and re-check. If it still clips at `1.5rem`, reduce `letter-spacing` to `0.22em` and `text-indent` to match. Make the smallest change that fixes it, and note in the commit message which value you changed.

- [ ] **Step 5: Verify no console errors**

Open the browser devtools console and reload. Expected: no errors and no warnings. A hydration mismatch warning here means something non-deterministic crept into the render and must be fixed, not ignored.

- [ ] **Step 6: Verify reduced motion**

In Chrome devtools: open the command menu (Cmd+Shift+P), run `Show Rendering`, and set **Emulate CSS media feature prefers-reduced-motion** to `reduce`. Reload.

Expected: the glow is static, content is immediately visible at full opacity with no fade-up, and the layout is identical to the animated version. Nothing is invisible — a `.reveal` element stuck at `opacity: 0` is the specific failure this check exists to catch.

Set the emulation back to `no-preference` when done.

- [ ] **Step 7: Verify text contrast**

The spec requires the wordmark and subline to meet WCAG AA (4.5:1) against the background. The footer is decorative and deliberately below AA — that is expected and must not be "fixed".

In devtools, inspect the `.subline` element, open the colour swatch next to its `color` value, and read the contrast ratio Chrome displays.

Expected: `.subline` (`#8a8a85` on `#0a0a0b`) reports roughly 5.5:1 — above the 4.5:1 AA threshold. `.wordmark` (`#f5f5f0`) is far above it. If the subline reports **below** 4.5:1, lighten `--color-muted` until it passes; do not lower the requirement.

- [ ] **Step 8: Verify the build**

```bash
npm run build && npm test
```

Expected: build passes with no errors, 4 tests pass. The content tests must still pass — Task 3 changes no markup.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add dark minimal visual design

Animated radial glow, letter-spaced wordmark with indent compensation
for true centring, hairline rule, staggered entrance. All motion is
disabled under prefers-reduced-motion, with content forced visible so
nothing is stranded at zero opacity.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Metadata, favicon, and third-party audit

Produces correct browser-tab and social-preview metadata, plus proof that the page loads nothing from outside its own origin.

Domain-dependent metadata (`metadataBase`, Open Graph `url`) is deliberately **not** set here — it lands in Task 5 once the real domain is known.

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/icon.svg`, `app/layout.test.ts`

**Interfaces:**
- Consumes: the `metadata` export in `app/layout.tsx` from Task 1.
- Produces: `app/layout.tsx` exports `metadata: Metadata` with `title`, `description`, `themeColor` (via `viewport`), and an `openGraph` object lacking only `url`. Task 5 adds `metadataBase` and `openGraph.url` to this same export.

- [ ] **Step 1: Write the failing metadata test**

Create `app/layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";

describe("page metadata", () => {
  it("titles the page with the brand name in two-word form", () => {
    expect(metadata.title).toBe("Tai Atar");
  });

  it("has a description", () => {
    expect(metadata.description).toBeTruthy();
  });

  it("sets an Open Graph title matching the page title", () => {
    expect(metadata.openGraph?.title).toBe("Tai Atar");
  });
});
```

Widen the Vitest `include` pattern in `vitest.config.ts` so `.ts` test files are picked up alongside `.tsx`:

```ts
include: ["app/**/*.test.{ts,tsx}"],
```

Importing `app/layout.tsx` pulls in `next/font/google`, which Next.js rewrites via its SWC
transform at build time. In a plain Vitest environment it is not callable and the suite dies
with `TypeError: Geist is not a function`. Stub it — create `test/stubs/next-font-google.ts`:

```ts
type FontResult = {
  className: string;
  variable: string;
  style: { fontFamily: string };
};

const stub = (family: string) => (): FontResult => ({
  className: `stub-${family.toLowerCase()}`,
  variable: `--font-${family.toLowerCase()}`,
  style: { fontFamily: family },
});

export const Geist = stub("Geist");
export const Geist_Mono = stub("GeistMono");
```

and alias it in `vitest.config.ts`, adding this `resolve` block alongside `plugins` and `test`:

```ts
import { fileURLToPath } from "node:url";

  resolve: {
    alias: {
      "next/font/google": fileURLToPath(
        new URL("./test/stubs/next-font-google.ts", import.meta.url),
      ),
    },
  },
```

This stubs font *loading* only. These tests assert on metadata, so nothing under test is faked.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL. The title assertion passes (Task 1 set it), but the description and Open Graph assertions fail — neither field exists yet.

- [ ] **Step 3: Add the icon**

Create `app/icon.svg`. Next.js picks this up by filename convention and generates the `<link rel="icon">` automatically — no manual link tag needed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0a0a0b"/>
  <text x="32" y="43" text-anchor="middle" font-family="system-ui, sans-serif"
        font-size="30" font-weight="300" fill="#f5f5f0">TA</text>
</svg>
```

- [ ] **Step 4: Write the metadata**

Replace the `metadata` export in `app/layout.tsx` and add a `viewport` export beside it:

```tsx
export const metadata: Metadata = {
  title: "Tai Atar",
  description: "Tai Atar — coming soon.",
  openGraph: {
    title: "Tai Atar",
    description: "Tai Atar — coming soon.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};
```

Update the import at the top of the file to bring in the `Viewport` type:

```tsx
import type { Metadata, Viewport } from "next";
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS, 7 tests (4 from Task 2, 3 from this task).

- [ ] **Step 6: Audit for third-party requests**

With `npm run dev` running, open the page with the devtools **Network** tab recording, and reload.

Expected: every request's domain is `localhost`. There must be **no** request to `fonts.googleapis.com`, `fonts.gstatic.com`, or any other external host — `next/font` downloads Geist at build time and self-hosts it. If you see an external font request, the font is being loaded via a CSS `@import` or `<link>` somewhere instead of `next/font`; find it and remove it.

- [ ] **Step 7: Verify the tab title and icon**

Reload the page and confirm the browser tab reads `Tai Atar` and shows a dark rounded icon rather than the default globe. The icon may need a hard reload (Cmd+Shift+R) — browsers cache favicons aggressively.

- [ ] **Step 8: Verify the build**

```bash
npm run build
```

Expected: no errors, `/` still static.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add metadata, favicon, and Open Graph tags

Title, description, theme colour, and an SVG icon via Next.js file
convention. Open Graph url and metadataBase are intentionally omitted
until the real domain is known — a wrong canonical URL is worse than
an absent one. Verified the page loads nothing from third-party hosts.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Deploy to Vercel and point the domain

Produces the live site. **This task requires two things from the customer: the exact domain, and access to click through the Vercel and GoDaddy dashboards.** Do not start it until the domain is known — see the Global Constraints on guessed domain values.

Throughout this task, `example.com` stands in for the customer's real domain. Substitute it everywhere.

**Files:**
- Modify: `app/layout.tsx` (add `metadataBase` and `openGraph.url`)

**Interfaces:**
- Consumes: the `metadata` export from Task 4.
- Produces: the live deployment. Nothing depends on this task.

- [ ] **Step 1: Confirm the repo is clean and green**

```bash
git status --short && npm test && npm run build
```

Expected: no uncommitted changes, 7 tests pass, build succeeds. Do not deploy a dirty tree.

- [ ] **Step 2: Add the domain to the metadata**

Now that the domain is known, add the two domain-dependent fields to the `metadata` export in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: "Tai Atar",
  description: "Tai Atar — coming soon.",
  openGraph: {
    title: "Tai Atar",
    description: "Tai Atar — coming soon.",
    type: "website",
    url: "https://example.com",
  },
};
```

Use the apex domain, not `www` — the apex is canonical.

- [ ] **Step 3: Verify and commit**

```bash
npm test && npm run build
git add -A
git commit -m "Set canonical domain in metadata

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Create the GitHub repository and push**

```bash
gh repo create taiatar-landing-page --private --source=. --remote=origin --push
```

If `gh` is not authenticated, run `gh auth login` first. If the customer prefers a public repo, swap `--private` for `--public`.

Verify: `git remote -v` shows `origin`, and `git status -sb` shows `main...origin/main` with nothing ahead.

- [ ] **Step 5: Import the project into Vercel**

At <https://vercel.com/new>, import the `taiatar-landing-page` repository.

Vercel detects Next.js automatically. Accept every default — build command, output directory, and install command all need no changes. Deploy.

Expected: the build succeeds and the site is live at a `*.vercel.app` URL. Open it and confirm the page renders exactly as it did locally. **Fix any problem here before touching DNS** — debugging a broken deploy is much harder once DNS is also in flight.

- [ ] **Step 6: Add both domains in Vercel**

In the Vercel project: **Settings → Domains**. Add `example.com`, then add `www.example.com`.

Set `example.com` as the primary domain, and configure `www.example.com` to **redirect** to it (Vercel offers this directly in the domain's settings). This satisfies the canonicalisation constraint.

Vercel will now display the exact DNS records it needs. **Copy those values from the dashboard.** Do not use any IP address written in this plan or the spec — Vercel's published IPs have changed historically, and a stale value produces a site that silently fails to resolve.

- [ ] **Step 7: Create the DNS records at GoDaddy**

In GoDaddy: **My Products → the domain → DNS → Manage Zones**.

Create the records Vercel showed in Step 6. They will be shaped like:
- An **A** record, name `@`, value = the IP Vercel displayed.
- A **CNAME** record, name `www`, value = the hostname Vercel displayed.

Two things to watch for:
- GoDaddy pre-populates parking records on new domains. If an existing `A` record on `@` or `CNAME` on `www` conflicts, **edit it** rather than adding a second one — duplicate records at the same name will resolve unpredictably.
- Set TTL to the shortest option GoDaddy offers (usually 600 seconds / 1 hour) so mistakes are cheap to correct.

Do **not** buy GoDaddy hosting, and do not use their "Website Builder" or forwarding features. GoDaddy is registrar and DNS host only.

- [ ] **Step 8: Wait for verification and the TLS certificate**

Return to Vercel's **Settings → Domains**. Both domains should move to a valid state and Vercel then issues the TLS certificate automatically.

This usually takes a few minutes. It can take longer while DNS propagates. Check progress from the command line:

```bash
dig +short example.com
dig +short www.example.com
```

Expected: the apex returns the IP Vercel gave you; `www` returns Vercel's CNAME target. If they still return GoDaddy parking values after 30 minutes, re-check Step 7 for a leftover conflicting record.

- [ ] **Step 9: Verify the live site**

```bash
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" -L https://example.com
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" -L https://www.example.com
```

Expected: both return `200`, and both settle on `https://example.com/` — confirming the `www` redirect works.

Then open `https://example.com` in a browser and confirm:
- The padlock shows a valid certificate.
- The page renders as it did locally.
- The tab reads `Tai Atar` with the dark icon.
- No console errors.

- [ ] **Step 10: Final acceptance pass against the spec**

Re-read the Acceptance Criteria in `docs/superpowers/specs/2026-07-30-taiatar-coming-soon-design.md` and confirm every line, on the live site. Report any criterion that does not hold rather than marking the task done.

---

## Notes for whoever executes this

**Tasks 1–4 need nothing from the customer** and can run straight through. Task 5 is blocked on the domain and needs dashboard access.

**Do not add features.** No email capture, no analytics, no social links, no extra copy. All were considered during design and explicitly rejected. If the customer asks for one mid-execution, that is a new spec, not a new step here.

**If the visual result looks wrong but matches the CSS in Task 3**, that is a design disagreement, not a bug. Show the customer and let them decide — do not improvise a redesign.
