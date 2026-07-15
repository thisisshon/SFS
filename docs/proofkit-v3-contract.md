# Proofkit v3.0 — Build Contract (single source of truth for all build agents)

> **Read this before touching any file.** Proofkit v3 is a full clone of the v2.24.1 tool at
> `src/plugins/proofkit-v3/`, isolated from v2 at every seam, carrying all 12 features of the
> approved spec (evaluation: `docs/proofkit-feature-plan.md`). v2 (`src/plugins/proofkit/`)
> stays the untouched user-facing default at `/review` + `/reviewdash` + `/teamdash`.
> v3 lives at `/review3` + `/reviewdash3` + `/teamdash3`, reachable via the "Proofkit 3.0"
> button on the v2 admin dashboard. **Never edit `src/plugins/proofkit/` (v2) — only the
> `-v3` clone.** Never edit files outside your assigned ownership list.

---

## 1. Isolation namespacing (Phase "Isolate" — one agent, must land before builders)

Inside `src/plugins/proofkit-v3/` ONLY. Do **not** rename files, CSS classes (`.rvd`/`.tmd`/
`.rv-`/`.pk-`), or imports — only the following **string values**:

**Routes** (order matters — longest first):
- `/reviewdash` → `/reviewdash3` (incl. `location.pathname === '/reviewdash'` guards, hrefs,
  `?login=builder` links, config.ts `path:`)
- `/teamdash` → `/teamdash3`
- `/review` → `/review3` — careful: this includes overlay.js `pagePath()`/`reviewUrl()`
  regexes (`/\/review\/?$/` → `/\/review3\/?$/`, `p + '/review'` → `p + '/review3'`) and the
  `?review=0` sign-out param → `?review3=0` (`searchParams.get('review')` → `'review3'`).
  Do NOT touch words like "review" in prose/comments where it isn't a URL/param.

**Browser storage keys** (exact strings):
`pkTeam`→`pk3Team` · `pkKey`→`pk3Key` · `pkTheme`→`pk3Theme` · `pkDemoReset`→`pk3DemoReset` ·
`pkDemoSeeded`→`pk3DemoSeeded` · `pkAutoReview`→`pk3AutoReview` · `reviewMode`→`reviewMode3` ·
`reviewSessionId`→`reviewSessionId3` · `rvc:`→`rvc3:` · `rvc-notifications`→`rvc3-notifications` ·
`rvc-ticketseq:`→`rvc3-ticketseq:`

**Globals / env:** `window.PROOFKIT_WORKER_URL` → `window.PROOFKIT3_WORKER_URL` (all four
`.astro` adapters + `core/config.js`); `import.meta.env.PUBLIC_REVIEW_WORKER_URL` →
`PUBLIC_REVIEW_WORKER_URL_V3` (config.ts). Unset ⇒ v3 runs in localStorage demo mode — that IS
the intended default until a v3 Worker is deployed.

**Deep links:** `#c=` → `#c3=` everywhere (`/[#&]c=/` → `/[#&]c3=/`, `c=([^&]+)` →
`c3=([^&]+)`, and every dashboard "Open Pin" link builder producing `#c=`).

**Overlay arm guard:** overlay.js must never arm on `/reviewdash3`, `/teamdash3`, `/reviewdash`,
`/teamdash` (extend the existing single `/reviewdash` check).

**Worker identity:** `wrangler.toml` `name = "shriram-review-v3"`; comment that a NEW KV
namespace must be created for v3 (leave the id line but flag it `# TODO v3: create new KV`).

**Package identity:** `VERSION` → `3.0.0`; `package.json` version → `3.0.0`;
prepend a `## 3.0.0` CHANGELOG entry stub (the docs agent completes it).

Verify with greps before finishing: no remaining `pkTeam|pkAutoReview|'reviewMode'|rvc:|
rvc-notifications|PROOFKIT_WORKER_URL\b|/reviewdash'|/teamdash'|#c=` inside the v3 folder
(excluding CHANGELOG history text, which may keep old names).

---

## 2. The v3 record shape (backward-compatible; every new field defaults when missing)

Extends the v2.24 record (see worker.js `POST /comments`). New/changed fields:

```js
{
  // NEW — Feature 1
  commentType: 'copy-fix'|'image-swap'|'link-fix'|'layout-tweak'|'general', // default 'general'
  templateFields: {},   // type-specific (see §3); {} for general
  summary: '',          // one-line plain-text preview, server-rendered if client omits
  // NEW — Feature 8
  expectedOutcome: '',  // REQUIRED (client+server) iff commentType ∈ {layout-tweak, image-swap}
  // NEW — Feature 2
  batchId: '',          // client uuid grouping one Submit-all
  // NEW — Feature 4 (screenshots live OUTSIDE the page array)
  imageId: '',          // '' = none; image stored under KV key `img:<imageId>` (dataURL string)
  // CHANGED — Feature 3 (reopen is enum + note now)
  reopenReason: 'needs-clarification'|'wrong-element'|'design-mismatch'|'other'|'',
  reopenNote: '',       // REQUIRED (client+server) iff reopenReason === 'other'
  // history entries gain the same: { status, at, event, iteration, reason?, note? }
}
```

Replies (`parentId` set) in v3: **no ticket number** (skip `nextTicket`), **no arrival notif**;
they are the Feature-6 "Quick questions" channel and never change status/iteration.

`maskForTeam` passes through: `commentType, templateFields, summary, expectedOutcome,
imageId, reopenReason, reopenNote` (teams see their own structured data; `aiPrompt` stays included
as in v2.24).

---

## 3. commentType → templateFields (Feature 1)

| type | templateFields | notes |
|---|---|---|
| `copy-fix` | `{ currentText, newText }` | `newText` mirrors into legacy `changeTo` so v2-era rendering/AI-prompt logic keeps working |
| `image-swap` | `{ currentImage, replacementDesc }` | `currentImage` auto-filled client-side (element `src`/`alt`/selector), read-only in UI |
| `link-fix` | `{ currentUrl, newUrl }` | `currentUrl` auto-filled from the clicked `<a>` when available |
| `layout-tweak` | `{ whatToChange }` | + required `expectedOutcome` |
| `general` | `{}` | EXACTLY the v2 freeform behaviour — zero regression |

Server renders `summary` when absent: `copy-fix: "…currentText → newText…"`,
`link-fix: "old → new"`, `image-swap: "swap <currentImage>: <replacementDesc>"`,
`layout-tweak: whatToChange`, `general: first 80 chars of comment`.

`genPrompt` facts MUST gain: `comment_type`, `template_fields`, `expected_outcome` (Feature-1/8
data flows into the AI change-prompt — omitting this is a regression).

---

## 4. Worker endpoints — v3 additions/changes (`worker/worker.js`)

All existing v2.24 endpoints keep working. Changes:

- `POST /comments` — accepts a single object **or an array** (Feature 2). Array ⇒ process
  per-item (one bad item never blocks the rest), respond `201 { results: [{ ok, rec? , error? }] }`
  in input order. Validates per item: non-empty comment; enum `commentType`; `expectedOutcome`
  required for layout-tweak/image-swap; replies skip ticket+arrival-notif.
- `POST /team-status` — reopen body is now `{ id, action:'reopen', reason:<enum>, note? }`;
  reject non-enum reason (400); `note` required iff reason `other` (400). Store both on record +
  history entry. Update `statusSummary` to include the human reason label.
- `POST /image` (NEW, reviewer) — body `{ id?, dataUrl }`, dataUrl ≤ 200KB after client
  downscale; stores KV `img:<uuid>` (the raw dataURL string), returns `{ imageId }`. Never
  required for comment creation.
- `GET /image?id=X` (NEW, reviewer) — returns `{ dataUrl }` or 404.
- `POST /replies-notif` — NOT an endpoint; instead `POST /comments` with `parentId` fires a
  **`kind:'reply'`** notification (debounced via the existing `pushStatusNotif`-style coalescing,
  target = the OTHER side: replier team === raiser ⇒ notify `toTeam`, else notify `team`).
- `GET /views` / `POST /views` (NEW — Feature 11) — saved views, KV key `views:<team>`
  (admin uses `views:__admin`). POST body `{ views: [{ name, filters }] }` replaces the caller's
  set (simple CRUD-by-replace). Scoped to the caller's auth (team key ⇒ own team; admin ⇒ admin).
- `GET /metrics?from=ISO&to=ISO` (NEW — Feature 12, admin only) — reads the **rollup** KV key
  `metrics` (see below) + falls back to a full scan when absent. Returns
  `{ deployedPerPage:{}, volumeByType:{}, avgHoursToDeploy:{ global, perPage:{} },
     reopenRate:{ global, perType:{} }, openTrend:[{date,count}] }`.
- **Rollup maintenance:** every state transition (`/team-status`, `/resubmit`, creation) also
  read-modify-writes KV `metrics` — an events array of
  `{ at, event, page, commentType, iteration }` capped at 5000 entries (FIFO). Metrics compute
  from this, not from scanning every `page:` key.
- `GET /comments?groupBy=page` (Feature 9) — optional; grouping is primarily client-side.

CORS: unchanged headers suffice (POST /image is JSON).

---

## 5. Client behaviours

**Overlay (`core/overlay.js` + `Overlay.astro`)**
- **Load gating:** v3 Overlay.astro must use a conditional **dynamic import** — only pull the
  core when `sessionStorage.reviewMode3 === '1'` or `pk3AutoReview`/`#c3=` present — so 4,000
  host pages don't pay for a second eager bundle.
- **teamStatus rewire (prereq F5):** delete every read of the dead `status` field
  (`open/resolved/closed`). Pins/threads read `teamStatus`. Pin visibility: hide
  `deployed_live` roots (deep-linked one still force-shows).
- **Pin colours (F5):** pin background by teamStatus — `to_be_initiated`=`var(--pk-amber)`,
  `in_progress`=`var(--pk-blue)`, `deployed_live`=`var(--pk-green)`, `reopened`=`var(--pk-softred)`.
  Number stays readable (`var(--pk-on-accent)` ink or dark ink on amber).
- **Draft tray (F2):** clicks create DRAFTS (local array), not POSTs. Tray UI in the dock:
  "Pending pins (n)" — expandable list, per-draft edit/remove. "Submit all" POSTs the array
  (batch), maps per-item results, retry-failed-only on partial failure. Exiting review with
  drafts pending ⇒ confirm-discard. Demo mode: local store gets the same batch semantics.
- **Type templates (F1):** composer gains a type selector (5 chips/dropdown) swapping the
  field set per §3; `general` = today's single textarea untouched. Auto-fill `currentImage` /
  `currentUrl` from the clicked element.
- **Expected outcome (F8):** required textarea for layout-tweak/image-swap; block draft-save
  without it.
- **Duplicate warning (F7):** on composer open, scan in-memory root comments
  (`teamStatus !== 'deployed_live'`, same page): same `anchor.selector` OR pin distance < 48px
  ⇒ non-blocking warning strip "Similar comment already open — view", linking to the thread.
  Never blocks submission.
- **Screenshot (F4):** at draft-creation, dynamically import html2canvas from
  `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js` (only at capture
  time), capture the element + ~100px context, downscale to max 480px wide JPEG (~quality .7),
  attach as `dataUrl` on the draft; on batch submit, POST /image first, set `imageId`. ANY
  capture failure ⇒ proceed without image (placeholder text "preview unavailable"). Demo mode:
  store dataURL under `rvc3-img:<id>` with a try/catch quota guard.

**Admin dashboard (`core/dashboard.js/.html/.css` + `Dashboard.astro`)**
- Render typed fields per §3 (labelled rows, never raw JSON); `summary` as the list-line.
- Thumbnail (F4) in the card when `imageId` (fetch `GET /image`), full-size in detail;
  "preview unavailable" placeholder otherwise.
- **Reopen modal (F3):** reason dropdown (4 enum labels: "Needs clarification", "Wrong element",
  "Design mismatch", "Other") + note field (shown always, required only for Other). Replaces the
  freeform prompt. Badge "Reopened: <label>" on cards + timeline.
- **Quick questions (F6):** a reply thread section in ticket detail, visually distinct from
  status actions; posting a reply never changes status.
- **Expected outcome (F8):** prominent callout on the detail ("Success criteria") for
  layout-tweak/image-swap.
- **Location hint (F10):** "Likely location: `<anchor.selector>`" with a copy button + a
  "best-effort" caption; clamp long selectors with ellipsis + full value on the copy.
- **Group by page (F9):** a "Group by page" toggle on the Team Queue clustering by
  `page.path` with per-page counts; toggle off restores the flat sort.
- **Saved views (F11):** "Save view" button captures current filters (search, sort, status tab,
  team chips, group-by); saved views render as quick-select chips; persist via GET/POST /views
  (demo: `rvc3-views`). Label the feature "Team views" (they're shared per key, not per person).
- **Insights (F12):** new left-nav item "Insights" (admin) — date-range picker (from/to),
  stat tiles + CSS-bar charts for the five §4 metrics. Minimal but token-styled.
- **Notifications:** render `kind:'reply'` items distinctly (icon/label "Reply").

**Team dashboard (`core/teamdash.js/.html/.css` + `TeamDashboard.astro`)**
- Same typed-field rendering, thumbnails, quick-questions, reopen badges (reason label visible
  to the raiser), saved views (own team), reply notifications. No Insights, no admin actions.

**Core (`core/config.js`, `config.ts`, `design/*.css`, `core/login.*`, `Login.astro`)**
- Export the shared vocab (single source): `COMMENT_TYPES` (array of `{value,label}`),
  `TYPE_FIELDS` (per-type field meta: key, label, placeholder, autoFill, required),
  `REOPEN_REASONS` (`{value,label}` ×4), `STATUS_COLORS`
  (`{to_be_initiated:'--pk-amber', in_progress:'--pk-blue', deployed_live:'--pk-green',
  reopened:'--pk-softred'}`), `renderSummary(commentType, templateFields, comment)`,
  plus keep every existing export intact.
- `components.css`: shared classes for the type-selector chips, draft tray, dup-warning strip,
  reopen modal, insights bars — token-bound only (no raw hexes; reuse `--pk-*`).

---

## 6. Ownership map (an agent edits ONLY its files)

| Agent | Files (all under `src/plugins/proofkit-v3/`) |
|---|---|
| worker-builder | `worker/worker.js`, `worker/wrangler.toml` |
| overlay-builder | `core/overlay.js`, `Overlay.astro` |
| dashboard-builder | `core/dashboard.js`, `core/dashboard.html`, `core/dashboard.css`, `Dashboard.astro` |
| teamdash-builder | `core/teamdash.js`, `core/teamdash.html`, `core/teamdash.css`, `TeamDashboard.astro` |
| core-builder | `core/config.js`, `config.ts`, `core/design/tokens.css`, `core/design/components.css`, `core/login.js`, `core/login.html`, `core/login.css`, `Login.astro` |
| docs-builder | `README.md`, `INSTALL.md`, `CHANGELOG.md`, `REMOVAL.md`, `VERSION`, `package.json`, `data/README.md`, `scripts/README.md` |

Rules for every agent: match the file's existing idiom/comment density · every new record field
defaults when missing (`|| ''` posture) · demo-mode (localStorage) parity for anything you add ·
NO `npm run build`/dev servers (a gate agent does that) · don't bump VERSION (docs-builder owns
identity) · v2 (`src/plugins/proofkit/`) is READ-ONLY reference.

---

## 7. Decisions locked (from the evaluation)

- **F4 screenshots: build the thin-infra version** — KV `img:` keys + client downscale + CDN
  dynamic import. No R2, images never in the page array, failure never blocks.
- **F6: repurpose the existing `parentId` reply thread** as Quick questions (no ticket, no
  status effect, `kind:'reply'` notif) — no second thread structure.
- **F5 prereq**: the overlay `teamStatus` rewire ships in the same overlay pass.
- v3 default backend = **demo mode** (no Worker deployed yet); everything must work
  end-to-end in demo mode.
