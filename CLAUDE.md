# Shriram Financial Services - Project Guide

Static, multi-page marketing/product site **built to organisation scale - 4,000+ pages** - using
**[Astro](https://astro.build)** (static output) + **[Tailwind CSS v4](https://tailwindcss.com)**.
Astro compiles to plain static HTML with one shared, cached stylesheet; no client framework, no
per-page CSS fork.

> **History.** Astro + Tailwind rewrite of a legacy hand-authored static site (frozen pixel-parity
> reference at `../Project 1`). The rewrite changed the *code*, never the *design* - every page
> renders pixel-for-pixel identical; the only intentional change was rationalising ~150 sprawling
> colours into a structured token system (`docs/legacy-style-audit.md`).

> **This file is a lean index.** Full rule text + rationale, running/preview, project structure and
> the Figma round-trip live in **[`docs/conventions.md`](docs/conventions.md)** (each rule is
> deep-linked, e.g. `docs/conventions.md#rule-9`). The full 44-page inventory lives in
> **[`docs/pages.md`](docs/pages.md)**. Keep those in sync (see rule 11).

---

## 🌐 Scale is the North Star - 4,000+ pages

Judge every decision by *"does this hold up across thousands of pages?"* Four pillars hold
**together** on every page, never traded off:

- **🔎 SEO** - semantic HTML + valid heading outline; unique templated `<title>`/`<meta
  description>`, canonical, OG/Twitter, JSON-LD on every page; every page in the sitemap. Metadata
  is **generated per page** (`BaseLayout.astro` + `src/lib/seo.ts`), never hand-typed.
- **🛡️ Reliability** - shared components over bespoke markup; static HTML at build, no runtime
  framework to fail. Fewer moving parts = fewer of 4,000 pages that break.
- **🎨 Visual consistency** - one token set, one type scale, one spacing grid, one component
  library, enforced in `src/styles/global.css`. Uniform *by construction*.
- **⚡ Speed** - one shared cached `global.css` (Tailwind v4, tree-shaken); static HTML; lazy media;
  bundled/deferred `<script>`s. Hold a performance budget.

**Practical consequences:** (1) **Templates, not pages** - page *types* are parametric components
generated from templates + data (`src/data/`). (2) **Single source of truth** - no per-page CSS/JS
forks; reused things live in `global.css`/`src/components/`/`src/data/`. (3) **Vet every new
capability against all four pillars** before adopting. (4) The design system is documented for
scale at `/designsystem` (two live pages).

---

## ⭐ The sources of truth

| File | Role | What it holds |
|---|---|---|
| **`src/styles/global.css`** | Design system - implementation | Token architecture (`@theme` primitives → `@theme inline` semantic roles), base rules (`line-height:1.5`, one-font), every shared component class. Editing it updates **every page at once**. |
| **`src/components/` + `src/layouts/`** | Components - implementation | `BaseLayout` (templated `<head>`/SEO + chrome), site chrome (`Header`, `MobileMenu`, `MegaNav`, `Footer`), UI + section components. |
| **`src/data/`** | Content data | Structured content feeding templates - `navigation.ts` (renders header, mega-nav, mobile menu **and** footer from one dataset). |
| **`/designsystem` pages** | Design system - documentation | `/designsystem/current` (what is used) + `/designsystem/proposed` (what is suggested, live from tokens). The **Figma round-trip artifact** + canonical design-rule prose. |
| **`CLAUDE.md`** (this file) | Rulebook / onboarding index | The one-line directives below; deep-links to `docs/` for full text. |

---

## 🔒 Standing rules

One-line directives. **Full text + rationale + dates: [`docs/conventions.md`](docs/conventions.md),
anchored `#rule-N`.** 🟢 marks a design-system rule.

1. **Every page uses `BaseLayout`** - pass a `seo` object; never hand-copy `<head>`/chrome into a page. → [#rule-1](docs/conventions.md#rule-1)
2. **Every page follows the design system** - reuse `global.css` tokens + component classes; a page `<style>` holds only what's genuinely unique, referencing **tokens not raw hexes**. → [#rule-2](docs/conventions.md#rule-2)
3. **One font (Outfit) + `line-height:1.5`, sitewide** - never load a second font. Sole exception: homepage store badges (`.store-btn`) use the platform system-font stack. → [#rule-3](docs/conventions.md#rule-3)
4. **Icons are real inline `<svg>`s, never glyphs/emoji, sized `16/20/24/32px` only.** → [#rule-4](docs/conventions.md#rule-4)
5. **🟢 No fractional opacity / alpha colours** - every colour is a solid hex token. Translucency only for `box-shadow`, frosted `backdrop-filter`, and the `opacity` property for motion/state. (Legacy un-flattenable alphas flagged `Tier-2` in-file.) → [#rule-5](docs/conventions.md#rule-5)
6. **🟢 Spacing on the 8px grid** (4px worst case) - no off-grid values (legacy exceptions flagged `Tier-2`). → [#rule-6](docs/conventions.md#rule-6)
7. **The hero is standardised** - shared gradient/`min-height`/`.hero-inner` padding/type, defined once in `global.css`. Two sanctioned variants: `.calc-hero` (hub) and `.hero.hero-compact` (calculator detail hug). → [#rule-7](docs/conventions.md#rule-7)
8. **Every form field uses the shared `.hf-field` component** - pages never re-declare it, only add decoration. → [#rule-8](docs/conventions.md#rule-8)
9. **🟢 The token contract** - primitives → semantic roles → components bind to the role. Never hardcode a hex when a token exists; Figma changes only token *values*, never component code. → [#rule-9](docs/conventions.md#rule-9)
10. **🟢 Merge policy** - Tier-1 merges applied; Tier-2 documented-not-applied. Leave `/* Tier-2 */` values as-is. → [#rule-10](docs/conventions.md#rule-10)
11. **🟢 Design-guideline changes: implement it, document it once, add a CLAUDE.md line only if sitewide** - (1) implement in `global.css`/components; (2) document canonically in `/designsystem/proposed`; (3) add a one-line directive **here only** for a project-wide invariant an AI would violate by default. *(Rewritten 2026-07-13; supersedes "land in ALL THREE places".)* → [#rule-11](docs/conventions.md#rule-11)
12. **Headings are LEFT-aligned** (`equity.astro` is the reference) - never centre a content heading block; only self-contained promo bands (`.cta-box`, dark CTA/access) are centred by their own design. → [#rule-12](docs/conventions.md#rule-12)
13. **The FAQ section header is always "Got Questions?"** - fix any divergent header you encounter. → [#rule-13](docs/conventions.md#rule-13)
14. **🟢 Interactive controls meet a 48px mobile tap target** - pad the hit area out to 48px; keep the icon glyph on its `16/20/24/32` scale. Governs tap area, not font size. → [#rule-14](docs/conventions.md#rule-14)
15. **🟢 Hover states are desktop-only** - inside the one canonical gate `@media (min-width:1024px) and (hover:hover)`, never outside it. Design is proportionally identical 1024→1920 (fluid gutter, `1fr` grids, `clamp()`). → [#rule-15](docs/conventions.md#rule-15)
16. **🟢 The FAQ section has two band-keyed variants** (`sec-light`/`sec-tint`) - colour is automatic. Set only the band class; never re-declare fills/borders/watermark on a page. (Homepage is the documented exception.) → [#rule-16](docs/conventions.md#rule-16)
17. **🟢 ONE global button system** - `.btn` + family + size (radius 8px, 220px min-width). Families: primary (gold, one per view) · secondary (black stroke) · secondary-inverse (white stroke, dark surfaces) · tertiary/tertiary-inverse (solid, sparingly) · link. Never hardcode a button colour; pages add only layout. → [#rule-17](docs/conventions.md#rule-17)
18. **🟢 The hero is a shared component `<Hero>`** - never re-author `<section class="hero">` markup on a page. A sitewide hero change is one edit to `Hero.astro` + `global.css`. (Bespoke heroes listed in conventions.) → [#rule-18](docs/conventions.md#rule-18)
19. **🟢 Every process stepper is `<StepsRow>` / `<StepsRows>`** - icon-chip timeline; `icon` is a key into `src/components/sections/stepIcons.ts`. Never hand-write `.steps` or inline stepper SVGs. → [#rule-19](docs/conventions.md#rule-19)

---

## 📄 Pages

**44 pages total** - flat/top-level, extensionless, no-trailing-slash URLs. Leaf slugs use hyphens
between words; folder segments do not (only `regulatorydocuments/` and `designsystem/` are folders).
Product & calculator hubs are flat files; detail pages are template-driven (`equity.astro` is the
product-page reference). Every `<title>` is normalised by `fullTitle()` - page `seo.title` carries
**no** brand suffix. **Full URL / source / description inventory: [`docs/pages.md`](docs/pages.md).**

**Proofkit** (`/review` + `/reviewdash` admin + `/teamdash` per-team) is an isolated, versioned,
portable package in `src/plugins/proofkit/` toggled by `PROOFKIT_ENABLED` in its `config.ts`.
**Per change → bump `VERSION` + add a precise `CHANGELOG.md` entry** (note any endpoints/auth/config/
seams touched - that entry is the running record). `README.md`/`INSTALL.md` are the source of truth
that travels in the zip but are **reconciled at export time** (when a zip is cut), not on every push.
The latest complete package zip is kept in git at `releases/proofkit-v<VERSION>.zip` and is replaced
on each new export.

**Adding a new page:** create `src/pages/<path>.astro`, import `BaseLayout`, pass a `seo` object,
build from the shared component classes + tokens in `global.css`, and build the hero with `<Hero>`
(rule 18) - never re-author `<section class="hero">`. Copy an existing page of similar shape
(`privacy-policy.astro` for content, `equity.astro` for a product page). Use `src/data/` for anything
repeated. Never fork `global.css`.

---

## ▶️ Running / preview

- Install `npm install` · Dev `npm run dev` → `localhost:4321` · Build `npm run build` → `./dist/`
  · Preview `npm run preview`.
- Clean **extensionless, no-trailing-slash** URLs (`build.format:'file'` + `trailingSlash:'never'`):
  `src/pages/equity.astro` → `/equity`. (Full slug/URL convention + legacy-site comparison:
  [`docs/conventions.md`](docs/conventions.md).)

## 📁 Project structure

```
src/
  styles/global.css     Tailwind entry + token system + base + every shared component.
  layouts/BaseLayout.astro   Templated <head>/SEO + Header/MegaNav/Footer + scroll-reveal.
  components/site/      Header, MobileMenu, MegaNav, Footer (render from navigation.ts).
  components/sections/  Hero (rule 18), StepsRow/StepsRows (+ stepIcons.ts, rule 19), FaqAccordion, …
  components/ui/        Atomic primitives.
  data/                 navigation.ts (+ future data).
  lib/                  seo.ts (SEO type + fullTitle + schema helpers).
  pages/                One .astro per URL. Content + composition only.
public/                 assets/ images/ videos/ favicon.png - served verbatim.
docs/                   conventions.md, pages.md, legacy-style-audit.md, porting-guide.md, specs.
```

## 🔗 The Figma round-trip

`/designsystem/proposed` maps 1:1 onto Figma variables (primitive → semantic → component); it exports
to Figma, gets cleaned/filled, and returns. Implementing the returned system means updating token
*values* in `global.css`, never re-architecting components (rule 9). Full detail:
[`docs/conventions.md`](docs/conventions.md).

---

## 🧭 Working efficiently (this repo)

- **`/clear` between unrelated pages/features; `/compact` at page boundaries** (steer it, e.g.
  `/compact keep the token decisions + which files changed`). Stale context taxes every later turn.
- **Multi-page change? Check if it's a shared-component edit first** - `<Hero>`, `<StepsRow>`,
  `global.css`, `navigation.ts` usually make it one file, not N.
- **Name the target files (or use Plan Mode) before any multi-page edit loop** - cheap to correct at
  the plan stage, expensive mid-edit.
