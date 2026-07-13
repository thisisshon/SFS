# Conventions & Rationale — Shriram Financial Services

> Full text and rationale for the standing rules, plus running/preview, project structure, and the
> Figma round-trip. Extracted from `CLAUDE.md` to keep the always-loaded rulebook lean — `CLAUDE.md`
> carries each rule as a one-line directive and deep-links here (e.g. `docs/conventions.md#rule-9`).
> This file is the canonical long-form; keep it and `/designsystem/proposed` in sync (see rule 11).

---

## 🔒 Standing rules (full text)

<a id="rule-1"></a>
1. **Every page uses `BaseLayout`.** Pages pass a `seo` object (title/description/path, optional
   `jsonLd`/`ogType`/`noindex`) and content; the layout renders the entire `<head>` (fonts,
   favicon, canonical, OG/Twitter, JSON-LD) and the shared Header/MegaNav/Footer. **Never
   hand-copy head or chrome markup into a page.**

<a id="rule-2"></a>
2. **Every page follows the design system.** Reuse the documented tokens and shared component
   classes from `global.css`; don't restyle from scratch. A page's own `<style>` block holds
   only what is genuinely unique to that page - and its values reference **tokens**, not raw
   hexes (see the token contract below).

<a id="rule-3"></a>
3. **One font + `line-height:1.5`, site-wide - one ruled exception.** The only font is **Outfit**;
   never set another `font-family` or load a second web font. Form controls are force-inherited
   in `global.css` base layer, so any new interactive element is covered. Every text element
   renders at `line-height:1.5` (enforced globally). Both live in `global.css` `@layer base`.
   **Sanctioned exception (2026-07-12):** the homepage Antara **App Store / Google Play badges**
   (`.store-btn`) set the platform **system-font stack** (`-apple-system, …, Roboto, …`) - no web
   font loaded - so they read as the official Apple/Google artwork. This is the *only* non-Outfit
   text on the site; do not add others. (Ideal end state: drop in Apple's/Google's official badge
   SVG/PNG assets, which bake the type into the image and need no font at all.)

<a id="rule-4"></a>
4. **Icons are real `<svg>`s, never text glyphs, sized `16 / 20 / 24 / 32px` only.** Every icon
   is an inline `<svg>` - never a character (`✓ → ★ f in 𝕏`) or emoji. Width/height is one of
   those four sizes, chosen from context. (Icon *containers* follow the 8px grid, not this scale.)

<a id="rule-5"></a>
5. **No fractional opacity, no alpha colours - everything is a solid hex token.** Every
   fill/stroke/border/text/divider colour is a **solid hex** exposed as a token. Never `rgba()`/
   `hsla()`, never `opacity:.1` to fake a lighter colour. Flatten alpha over its background into
   a hex with the same look. **Only** translucency allowed: `box-shadow`, frosted
   `backdrop-filter` layers, and the `opacity` *property* for motion/state (reveal fades,
   disabled/loading dim). *(A small number of legacy alpha values that sit over gradients/video -
   un-flattenable - are carried verbatim on the homepage and flagged `Tier-2` in-file; they are
   the documented exception, not licence for new ones.)*

<a id="rule-6"></a>
6. **Spacing sits on the 8px grid.** Every `gap`/`padding`/`margin`/box size is a multiple of
   **8px** (4px worst case). No off-grid values (6, 10, 14, 18…). *(A few legacy off-grid values
   are carried for pixel parity and flagged `Tier-2` in-file - do not add new ones.)*

<a id="rule-7"></a>
7. **The hero is standardised - V4 dark is the ONLY surface, in THREE types under one `<Hero>`.**
   Every hero is the near-black V4 dark surface (`.hero.hero-dark`): #121212 + low olive glow +
   flipped soft-light texture, breadcrumb folded into `.hero-inner`, content left-aligned and
   parallax-revealed on landing. `min-height`, `.hero-inner` padding (`56px 0`), H1/lead font
   sizes and the `gap:56px` are defined once in `global.css`; H1/lead cap at `--hero-text-w`
   (600px). The three types:
   - **Type 1 - one-column** (default `<Hero>`): breadcrumb → H1 → lead → CTA stacked left,
     vertically centred in the tall band (`min-height:clamp(440px,29vw,552px)`).
   - **Type 2 - two-column** (add an `aside` slot): renders `.hero-grid` - the LEFT column is
     Type 1 verbatim (breadcrumb stays in-flow, NOT pinned to the corner), the aside is always
     `--hero-aside-w` and sits spaced apart on the right by the 56px gap. Collapses to a single
     stack ≤980px.
   - **Type 3 - calculator** (`<Hero calc>` → `.hero-calc`): the dark hero pinned to ONE fixed,
     uniform height shared by the `/calculators` hub AND every detail page - `min-height:408px`
     (= the tallest calc hero, NPS/FD ≈ 326px content + breathing room), keyed on `.hero-calc`
     alone so the crumb-less hub is pinned too. A shorter one just centres in the same band.
     Mobile (≤768px) hugs (`min-height:0`).

   The legacy **light** variant, **`.hero-compact`** and the bespoke **`.calc-hero`** are all
   discarded - folded into these three types. Homepage keeps its bespoke video hero. Documented
   in `/designsystem/proposed`.

<a id="rule-8"></a>
8. **Every form field uses the shared input-field component.** There is **one** form field for
   the whole site - `.hf-field` (with `.hf-row`/`.hf-unit`/`.hf-field-in`/`.hf-err`), canonical
   in `global.css`. Pages **never** re-declare it; they only add field *decoration* (e.g. the
   Demat phone-flag prefix). 48px box, floating label, states Default/Active/Filled/Disabled/
   Error, plus optional select-chevron, counter and Verify/Verified affordances.

<a id="rule-9"></a>
9. **🟢 The token contract - components bind to tokens, tokens bind to primitives.**
   `global.css` has three tiers: **primitives** (`--color-gold-400`, raw palette values) →
   **semantic roles** (`--color-action-primary`, `--color-text-primary`, …) → components use
   the semantic role (or a primitive where no role fits). When the cleaned design system returns
   from Figma, **only token values change** - component code never does. Token *names* are the
   stable API; never hardcode a raw hex in a component or page when a token exists.

<a id="rule-10"></a>
10. **🟢 Merge policy - Tier-1 applied, Tier-2 documented.** Near-duplicate legacy values ≤2 RGB
    points apart are already merged (Tier-1, imperceptible). Larger *visible* unifications (the
    4 button specs, the divergent homepage footer, collapsing 15 creams → 5, ink merges) are
    **documented in `/designsystem/proposed` but NOT applied** - they await sign-off after the
    Figma round-trip. When you see a `/* Tier-2 */` comment, that's a proposed-but-unapplied
    consolidation held for parity; leave the value, keep the note.

<a id="rule-11"></a>
**11. 🟢 Design-guideline changes: implement it, document it once, add a CLAUDE.md line only if sitewide.** When adding or changing a design guideline:
- **`global.css` / components** — implement it. This is the work itself, not a copy to keep in sync.
- **`/designsystem/proposed`** — the ONE canonical spec + rationale (the Figma round-trip artifact). Full prose lives here.
- **`CLAUDE.md`** — add a **one-line directive + pointer** *only* when the rule is a project-wide invariant an AI would otherwise violate by default (e.g. "FAQ header is always 'Got Questions?'"). A local, code-enforced tweak that is fully shown on `/designsystem` gets **no** CLAUDE.md entry.
Rationale: `global.css` is the implementation (mandatory anyway, not documentation). `/designsystem` and `CLAUDE.md` were the two prose copies; making `/designsystem` canonical removes the double-maintenance, while CLAUDE.md keeps only the terse directive because it is the one surface an AI reads by default every turn. *(Rewritten 2026-07-13; supersedes the earlier "land in ALL THREE places" formulation.)*

<a id="rule-12"></a>
12. **Headings are LEFT-aligned - `products/equity.astro` is the reference.** The hero H1, every
    section `.sec-title` and every `.sub-title` (with their `.sec-lead`/`.sub-lead`) sit
    flush-left. Never centre a heading block: a section header is a `<div class="stack"
    style="gap:16px">` holding the title + lead, with **no** `align-items:center` / `text-align:
    center` and **no** `max-width` cap on the lead (the section reads left-to-right, full-measure).
    Vertical centring (`justify-content:center` on the `.section stack`) is fine - that's the
    main axis. The **only** centred text is the self-contained promotional bands - the shared
    `.cta-box` and dark CTA/"access" bands - which are centred by their own component design, as
    on equity. Do not centre ordinary content headings anywhere.

<a id="rule-13"></a>
13. **The FAQ section header is always "Got Questions?".** Every page's FAQ block
    (`<h2 class="faq-title">…</h2>` above `FaqAccordion`) reads exactly **Got Questions?** -
    never "FAQs - <Topic>", "Frequently Asked Questions", "General Questions" or any other variant.
    Apply on every new page build and fix any divergent header you encounter, unless a specific
    page is told otherwise. *(Superseded 2026-07-08: the header was previously "General Questions";
    the whole site was switched to "Got Questions?" to match the compliance content.)*

<a id="rule-14"></a>
14. **🟢 Interactive controls meet a 48px mobile tap target.** Every tappable control (icon
    button, icon-only link, hamburger, social link) must present a **≥44px** touch area on
    mobile; the site standard is **48px** - on the 8px grid and matching `.hf-field` (48px box)
    and the `.to-top` FAB. Reach it by **padding out the hit area**, not by enlarging the icon:
    the icon glyph stays on its `16/20/24/32` scale (rule 4) while the container/`min-width`/
    `min-height`/padding grows to 48px. Canonical examples in `global.css`: footer `.socials a`
    (48px box) and `.nav-toggle` (48×48 via `min-width`/`min-height`, 24px bars unchanged). Text
    links/buttons that are already ≥44px tall via their padding are fine as-is. **Exception:** this
    governs *tap area*, not font size - there is **no** universal minimum font-size rule; designed
    micro-labels (the `.hf-field` floating label at ~10px, compact eyebrow/badge text) are
    sanctioned and must not be "fixed."

<a id="rule-15"></a>
15. **🟢 Hover states are desktop-only, gated at 1024px.** Every hover affordance lives inside the
    one canonical gate `@media (min-width: 1024px) and (hover: hover)` - never author a hover rule
    outside it. The **1024px** threshold matches the nav's desktop→hamburger switch
    (`max-width: 1023.98px`), so hover and the full desktop layout begin/end together: **≥1024px hover
    is active, below 1024px it never fires** (the layout is the mobile hamburger). The
    `(hover: hover)` half also excludes touch pointers at any width. *(Updated 2026-07-11: the gate +
    nav hamburger switch were lowered from `1200px` to `1024px` sitewide so the full desktop layout
    holds - as a proportional scaled-down miniature, never rearranging - all the way down to the 1024
    desktop-band floor. The nav's 1024-1300 clamp block scales the bar down to ~0.72x at 1024.)* The
    design is otherwise **proportionally identical 1024→1920** by construction - no fixed content
    max-width; the page gutter is fluid (`--pad: clamp(20px, 8vw, 144px)`), grids reflow on `1fr`, and
    in-band spacing/type uses `clamp()` so elements scale with the viewport with no breakpoint jumps.

<a id="rule-16"></a>
16. **🟢 The FAQ section has two sanctioned variants, one per section band - colour is
    automatic, never per-page.** *(Supersedes every earlier FAQ-styling instruction, 2026-07-10.)*
    Every FAQ block is `<section class="faq-wrap sec-light|sec-tint">` → `.faq-cols` holding
    `.faq-left` (`<h2 class="faq-title">Got Questions?</h2>` + `<FaqAccordion>`) and the `.faq-side`
    "Need A Clearer Direction?" card. The accordion is the shared **segmented** style: each
    `.faq-item` is its own bar with a **4px gap**, only the outer ends rounded (24px), a 16px
    question that animates `font-weight` 500→600 on open (needs the **variable** Outfit face), and a
    16px plus glyph whose vertical bar fades on open. The two variants differ only in colour, all set
    once in `global.css` and keyed on the band:
    - **Card fill** - `--faq-item-bg`, consumed by **both** the accordion segments **and** the side
      card so they always match, is set to the **other** band's colour: `sec-light → cream-400`,
      `sec-tint → cream-250`. The card thus sits one shade off the band it's on.
    - **Watermark** - `.faq-side .usr` is the band's **own** colour (`--faq-section-bg`), painted via
      a CSS `mask` of `/assets/user.svg` at full opacity (the external `<img>` can't inherit page
      colour), so it reads as a subtle tone-on-tone against the off-colour card. Hidden below 1024px.
    - **No strokes** on either segment - the fill delta + the 4px gaps carry all separation.
    Set only the band class on the page; **never** re-declare fills, borders, or the watermark in a
    page `<style>`. The homepage is the documented exception (single cream-100 band → `cream-350`
    items, its own olive side card, no watermark). Documented live in `/designsystem/proposed`.

<a id="rule-17"></a>
17. **🟢 There is ONE global button system - `.btn` + family + size (radius 4px).** *(Added
    2026-07-11 from the Figma "V4 / Buttons" sheet, node 1190:7111; role naming v2 same day.
    Radius changed 8px→4px, bound to `--radius-sm`, 2026-07-13.)*
    Compose a button as `.btn` + a **family** + a **size**: `<a class="btn btn-primary btn-xl">`.
    **Families (use in MODERATION - mostly primary + the black-stroke secondary):**
    - `btn-primary` - **gold solid**, the ONE main CTA per view.
    - `btn-secondary` - **black stroke** (outline), the standard secondary. **This is the secondary
      button** - reach for it for any "second" action on a light surface.
    - `btn-secondary-inverse` - **white stroke**, the secondary on **dark** surfaces (a black stroke
      is invisible there).
    - `btn-tertiary` - **solid black** (charcoal), low-emphasis solid (e.g. the nav pill); use
      sparingly.
    - `btn-tertiary-inverse` - **solid white/light**, the tertiary on dark; use sparingly.
    - `btn-link` (blue hyperlink) / `btn-link-inverse` (light link on dark) - text buttons.
    **Sizes:** `btn-xxl` 52 · `btn-xl` 48 · `btn-lg` 40 (= base default) · `btn-md` 36 · `btn-sm` 32.
    `btn-icon` makes a square icon-only button; in-button icons carry `btn-ico` (auto-sized on the
    16/20/24/32 scale, rule 4). Radius is **8px** across the whole scale. **Uniform footprint
    (2026-07-12):** every button carries a **220px min-width** (`--cta-w`, the hero CTA width) so
    action buttons share one width sitewide rather than shrink-wrapping - written `min-width:
    min(var(--cta-w), 100%)` so the cap auto-collapses in narrow/full-width containers and never
    overflows (add `style="width:100%"` for full-bleed). **Exempt** (they keep their own sizing):
    the compact `btn-md`/`btn-sm` (they hug), icon-only `btn-icon`, the nav pill `.nav-cta`, and the
    FAQ side-card CTA (`.faq-side .btn`); the homepage hero buttons set explicit inline widths.
    Hover is auto per family (gated at 1024px,
    rule 15); `:disabled`/`[aria-disabled]` grey it out. Colours bind to `--color-btn-*` semantic
    tokens (rule 9) - never hardcode a button colour on a page. Pages add only *layout* (width,
    responsive, alignment), never re-declare fill/height/radius/font. **Companion:** the infotext
    overlay `.infotip` (dark bubble + directional pointer; `.infotip-bottom/-top/-right/-left`).
    Documented live in `/designsystem/proposed`. **Every button on the site uses this system** - the
    legacy `.btn-gold`/`.btn-dark`/`.btn-ghost`/`.btn-outline` classes are retired (migrated sitewide
    2026-07-11): `btn-gold`→`btn-primary`, `btn-dark`→`btn-tertiary`, `btn-ghost`/`btn-outline`→
    `btn-secondary-inverse`.

<a id="rule-18"></a>
18. **🟢 The hero is a shared component - `<Hero>`, not hand-written markup.** *(Extracted
    2026-07-11; consolidated to dark-only + three types 2026-07-13.)*
    `src/components/sections/Hero.astro` renders the entire standardised hero band (rule 7): the
    dark `<section class="hero hero-dark">` (+ `hero-calc` for the calculator type), the
    breadcrumb folded into the `.hero-inner` stack, and - when an `aside` slot is present - the
    two-column `.hero-grid`. **Props:** `breadcrumb` (trail array), `cta` (`{ label, href }` - the
    single gold `btn-primary`, auto-sized to the **220px** `--cta-w` min-width set once in
    `global.css`), `calc` (Type 3 fixed calc-hero height), `reveal` (the `data-enter` scroll hook,
    default true), `id`/`dataSection`. **Slots:** `title` (H1 inner, rich markup ok), `lead`,
    `eyebrow`, `cta` (multi-button heroes), `aside` (form/card → promotes to the Type 2 two-column
    grid), and the default slot for extra in-hero content (calc chips, tables, contact pills).
    **A sitewide hero change - button style, width, spacing, a new element - is now a single edit
    to `Hero.astro` + `global.css`, never a per-page sweep.** The `variant` and `compact` props
    are gone (dark is the only surface; `compact` → `calc`). The few genuinely bespoke heroes with
    page-scoped `<style>` (homepage video hero, `about-us` stats, `antara`, `become-a-partner`, and
    the hand-written form heroes `open-demat-account`/`karnataka-bank-customers`/`contact-us`,
    `designsystem`) stay hand-written on the same `.hero.hero-dark` surface. New pages build their
    hero with `<Hero>` - never re-author the `<section class="hero">` markup.

<a id="rule-19"></a>
19. **🟢 Every How-To / process stepper is one of two shared components - `<StepsRow>` /
    `<StepsRows>`, never hand-written `.steps`.** *(Unified 2026-07-12; retired the old `StepFlow`
    component and the numbered `.steps`/`.step-div` markup.)* Both render an **icon-chip timeline**
    (a gold chip + title + desc per step, joined by a dashed connector in `--color-tan-500`).
    Each step is `{ icon, title, desc }`; **`icon` is a KEY into the shared set
    `src/components/sections/stepIcons.ts`** (24px inline `<svg>`s, rule 4) - never inline an SVG on a
    page, and add new concepts to `stepIcons.ts` only. Pick the component by step count:
    - **`<StepsRow steps={[…]}>`** - a single row (≤5 steps). Connector runs first-chip-centre →
      last-chip-centre (no bleed).
    - **`<StepsRows steps={[…]} perRow={N}>`** - multi-row (≥6 steps; choose `perRow` to balance rows,
      ≤5/row). Row 1 fills the row; **rows 2+ centre their chips**. Only the **stroke** bleeds - it runs
      out through the page gutter to the **viewport edge** to signal the wrap (first row → right edge;
      middle rows → full-bleed; last row: left edge → last chip). Chips never leave the content column.
    Both collapse to a vertical dashed spine below 1024px. **A sitewide stepper change is a single edit
    to these two files + `stepIcons.ts`.** *(Sole survivors on the legacy `.steps` markup, deliberately
    left as non-process lists: commodities "Essential Rules for Risk Management" and mutual-funds "How
    Mutual Funds Work".)*

---

## ▶️ Running / preview

- Install: `npm install`. Dev: `npm run dev` → `localhost:4321`. Build: `npm run build` →
  `./dist/`. Preview build: `npm run preview`.
- Clean, **extensionless, no-trailing-slash** URLs everywhere (`build.format: 'file'` +
  `trailingSlash: 'never'`): a page at `src/pages/equity.astro` serves at `/equity`.
  **Slug convention:** leaf pages use **hyphens between words** (`Mutual Funds` →
  `/mutual-funds`, `Open a Demat Account` → `/open-demat-account`), but **folder
  segments carry no hyphens** (`/regulatorydocuments/investor-charter`,
  `/designsystem/current`). Hub pages are flat files (`products.astro`, not
  `products/index.astro`) so GitHub Pages does not 301 them to a trailing slash;
  the only folders are `regulatorydocuments/` and `designsystem/`. The legacy reference site
  (`../Project 1`) can run alongside for pixel comparison (`python3 ../Project\ 1/serve.py`,
  port 4178, or the `static` launch config).

---

## 📁 Project structure

```
src/
  styles/global.css     Tailwind entry + the token system + base + every shared component.
  layouts/BaseLayout.astro   Templated <head>/SEO + Header/MegaNav/Footer + scroll-reveal.
  components/
    site/               Header, MobileMenu, MegaNav, Footer (chrome; render from navigation.ts).
    sections/           Composed sections: Hero (rule 18), StepsRow/StepsRows (+ stepIcons.ts, rule 19), FaqAccordion, …
    ui/                 Atomic primitives (as they are extracted).
  data/                 navigation.ts (nav tree → header/overlay/mobile/footer) + future data.
  lib/                  seo.ts (SEO type + fullTitle + faqPage/breadcrumb/organization schema).
  pages/                One .astro per URL. Content + composition only.
public/                 assets/ images/ videos/ favicon.png - served verbatim, root-absolute.
docs/                   legacy-style-audit.md, porting-guide.md, and the build specs.
```

## 🔗 The Figma round-trip

The plan: `/designsystem/proposed` is authored to map 1:1 onto Figma variables (primitive →
semantic → component). It gets exported into Figma → cleaned up and filled in with final values →
returned here. **Implementing the returned system should mean updating token *values* in
`global.css` (and resolving the documented Tier-2 items), never re-architecting components** -
that is exactly what the token contract (rule 9) buys us.
