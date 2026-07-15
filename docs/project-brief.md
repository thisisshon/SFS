# Shriram Financial Services — Project Brief

> A single-document map of the whole project: what it is, who acts in it, every page,
> every process, and the plan going forward. Written to be pasted into Claude Chat for
> planning. Two products live in this repo: **the marketing site** and **Proofkit**
> (an embedded content-review tool). Both are covered below.

---

## 1. What this is

A **static, multi-page marketing + product website** for Shriram Financial Services
(broking / demat / mutual funds / research / calculators), **architected to scale to
4,000+ pages**.

- **Stack:** [Astro](https://astro.build) (static output, no client framework) + [Tailwind CSS v4](https://tailwindcss.com).
- **Output:** plain static HTML, one shared cached stylesheet (`global.css`), lazy media, deferred scripts.
- **URLs:** flat, extensionless, no trailing slash (`src/pages/equity.astro` → `/equity`).
- **Origin:** an Astro + Tailwind rewrite of a legacy hand-authored static site, held to **pixel parity** with the original. The only intentional change was rationalising ~150 sprawling colours into a structured design-token system.

### The four pillars (every decision is judged against all four, never traded off)
1. **SEO** — semantic HTML, valid heading outline, per-page templated `<title>`/meta/canonical/OG/JSON-LD, every page in the sitemap. Metadata is **generated**, never hand-typed (`BaseLayout.astro` + `src/lib/seo.ts`).
2. **Reliability** — shared components over bespoke markup; static HTML, no runtime framework to fail.
3. **Visual consistency** — one token set, one type scale, one 8px spacing grid, one component library, enforced in `global.css`.
4. **Speed** — one cached tree-shaken stylesheet, static HTML, lazy media, bundled/deferred scripts.

### Core principle: **templates, not pages**
Page *types* are parametric components generated from templates + data in `src/data/`.
Single source of truth: no per-page CSS/JS forks; reused things live in
`global.css` / `src/components/` / `src/data/`.

---

## 2. Architecture & sources of truth

| Layer | File(s) | Role |
|---|---|---|
| **Design system (impl)** | `src/styles/global.css` | Token architecture (primitives → semantic roles → components), base rules, every shared component class. Editing it updates **every page at once**. |
| **Layout / SEO** | `src/layouts/BaseLayout.astro` + `src/lib/seo.ts` | Templated `<head>` / SEO + site chrome (Header, MegaNav, Footer) + scroll-reveal. `fullTitle()` normalises every title. |
| **Site chrome** | `src/components/site/` | Header, MobileMenu, MegaNav, Footer — all rendered from `navigation.ts`. |
| **Section components** | `src/components/sections/` | `Hero`, `StepsRow`/`StepsRows` (+ `stepIcons.ts`), `FaqAccordion`, etc. |
| **UI primitives** | `src/components/ui/` | Atomic building blocks (buttons, fields, cards). |
| **Content data** | `src/data/` | `navigation.ts` (feeds header, mega-nav, mobile menu **and** footer from one dataset), `calculators.ts`, `faqs.ts`. |
| **Design-system docs** | `internal/designsystem/` (local-only, off-build) | `current` (what is used) + `proposed` (what is suggested) — the Figma round-trip artifact. |
| **Rulebook** | `CLAUDE.md` + `docs/conventions.md` | 19 standing rules (full text in `docs/conventions.md#rule-N`). |

### The token contract (the design-system spine)
`@theme` primitives (raw hexes) → `@theme inline` semantic roles → components bind to the role.
Never hardcode a hex when a token exists. The **Figma round-trip** changes only token
*values*, never component code.

### The 19 standing rules (condensed)
Everything below is a hard invariant. The 🟢 ones are design-system rules.

1. Every page uses `BaseLayout` (pass a `seo` object).
2. Every page follows the design system (tokens + component classes; page `<style>` holds only genuinely-unique CSS, referencing tokens not hexes).
3. One font (Outfit) + `line-height:1.5` sitewide (sole exception: homepage store badges).
4. Icons are real inline `<svg>`, never glyphs/emoji, sized 16/20/24/32px only.
5. 🟢 No fractional opacity / alpha colours — every colour is a solid hex token (translucency only for shadow / backdrop-filter / motion opacity).
6. 🟢 Spacing on the 8px grid (4px worst case).
7. **Hero is standardised** — V4 dark is the ONLY surface, in **three types** under one `<Hero>`: **Type 1** one-column (default), **Type 2** two-column (`aside` slot → `.hero-grid`), **Type 3** calculator (`calc` → fixed 408px height). Homepage keeps its bespoke video hero.
8. Every form field uses the shared `.hf-field` component.
9. 🟢 The token contract (primitives → roles → components).
10. 🟢 Merge policy — Tier-1 merges applied; Tier-2 documented-not-applied.
11. 🟢 Design-guideline change = implement in `global.css`/components → document in `/designsystem/proposed` → add a `CLAUDE.md` line only if sitewide.
12. Headings are LEFT-aligned (`equity.astro` is the reference); only self-contained promo bands are centred.
13. The FAQ section header is always **"Got Questions?"**
14. 🟢 Interactive controls meet a 48px mobile tap target (icon glyph stays on its size scale).
15. 🟢 Hover states are desktop-only (`@media (min-width:1024px) and (hover:hover)`); layout is proportionally identical 1024→1920.
16. 🟢 FAQ section has two band-keyed variants (`sec-light`/`sec-tint`); colour is automatic.
17. 🟢 ONE global button system — `.btn` + family + size (radius 4px, 220px min-width). Families: primary (gold, one per view) · secondary (black stroke) · secondary-inverse (white stroke) · tertiary/tertiary-inverse · link.
18. 🟢 The hero is the shared `<Hero>` component — never re-author `<section class="hero">`.
19. 🟢 Every process stepper is `<StepsRow>` / `<StepsRows>` (icon key into `stepIcons.ts`).

---

## 3. The pages (44 total)

Flat, extensionless, no-trailing-slash. Product & calculator hubs are flat files; detail
pages are template-driven (`equity.astro` is the product-page reference). Two folders only:
`regulatorydocuments/` and (local-only) `designsystem/`.

### Core & company
| URL | Page |
|---|---|
| `/` | Homepage — bespoke video hero + glass Demat card, pinned "Why Shriram", advisory cards, dark product grid, steps, FAQ. |
| `/about-us` | About Us (stat hero, mission/vision/values, timeline). |
| `/open-demat-account` | Open a Demat Account (two-column hero + lead-capture form). |
| `/become-a-partner` | Become a Partner (apply form, eligibility checker, portfolio tabs). |
| `/karnataka-bank-customers` | Karnataka Bank 3-in-1 co-brand landing + lead form. |
| `/open-demat-campaign1` | Isolated demat campaign landing (logo-only bar, single-screen hero + lead form). |
| `/antara` | Explore Antara (Shriram X platform — feature/category grids, locked `.gate` card, FAQ). |
| `/sitemap` | HTML sitemap (built from `navigation.ts`). |
| `/contact-us` | Contact/Support hub (tabbed: Customer Care / Branch Locator / Downloads). |
| `/grievance-redressal` | Grievance Redressal. |

### Products (hub `/products`; detail pages template-driven from `equity.astro`)
`/equity` (reference) · `/derivatives` · `/mtf` · `/commodities` · `/currency` ·
`/mutual-funds` · `/etf` · `/ipo` · `/nfo` · `/nps` · `/bonds` · `/fixed-deposit` ·
`/loan-against-mutual-fund` · `/loan-against-shares` · `/global-investing`

### Research (hub `/research-hub`)
`/technical-analysis` (gated daily note) · `/fundamental-analysis` · `/mutual-fund-analysis`

### Calculators (hub `/calculators`; detail pages use Hero Type 3 @ 408px)
`/sip-calculator` · `/lumpsum-calculator` · `/swp-calculator` · `/nps-calculator` · `/fd-calculator`

### FAQs
`/faqs` — drill-down + a **retrieval-only** (no-LLM, no-backend) assistant. One corpus in
`src/data/faqs.ts` feeds the UI, the JSON-LD, and the bot.

### Legal & compliance
`/privacy-policy` · `/terms-and-conditions` · `/terms-of-use-purse` ·
`/regulatorydocuments` (hub) · `/regulatorydocuments/investor-charter` ·
`/regulatorydocuments/mandatory-member-details`

### Internal (noindex / off-build)
`/designsystem` (+ `current`, `proposed`) — Figma artifact, kept local, never shipped.
Plus the Proofkit routes below.

---

## 4. Proofkit — the embedded content-review tool

**A self-contained, toggleable, portable content-review package** living at
`src/plugins/proofkit/`. Non-technical teams walk the **live** site, drop numbered comments
on any element, and admins triage them — each with an auto-generated, developer-ready **AI
change-prompt**. Actioned changes pass through a **deploy gate** so a team only sees a change
once it's actually live.

- **One switch:** `PROOFKIT_ENABLED` in `config.ts` (true ⇒ tool live; false ⇒ gone site-wide).
- **Portable:** the whole tool is one folder that zips into any Astro / Claude Code project via four thin seams (one layout line + three route shims). Versioned — bump `VERSION` + `CHANGELOG.md` on every change; reconcile `README`/`INSTALL` at zip-export time.
- **Backend:** a Cloudflare Worker (KV comment store + notifications + two-tier auth + deploy gate + completion validation + AI-prompt generation). Deploys separately. Without it, Proofkit runs in **local-demo mode** (browser `localStorage`).

### Roles
| Role | Where | Can do |
|---|---|---|
| **Reviewer (team member)** | On-page overlay (`/review` sign-in) | Arm review mode, drop numbered pins on elements, add comments (+ "change it to…" for Content), reply on threads. **Add-only** — never edits/deletes. |
| **Team** | `/teamdash` (signs in with the team's own key) | See **only that team's** comments, server-side isolated + **masked** (Pending until Deployed, then Done). A notifications feed for go-lives. No admin detail (no working status, validation, or AI prompt). |
| **Admin / Builder** | `/review` → `/reviewdash` (admin password, or "Builder" in the teamdash dropdown) | See **all** teams' comments; set working status (Mark Complete / re-open / Close); delete threads; run **Deploy**; manage the notification feed. `Builder` is a login identity only (not a team). |

Teams are defined in `config.ts` `TEAMS` (e.g. Product / SEO / Marketing / Content);
each has a colour and its own reviewer key.

### The deploy-gated lifecycle (the core process)
Every comment carries **two truths**: the admin's **working** status and **what the team sees**.

```
Comment posted (team)   status=open, published=false        → team sees "Pending"
  ↓ admin actions it in code, rebuilds the live site
Mark Complete           status=completed (runs validation)   → sits in the DEPLOY BUCKET (silent)
Deploy (batch)          published=true                       → notifications fire → team sees "Done"
```

- **Completion validation** (content changes only): on Mark Complete, the Worker fetches the live page and confirms the replacement copy is present (`content-copy-match`); otherwise `manual`. Completing is allowed even when unverified (re-runnable).
- **Notifications** are created **only by Deploy** — one per newly-published root comment; unread tracked per audience (`readAdmin` / `readTeam`).
- **Team-visible status has only two values:** *Pending* (open) and *Done* (published). The admin's richer lifecycle stays behind the deploy gate.

### Admin dashboard IA
Left sidebar: **Overview · Deploy · Notifications · Master Log**.
- **Overview** tabs: All / By Page / Open / In Bucket / Deployed / Closed; team-colour filter chips; live counts; 30s + on-focus refresh. "All" = active worklist (open + in-bucket; deployed excluded).
- **Master Log** = full record: per-entry table (When / Page / Element / Team / Status / Prompt) with a "View more" drill-in + a status-history timeline.
- **Deploy** = the bucket of completed-but-unpublished comments + a batch Deploy button.
- **Notifications** = full deploy feed with read/unread tracking.

### Two-tier auth (enforced server-side)
- **Reviewer key** — add comments + read a page's pins; on `/teamdash`, read the signing team's own comments + notifications. Per-team key (`TEAM_KEYS` JSON map) or a shared `REVIEW_PASS` fallback.
- **Admin** (`ADMIN_PASS`) — read ALL comments, set status, deploy, delete, all notifications. Admin ⊇ reviewer.

### Worker endpoints (reference)
Auth via header `X-Review-Pass`.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/comments` | add a comment | reviewer |
| GET | `/comments?path=/x` | one page's comments (overlay pins) | reviewer |
| GET | `/comments` | ALL comments (admin) | admin |
| GET | `/comments?team=X` | one team's comments, **masked** | admin or team X |
| POST | `/status` | set working status (`open`/`completed`/`closed`; completed runs validation) | admin |
| POST | `/deploy` | publish the bucket + fire notifications | admin |
| POST | `/delete` | delete a thread | admin |
| GET | `/notifications` | full feed | admin |
| GET | `/notifications?team=X` | team X's feed | admin or team X |
| POST | `/notifications/read` | mark read/unread | reviewer |

### AI change-prompt provider (pluggable, env-driven)
- **Cloudflare Workers AI** (default) — `[ai]` binding, model override via `AI_MODEL`.
- **Anthropic (Claude)** — set `ANTHROPIC_API_KEY`; model override via `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`).
- Falls back to a deterministic instruction if no provider / on error.

### Proofkit routes
`/review` (login) · `/reviewdash` (admin) · `/teamdash` (per-team) — all noindex.

---

## 5. Cross-cutting functions & systems

- **Navigation** — one dataset (`src/data/navigation.ts`) renders header, mega-nav, mobile menu, footer, and the HTML sitemap. Change the site's IA in one file.
- **SEO generation** — `src/lib/seo.ts` (`SEO` type, `fullTitle()`, schema helpers) + `BaseLayout` produce per-page title/meta/canonical/OG/Twitter/JSON-LD + sitemap entry. No page hand-types head tags.
- **Hero system** — one `<Hero>` component, three types, one dark surface. A sitewide hero change is one edit.
- **Steppers** — `<StepsRow>` / `<StepsRows>` icon-chip timelines, icons keyed via `stepIcons.ts`.
- **FAQ** — `FaqAccordion` + band-keyed colour variants; header always "Got Questions?".
- **Buttons / fields** — one `.btn` system, one `.hf-field` field component.
- **Calculators** — driven by `src/data/calculators.ts` (`calcHref` → route); Hero Type 3 fixed height.
- **FAQ assistant** — retrieval-only over `src/data/faqs.ts`, no LLM / no backend.
- **Page-metadata export** — `shriram-page-metadata.xlsx` is regenerated on any URL/SEO change.

---

## 6. Where things live (map)

```
src/
  styles/global.css          Design system: tokens + base + every shared component.
  layouts/BaseLayout.astro   Templated <head>/SEO + Header/MegaNav/Footer + scroll-reveal.
  components/site/            Header, MobileMenu, MegaNav, Footer (from navigation.ts).
  components/sections/        Hero, StepsRow/StepsRows (+ stepIcons.ts), FaqAccordion, …
  components/ui/              Atomic primitives.
  data/                       navigation.ts, calculators.ts, faqs.ts.
  lib/seo.ts                 SEO type + fullTitle + schema helpers.
  pages/                      One .astro per URL. Content + composition only.
  plugins/proofkit/           Isolated versioned review tool (config.ts, Overlay, Login,
                              Dashboard, TeamDashboard, worker/, core/, README/INSTALL/CHANGELOG).
public/                       assets/ images/ videos/ favicon — served verbatim.
internal/designsystem/        Design-system docs (local-only, off-build).
docs/                         conventions.md, pages.md, legacy-style-audit.md, porting-guide.md.
```

---

## 7. Plan / open threads

Use this section to drive planning in Claude Chat. Current state + candidate next steps:

**Solid / done**
- 44 pages built to design-system + rule compliance; dark V4 hero consolidated (3 types).
- Design token contract in place; Figma round-trip wired (`/designsystem/proposed`).
- Proofkit shipped through v2.23 (overlay + admin + per-team dashboards + deploy gate + Worker).
- FAQs page + retrieval assistant; homepage scroll-pin sections.

**Scale readiness (the North Star — 4,000+ pages)**
- Product & research detail pages are template-driven; verify every remaining page type is parametric (template + data), not hand-authored, before multiplying.
- Data layer (`src/data/`) is the multiplication point — confirm each repeated page family has a dataset feeding it.
- Sitemap / metadata generation must stay 100% automatic as page count grows.

**Candidate workstreams to plan**
1. **Content scale-out** — which page families reach thousands (branch pages? city/product matrices? fund pages?), and the data schema each needs.
2. **Proofkit hardening** — real Worker deployment (KV + per-team keys + admin pass), AI-prompt provider choice, UAT seeding workflow, notification UX.
3. **Design-system → Figma** — finish the round-trip; lock token values from Figma back into `global.css`.
4. **Performance budget** — define and enforce concrete budgets (CSS size, LCP, image strategy) as pages multiply.
5. **SEO depth** — JSON-LD coverage per page type, internal-linking strategy at scale, canonical/hreflang if multi-region.

**Constraints to respect in any plan**
- Never fork `global.css`; changes are token/component edits that cascade.
- Templates not pages; single source of truth in `data/` + `components/`.
- Every new capability vetted against all four pillars (SEO / reliability / consistency / speed) before adoption.
- Proofkit stays isolated + versioned; per change bump VERSION + CHANGELOG.

---

*Generated as a planning snapshot. The authoritative rules live in `CLAUDE.md` +
`docs/conventions.md`; the full page inventory in `docs/pages.md`; Proofkit's contract in
`src/plugins/proofkit/README.md`.*
