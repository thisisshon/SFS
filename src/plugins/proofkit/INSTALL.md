# Installing Proofkit into a project

Proofkit ships as **one folder** (`proofkit/`). Dropping it into an Astro project is:
**(1) copy the folder, (2) add three thin seams, (3) edit `config.ts`, (4) (optional) deploy
the Worker.** No build config changes, no dependencies to install.

This file is written so a **Claude Code agent** can do the integration unattended — or a human
can follow the same steps. There's a copy-paste prompt at the bottom.

---

## Prerequisites (what the host project must provide)

- **Astro** (static or hybrid output).
- A **shared layout** component that every page already uses, which accepts an `seo`-style prop
  and renders page content through a default `<slot/>` (this repo's is `src/layouts/BaseLayout.astro`).
- An **SEO type** (this repo: `src/lib/seo.ts`). If the host has none, drop the `seo` prop typing
  and pass plain `{ title, description, path, noindex }` objects.
- Optional: **design tokens** (`--color-*`) and the site font. Proofkit's CSS references a few host
  tokens with hard-coded fallbacks, so it renders fine without them — restyle later for brand parity.
- Optional: a **Cloudflare account** for the shared backend. Without it, Proofkit runs in
  **localStorage demo mode** (single-browser, any password accepted) so you can try it immediately.

---

## Steps

### 1. Copy the folder
Place this entire `proofkit/` folder at `src/plugins/proofkit/` in the target project.

### 2. Add the overlay seam (shared layout)
In the host's shared layout, import the config + overlay and render it gated on the switch, just
before `</body>` (or wherever body-end content goes):

```astro
---
import ProofkitOverlay from '../plugins/proofkit/Overlay.astro';
import { PROOFKIT_ENABLED } from '../plugins/proofkit/config';
---
    ...
    {PROOFKIT_ENABLED && <ProofkitOverlay />}
  </body>
```
Adjust the relative path if the layout isn't at `src/layouts/`.

### 3. Add the two route shims (`src/pages/`)
Astro requires route files under `src/pages/`. Create these two thin shims (copy verbatim; adjust
the `BaseLayout` import path + the `seo` prop name to the host's layout API):

`src/pages/review.astro`
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProofkitLogin from '../plugins/proofkit/Login.astro';
import { PROOFKIT_ENABLED, loginSeo } from '../plugins/proofkit/config';
const offSeo = { title: 'Not Found', description: 'Not available.', path: '/review', noindex: true };
---
{PROOFKIT_ENABLED
  ? <BaseLayout seo={loginSeo} footer="custom"><ProofkitLogin /></BaseLayout>
  : <BaseLayout seo={offSeo} footer="custom"><section class="section"><p>Not available.</p></section></BaseLayout>}
```

`src/pages/reviewdash.astro`
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProofkitDashboard from '../plugins/proofkit/Dashboard.astro';
import { PROOFKIT_ENABLED, dashSeo } from '../plugins/proofkit/config';
const offSeo = { title: 'Not Found', description: 'Not available.', path: '/reviewdash', noindex: true };
---
{PROOFKIT_ENABLED
  ? <BaseLayout seo={dashSeo} footer="custom" chrome={false}><ProofkitDashboard /></BaseLayout>
  : <BaseLayout seo={offSeo} footer="custom"><section class="section"><p>Not available.</p></section></BaseLayout>}
```
The dashboard is a full-bleed app that owns its chrome, so render it **without the host site
header/footer**. Above, `footer="custom"` skips the footer and `chrome={false}` skips the header +
nav — both are host-layout specifics. In another project, use whatever your layout offers to omit
its header/footer on this route (a prop, a bare layout, or a standalone `<html>` shell). ProofKit
is self-themed, so it needs nothing from the host layout but the document shell.

### 4. Configure (`src/plugins/proofkit/config.ts`)
Edit for the new site: `PROOFKIT_ENABLED`, `TEAMS`, `TEAM_COLORS`, `HIDE_SELECTORS` (host-page
elements to hide while review mode is armed — `[]` if none), and the two route `SEO` objects. Fix
the `import type { SEO }` path if the host's SEO type isn't at `../../lib/seo`.

### 5. (Optional) Deploy the Worker for the shared store
See `README.md` → "The Worker". In short: from `proofkit/worker/`, `wrangler kv namespace create
COMMENTS`, set `ALLOW_ORIGIN` + a project `name` in `wrangler.toml`, `wrangler secret put
REVIEW_PASS` + `ADMIN_PASS`, `wrangler deploy`. Then expose the printed URL to the build as
`PUBLIC_REVIEW_WORKER_URL` (CI env var, or a git-ignored `.env`). `config.ts` reads it as `WORKER_URL`.

### 6. Verify
`npm run build` should pass. With `PROOFKIT_ENABLED = true`: open `/review` → sign in → it arms
review mode and lands on the dashboard. Now open any content page → a **Comment** button appears →
click → (Team + Key login) → grayscale review mode → click to comment. Before signing in at `/review`,
no Comment button shows. Flip to `false` and rebuild → overlay gone, both routes are stubs.

---

## Updating an existing copy

Proofkit is versioned (`VERSION` + `package.json` + `CHANGELOG.md`). To update a project that has an
older copy: compare its `proofkit/VERSION` to the new one; if older, **replace the whole
`src/plugins/proofkit/` folder** with the newer package. The seams (steps 2–3) rarely change — check
the changelog's "seams" notes before overwriting. Re-apply any local `config.ts` edits afterward
(teams/colours/hide-selectors are the usual local deltas).

---

## Prompt for a Claude Code agent

> Install the Proofkit content-review tool into this project. The package is at
> `src/plugins/proofkit/` (or unzip it there). Read `src/plugins/proofkit/INSTALL.md` and
> `README.md`, then: (1) add the gated `{PROOFKIT_ENABLED && <ProofkitOverlay />}` line to this
> project's shared layout with the correct import path; (2) create the `src/pages/review.astro` and
> `src/pages/reviewdash.astro` route shims, adapting the `BaseLayout` import and `seo` prop to this
> project's layout API; (3) fix the `SEO` type import path in `config.ts` if needed; (4) leave
> `PROOFKIT_ENABLED = true` and the Worker in localStorage demo mode for now. Then run the build and
> confirm it passes, and confirm `?review=1` shows the Comment button on a page.
