/**
 * Proofkit — configuration & the single on/off switch.
 *
 * Proofkit is a self-contained, portable content-review tool (on-page
 * click-to-comment overlay + admin dashboard + Cloudflare Worker). This is the
 * ONE file to edit when turning it on/off or porting it to another project —
 * everything site-specific lives here so the rest of the package stays generic.
 * See ./README.md (what it is) and ./INSTALL.md (how to drop it into a project).
 */
import type { SEO } from '../../lib/seo';

/**
 * ⬅ THE SWITCH. Flip to `false` to remove Proofkit site-wide — the on-page
 * overlay stops loading on every page and the /review + /reviewdash routes render
 * an empty "not available" stub. One code change, whole tool gone.
 */
export const PROOFKIT_ENABLED = true;

/**
 * Cloudflare Worker base URL (the shared comment store). Empty string ⇒
 * localStorage demo mode (comments live only in the current browser, so the flow
 * is testable before the backend exists). Injected at build time from the
 * PUBLIC_REVIEW_WORKER_URL env var — see ./INSTALL.md.
 */
export const WORKER_URL: string = import.meta.env.PUBLIC_REVIEW_WORKER_URL || '';

/**
 * Review dashboard password - enforced on EVERY build (dev AND live) whenever the
 * tool runs without the Cloudflare Worker (WORKER_URL empty / static host). Stored
 * as a SHA-256 hash so the plaintext password never ships in the client bundle;
 * test an entry with `checkReviewPassword()`. Set to '' to accept anything.
 *
 * Current value = SHA-256("shriramreview").  (Regenerate with:
 *   echo -n 'yourpassword' | shasum -a 256)
 *
 * SECURITY: on a static (no-Worker) site this gate is still client-side - it keeps
 * unauthorized people out in practice, but a determined user can bypass client JS.
 * For a true server-side secret, deploy the Worker and `wrangler secret put ADMIN_PASS`
 * (same password); the Worker then enforces it and this value is unused.
 */
export const REVIEW_PASSWORD_SHA256 = 'ca4b109dda34bcd2a502f9d867adf0ff103ee39d411d8aa3c7380ebc70ad8d2f';

/** SHA-256 hex digest of a string (Web Crypto - available in browsers + Workers). */
export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** True when `input` is the review password (or when no password is configured). */
export async function checkReviewPassword(input: string): Promise<boolean> {
  if (!REVIEW_PASSWORD_SHA256) return true; // blank => open
  return (await sha256Hex(input)) === REVIEW_PASSWORD_SHA256;
}

/** Reviewer teams offered in the comment composer and the dashboard filters. */
export const TEAMS = ['Product', 'SEO', 'Marketing', 'Content'] as const;

/** Per-team chip colours as [background, text]. Keys must match TEAMS. */
export const TEAM_COLORS: Record<string, [string, string]> = {
  Product: ['#e7f0fb', '#1b5fa8'],
  SEO: ['#e7f7ee', '#1d7a46'],
  Marketing: ['#fdeee6', '#b5541f'],
  Content: ['#f1eafb', '#6b3fa0'],
};

/**
 * Host-page elements to hide while review mode is armed — e.g. a floating
 * back-to-top button that would otherwise overlap the Comment dock. Site-specific:
 * set to `[]` in a project that has nothing to hide.
 */
export const HIDE_SELECTORS: string[] = ['.to-top'];

/** SEO for the login route (/review) — noindex, it's an internal tool. */
export const loginSeo: SEO = {
  title: 'Content Review',
  description: 'Internal content-review sign in.',
  path: '/review',
  noindex: true,
};

/** SEO for the dashboard route (/reviewdash) — noindex. */
export const dashSeo: SEO = {
  title: 'Content Review Dashboard',
  description: 'Internal content-review dashboard.',
  path: '/reviewdash',
  noindex: true,
};
