# data/ — contained review snapshots

The collected review data lives in the Cloudflare KV namespace `COMMENTS`, not in
the repo. This folder is where you **contain** that data as a file so it survives
after Proofkit is unwired or the Worker/KV is torn down.

- **What goes here:** dated exports of the full comment set, e.g.
  `proofkit-comments-2026-07-14.json`, produced by the admin dashboard
  (`/reviewdash` → toolbar → **Copy ▸ Download JSON**, which dumps the complete
  `all` dataset). Optionally raw KV dumps (`kv-keys.json`, etc.).
- **When:** before removing Proofkit from the code, or at the end of any UAT round
  you want to preserve. See `../REMOVAL.md` → Step 1.
- **Why it's kept:** so the retained (dormant) `src/plugins/proofkit/` folder
  carries its own data with it — nothing reviewers captured is lost.

Snapshots are point-in-time; re-export whenever you need a fresher copy.
