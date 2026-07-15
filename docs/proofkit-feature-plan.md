# Proofkit — Feature-Spec Evaluation & Implementation Plan

> Evaluation of the 12-feature "First Build List" against the **actual v2.24.0 code**
> (`src/plugins/proofkit/`), plus a sequenced build plan. Grounded in `worker/worker.js`
> (backend state machine), `core/overlay.js` (on-page composer + pins), `core/dashboard.js`
> (admin), `core/teamdash.js` (team), `core/config.js`, and `core/design/tokens.css`.

---

## 0. Verdict

**The spec is well-grounded and buildable.** It correctly reflects the *current* real-time
model: the deploy gate and `content-copy-match` auto-validation described in the old README are
**gone** — the Worker is now a per-ticket state machine (`to_be_initiated → in_progress →
deployed_live`, `reopen → reopened`, `resubmit → new iteration`). The spec's status names,
its "expected outcome is now the manual replacement signal" premise (Feature 8), and its build
sequencing instincts are all consistent with the code.

**But three things need correcting, and several cross-cutting costs are missing.** Details below.
Net: proceed, but re-scope Features 4/5/6/10 against what already exists, and bake in the
per-feature tax the spec omits (localStorage-demo parity, AI-prompt wiring, VERSION/CHANGELOG,
and the ripple across *two* dashboards + standalone HTML entries).

---

## 1. Reality check — each feature vs. the code

Legend: **Green** = as-described, clean add · **Amber** = mis-states current state, re-scope ·
**Red** = heaviest / needs an infra decision.

| # | Feature | Status | Reality against current code |
|---|---|---|---|
| 1 | Change-type templates | 🟢 | Clean add. Composer today = one freeform `<textarea>` + "Direct to" dropdown (`overlay.js` `openComposer`). `changeTo` field already exists → maps to `copy-fix`'s "New text". `general` = today's behaviour verbatim (easy regression guard). **Must also feed `genPrompt`** (see §2). |
| 2 | Batch submit | 🟢 | Today each pin POSTs immediately and pushes the returned rec to `comments`. Needs a client-side draft tray + a batch endpoint. Worker's `nextTicket`/notif writes are non-atomic KV read-modify-writes — a server-side batch loop is fine at volume; note it, don't fight it. |
| 3 | Quick reopen reasons | 🟡 | **Already half-built.** Worker `/team-status` reopen **already requires a non-empty `reason`** and stores it on `reopenReason` + `history[].reason` (worker.js L278, L298–302). This feature is a *free-text → enum + conditional note* upgrade, not new plumbing. Enforce the `other ⇒ note required` rule **server-side too**. |
| 4 | Inline element preview (auto screenshot) | 🔴 | **Heaviest; needs an infra decision (§3-A).** Overlay currently pulls in **zero** external libs at runtime. `html2canvas` is ~150KB+ and has real fidelity gaps (cross-origin images, modern CSS). Images **must not** live in the `page:<path>` KV array — that array is re-read on *every* overlay load and *every* dashboard refresh; base64 blobs there = a hard perf regression. → R2 + reference URL only. Also needs an R2 binding + CORS review (upload path). |
| 5 | Status colour-coding on live pins | 🟡 | **Mis-stated as "data model: none — reads existing status field."** The overlay pins read the **old** `status` (`open/resolved/closed`) field (`overlay.js` L386, L398, L562), **not** the Worker's `teamStatus`. Records from the Worker don't carry `status` at all → today pins never colour and `isUnresolvedC` treats everything as open. **Prereq: rewire the overlay to `teamStatus`.** Colours already exist as tokens: amber `--pk-amber` (TBI), blue `--pk-blue` (in-progress), green `--pk-green` (deployed), coral `--pk-softred` (reopened). |
| 6 | Threaded replies before reopen | 🟡 | **Overlaps existing replies.** Threaded replies **already exist** (`addReply`, `parentId` chaining) — but as *full comment records* that get their own ticket number. The spec wants a *lighter* `threadReplies:{author,role,text,ts}[]` that never mints a ticket / changes status, with a distinct notif `kind`. **Decision needed (§3-B): replace the existing reply mechanism, or run a parallel lightweight thread?** Notif infra is ready — `kind` already discriminates (`status`/`directed`); add `kind:'reply'`. |
| 7 | Auto-detect duplicate pins | 🟢 | **Cheap.** In review mode the overlay already holds the whole page's `comments` in memory (loaded on `enter()`). Proximity + `anchor.selector` match runs client-side with **no new fetch**. Advisory-only (never blocks) — trivial to honour. |
| 8 | Required "expected outcome" for layout/image | 🟢 | Clean add, conditional on Feature 1's `commentType`. New `expectedOutcome` field; validate client + server for `layout-tweak`/`image-swap`. Surface prominently on the Builder ticket detail as the manual success criteria. |
| 9 | "My active page" grouping | 🟢 | Pure view toggle over data already fetched. Builder queue in `dashboard.js` re-groups by `page.path` with counts. `groupBy=page` param optional (client can group what it already has). |
| 10 | Direct code-location hint | 🟡 | **~80% already there.** `cssPath()` (`overlay.js` L244) already builds a DOM path and **already prefers `data-cms` / `id` as component boundaries**, stored on `anchor.selector`. This feature is mostly *surface `anchor.selector` on the Builder detail as a copyable "Likely location", labelled best-effort*. Optional: also capture nearest `[data-component]` if the codebase adds such tags (it uses `data-cms` today). |
| 11 | Saved filters / views | 🟢 | New CRUD + a KV key. **Caveat: auth identifies the caller by *team key*, not per-user** — multiple people share one team key, so "saved views" are **per-team-key (shared)**, not per-person. Fine, but name it honestly in the UI. |
| 12 | Backend metrics | 🟢 | Aggregates over existing fields. **At 4,000-page scale, `readAll` scans every `page:` key on each call** — don't compute-on-read. Maintain a roll-up counter key updated on each state transition (or cache with TTL). Admin-only. UI can be minimal (endpoint is the deliverable). |

---

## 2. Cross-cutting costs the spec omits

These apply to *most* features and roughly double the surface of any backend-touching item. Budget for them explicitly.

1. **localStorage-demo parity.** The tool runs backend-less in demo mode (`LOCAL = !WORKER_URL`), and the code deliberately mirrors Worker behaviour into `localStorage` (e.g. the arrival-notif mirror at `overlay.js` L65–80). **Every feature that adds a record field or endpoint must also update the local `store`** or demo mode silently diverges. ~2× the client work on Features 1, 2, 3, 4, 6.
2. **AI-prompt regression risk.** `genPrompt` builds its facts from `comment` + `changeTo` + `anchor` only. If Features 1/8 add structured fields (`templateFields`, `expectedOutcome`, `commentType`) but **don't** thread them into `genPrompt`, the dev-ready prompt gets *worse* than the freeform baseline. Update `genPrompt`'s `facts` in lockstep with Feature 1.
3. **The change ripples across 4–5 files, not one.** A typical feature touches: `worker.js` (endpoint/field) · `overlay.js` (composer + local store) · `dashboard.js` (admin view) · `teamdash.js` (team view) · sometimes `config.js` / `tokens.css` / the standalone `core/*.html`. Plan per-file, not per-feature.
4. **VERSION + CHANGELOG per change (project rule).** Proofkit is a versioned portable package — bump `VERSION` + `package.json` + a precise `CHANGELOG.md` entry on each feature (note endpoints/fields/auth touched). README/INSTALL reconcile only at zip-export.
5. **Backward-compat on the record.** All new fields must default-when-missing (the store is full of v2.24 records). The Worker already follows this posture (`|| ''`, `|| []`) — keep it.
6. **CORS / bindings for Feature 4.** Worker CORS allows only `Content-Type, X-Review-Pass`; an R2 upload path + binding is net-new infra, not a code tweak.

---

## 3. Open decisions (resolve before building the affected feature)

**A. Feature 4 — screenshots: build now, defer, or thin version?** The spec itself says "confirm
before building, not to be silently assumed." Options: (1) **full** html2canvas → R2 + reference
URL; (2) **thin** — store only the `anchor.snippet` + a CSS-outline "where" indicator, no raster
(covers much of the "which element did they mean" pain at ~0 infra); (3) **defer** to a later
phase. Recommend **(3) defer**, or **(2)** if visual context is critical now — it's the only item
needing new infra and the only real fidelity risk.

**B. Feature 6 — replies model.** Existing `parentId` replies vs. the proposed lightweight
`threadReplies`. Recommend: **repurpose the existing reply thread as the "Quick questions" channel**
(make replies *not* mint a ticket / not change status — which is already true for status) and add a
`kind:'reply'` notification, rather than introducing a second parallel thread structure. One
mechanism, less surface.

**C. Scope of this pass.** All 12, or a first cut? Recommend a **Phase 1 = the creation-flow
cluster** (2,1,8,7,10,3) which delivers the biggest ticket-quality win on one shared refactor,
then decide on 4/5/6/9/11/12 with real usage feedback.

---

## 4. The plan — phased, resequenced

The spec's own build order is sound (2 → 1 → 8 → 4 → 10 → 7 → 3 → 6 → 5 → 9 → 11 → 12). I regroup
it into phases around the **shared comment-creation refactor**, because 1/2/4/7/8/10 all touch
`openComposer`/`send` and are far cheaper done together than retrofitted.

### Phase 0 — Foundations (do first, unblocks the rest)
- **0.1 Batch endpoint + draft tray (Feature 2).** Refactor `openComposer`/`send` into a
  draft-collection model with a "Pending pins (n)" tray; add `POST /comments` array support
  (per-item success/failure) + `batchId`; mirror into the local store. *This reshapes the exact
  function every other creation-flow feature edits — land it first.*
- **0.2 Overlay status rewire (prereq for Feature 5).** Point the overlay at `teamStatus`
  (retire the dead `open/resolved/closed` `status` reads). No visual change yet — just correct the
  field so Feature 5 is a pure paint.

### Phase 1 — Ticket quality (the core value)
- **1.1 Change-type templates (Feature 1)** — type selector → type-specific fields; store
  structured `templateFields` + a rendered plain-text summary; **update `genPrompt` facts**.
- **1.2 Expected-outcome field (Feature 8)** — conditional-required on `layout-tweak`/`image-swap`;
  validate client + server; surface on Builder detail. *(Depends on 1.1.)*
- **1.3 Duplicate-pin warning (Feature 7)** — client-side, advisory, selector-first + pixel
  fallback. *(Cheap once 0.1 exists.)*
- **1.4 Code-location hint (Feature 10)** — surface existing `anchor.selector` as a copyable
  "Likely location", labelled best-effort. *(Nearly free.)*
- **1.5 Reopen reason enum (Feature 3)** — free-text → enum + conditional note; badges in queues;
  enforce `other ⇒ note` both sides.

### Phase 2 — Workflow & visibility
- **2.1 Status colour-coding on pins (Feature 5)** — pure paint once 0.2 lands; 4-status token map.
- **2.2 Threaded quick-questions (Feature 6)** — per decision §3-B; `kind:'reply'` notif.
- **2.3 "Group by page" toggle (Feature 9)** — Builder queue clustering.

### Phase 3 — Persistence & insight (independent, do last)
- **3.1 Saved views (Feature 11)** — per-team-key CRUD + KV key; quick-select chips.
- **3.2 Metrics endpoint (Feature 12)** — roll-up counters updated on transition (not
  compute-on-read); minimal admin view.

### Phase 4 — Optional / gated
- **4.x Screenshots (Feature 4)** — only if §3-A resolves to "build"; R2 + reference URL + binding
  + CORS. Kept isolated so it never blocks the rest.

---

## 5. Per-feature build notes (data model · worker · client · demo · version)

Condensed checklists. "Client" = `overlay.js` composer + `dashboard.js` + `teamdash.js` as relevant.

- **F2 Batch** — *model:* client draft list + optional `batchId`. *worker:* `POST /comments`
  accepts `[]`, per-item result `{ok,error?}[]`. *client:* draft tray, edit/remove, "Submit all",
  retry-failed-only. *demo:* local `add` loops the array. *edge:* partial failure → per-item retry.
- **F1 Templates** — *model:* `commentType` enum + `templateFields` JSON + rendered `summary`.
  *worker:* accept + store both; **extend `genPrompt` facts**. *client:* type selector swaps fields;
  detail renders typed fields (never raw JSON); `general` unchanged. *demo:* mirror fields.
- **F8 Expected-outcome** — *model:* `expectedOutcome` (required iff `layout-tweak`/`image-swap`).
  *worker:* validate. *client:* block submit without it; show on Builder detail as success criteria.
- **F7 Duplicates** — *client-only:* on composer open, scan in-memory `comments` (open, same page)
  by `anchor.selector` then pixel proximity; non-blocking warning + link to existing ticket.
- **F10 Location hint** — *model:* reuse `anchor.selector` (optionally add `componentHint`).
  *client:* copyable "Likely location", best-effort label; guard long/generic paths.
- **F3 Reopen enum** — *model:* `reopenReason` enum + `reopenNote`. *worker:* validate
  `other ⇒ note`. *client:* reopen modal dropdown + conditional note; badge in queues + timeline.
- **F5 Pin colours** — *prereq:* 0.2. *client:* map `teamStatus` → {amber, blue, green, coral}
  on `.rv-pin`; reflect on next page load (live-update optional).
- **F6 Quick questions** — *model:* per §3-B. *worker:* reply endpoint(s) scoped to ticket id;
  `kind:'reply'` notif on the 5s debounce. *client:* "Quick questions" section distinct from Reopen.
- **F9 Group by page** — *worker:* optional `groupBy=page`. *client:* toggle; cluster + counts;
  toggle-off restores sort with no reload glitch.
- **F11 Saved views** — *model:* `savedViews:[{name,filters}]` per team key. *worker:* CRUD scoped
  to caller key. *client:* "Save current filters" + chips; persist across sessions.
- **F12 Metrics** — *worker:* admin-only aggregate endpoint over a date range (edits/page, volume
  by `commentType`, avg TBI→deployed, reopen rate, open-count trend); **roll-up, don't scan**.
  *client:* minimal table/charts.

Every item above also: **bump `VERSION` + `CHANGELOG.md`**, keep new fields **default-when-missing**,
and **mirror into the local demo store**.

---

## 6. Acceptance-criteria coverage

All spec acceptance criteria are honoured by the plan. Two are *strengthened*: **F5** gets an
explicit prereq (overlay must read `teamStatus`, else the criterion can't be met on Worker data);
**F1's** "no regression for `general`" is guaranteed by treating `general` as the untouched current
composer path. **F4's** "every comment has a screenshot unless capture failed" is only in scope if
decision §3-A is "build".
