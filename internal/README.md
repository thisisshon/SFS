# internal/ — off-build reference material

Files here are **deliberately outside `src/pages/`** so Astro never routes or
builds them. Nothing in this folder ships to UAT or production — the deploy only
uploads `dist/`, and these files never reach it.

## Contents

| Path | What it is |
|---|---|
| `DESIGN-SYSTEM.md` | The design-system **direction** doc (rulebook prose). Implementation lives in `src/styles/global.css` + `src/components/`. |
| `designsystem.astro` + `designsystem/` | The `/designsystem` hub + `current` / `proposed` pages — the Figma round-trip artifact. Internal tooling, not part of the public site. |

## Previewing the design-system pages locally

They are dormant here (their `../layouts/…` imports resolve only from
`src/pages/`). To work on them, move them back, run the dev server, then move
them out again before deploying:

```sh
git mv internal/designsystem src/pages/designsystem
git mv internal/designsystem.astro src/pages/designsystem.astro
npm run dev            # /designsystem, /designsystem/current, /designsystem/proposed
# …edit, then reverse the two git mv commands before pushing to UAT/prod.
```

Keeping them out of `src/pages/` is what keeps `/designsystem/*` out of the
public build and sitemap.
