/**
 * Proofkit — framework-neutral runtime core config.
 *
 * Plain browser ES module. NOTHING here imports Astro, Vite, or any framework —
 * this is the portable heart the on-page overlay + both dashboards share, whether
 * they run inside an Astro build (via the .astro adapters) or as the standalone
 * core/*.html entries dropped into any stack.
 *
 * The Astro-facing config lives one level up in ../config.ts, which re-exports
 * everything here and adds the build-time concerns (SEO objects, the env-driven
 * Worker URL, the site-wide enable switch). Edit THIS file for tool data +
 * theming; edit ../config.ts for how it wires into a host project.
 */

/* --------------------------------------------------------------------------
 * Master switch (standalone/runtime layer).
 * In an Astro host the REAL switch is PROOFKIT_ENABLED in ../config.ts — the page
 * shims gate rendering on it, so when it is false the core never loads at all.
 * This flag is the equivalent guard for the non-Astro standalone entries.
 * ------------------------------------------------------------------------ */
export const PROOFKIT_ENABLED = true;

/* --------------------------------------------------------------------------
 * Cloudflare Worker base URL (shared comment store). Empty ⇒ localStorage demo.
 * Read from a global the host sets BEFORE this module evaluates:
 *   - Astro adapters inline `window.PROOFKIT_WORKER_URL` from the env var.
 *   - Standalone html sets the same global in a <script> before core/*.js loads.
 * ------------------------------------------------------------------------ */
export const WORKER_URL =
  (typeof window !== 'undefined' && window.PROOFKIT_WORKER_URL) || '';

/* --------------------------------------------------------------------------
 * Review password (client-side gate for no-Worker hosts). SHA-256 hex of the
 * plaintext, so the password never ships. Current value = SHA-256("website").
 * With the Worker deployed this is unused (the Worker enforces ADMIN_PASS).
 * ------------------------------------------------------------------------ */
export const REVIEW_PASSWORD_SHA256 =
  '747a8f398395dde8e524d9f983784bd8441c5cfe4307b5a079be5412ee65c314';

/** SHA-256 hex digest (Web Crypto — browsers + Workers). */
export async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** True when `input` is the review password (or when none is configured). */
export async function checkReviewPassword(input) {
  if (!REVIEW_PASSWORD_SHA256) return true; // blank => open
  return (await sha256Hex(input)) === REVIEW_PASSWORD_SHA256;
}

/* --------------------------------------------------------------------------
 * Teams + chip colours.
 * ------------------------------------------------------------------------ */
export const TEAMS = ['Product', 'SEO', 'Marketing', 'Content'];

/** Login-only identity that maps to ADMIN; deliberately NOT in TEAMS. */
export const ADMIN_TEAM = 'Design';

/** Per-team chip colours as [background, text]. Keys must match TEAMS. */
export const TEAM_COLORS = {
  Product: ['#e7f0fb', '#1b5fa8'],
  SEO: ['#e7f7ee', '#1d7a46'],
  Marketing: ['#fdeee6', '#b5541f'],
  Content: ['#f1eafb', '#6b3fa0'],
};

/** Host-page elements to hide while review mode is armed. `[]` if nothing. */
export const HIDE_SELECTORS = ['.to-top'];

/* --------------------------------------------------------------------------
 * THEMING — --pk-* token skins + a runtime light/dark toggle.
 *
 * Each skin is a block of `--pk-*` custom properties. They used to inject once
 * under `:root{}` (baked, single skin). Now `themeCss()` emits every skin keyed
 * by `[data-pk-theme="…"]`, plus a `:root{}` default so first paint (before JS)
 * is already themed. Swapping the attribute on <html> re-skins live, and the
 * choice persists in localStorage — that is the whole light-mode toggle.
 * ------------------------------------------------------------------------ */
export const THEMES = {
  'red-moon':
    '--pk-canvas:#181818;--pk-card:#1e1e1e;--pk-elev:#242424;--pk-input:#141414;' +
    '--pk-red:#da291c;--pk-red-2:#b01e0a;--pk-ink:#ffffff;--pk-body:#a7a7a7;' +
    '--pk-muted:#7d7d7d;--pk-hair:#333333;--pk-amber:#f5a623;--pk-green:#3ddc84;--pk-softred:#ef5b50',
  'dark-cream':
    '--pk-canvas:#1a1712;--pk-card:#221d16;--pk-elev:#2a241c;--pk-input:#15120d;' +
    '--pk-red:#c9a24b;--pk-red-2:#a8843a;--pk-ink:#f5efe2;--pk-body:#b8ad97;' +
    '--pk-muted:#8a8069;--pk-hair:#3a3226;--pk-amber:#e0b45a;--pk-green:#7fb58a;--pk-softred:#d98a6a',
  /* Light skin — warm off-white surfaces, brand red kept, status colours
     darkened so they stay legible on light. Mirrors the token contract 1:1. */
  light:
    '--pk-canvas:#f2f1ec;--pk-card:#ffffff;--pk-elev:#f8f7f3;--pk-input:#ffffff;' +
    '--pk-red:#c81e12;--pk-red-2:#a5170c;--pk-ink:#1c1c1a;--pk-body:#565650;' +
    '--pk-muted:#8c8c84;--pk-hair:#e4e1d9;--pk-amber:#a86a12;--pk-green:#1d7a46;--pk-softred:#c0392b',
};

/** The default (dark) skin and the light skin the toggle flips to. */
export const DEFAULT_THEME = 'red-moon';
export const LIGHT_THEME = 'light';
const THEME_KEY = 'pkTheme';              // localStorage cache — instant, no-flash first paint
const ADMIN_PASS_KEY = 'reviewAdminPass'; // where the admin dashboard keeps its pass (to write the global theme)

/** Default skin's tokens as a bare declaration list (no selector) — used by the
 *  overlay, which stays on its dark skin regardless of the dashboard toggle. */
export const themeVars = THEMES[DEFAULT_THEME];

/** Every skin as selector-keyed CSS, `:root` defaulting to the dark skin. */
export function themeCss() {
  let css = ':root{' + THEMES[DEFAULT_THEME] + '}';
  for (const name in THEMES) css += '[data-pk-theme="' + name + '"]{' + THEMES[name] + '}';
  return css;
}

/* The theme is a GLOBAL setting the admin controls — flipping it changes the mode
 * for everyone, so the source of truth is the Worker (KV `settings.theme`), not this
 * browser. localStorage is only a same-browser cache for instant no-flash paint and
 * the no-Worker demo fallback. Read path: everyone GETs /settings. Write path: only
 * the admin POSTs /settings (Worker enforces admin). */

/** Last-known theme from the local cache (fast, synchronous; falls back to dark). */
export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; }
  catch { return DEFAULT_THEME; }
}

/** Apply a skin to THIS browser only: set the attribute, cache it, notify toggles. */
export function applyTheme(name) {
  document.documentElement.setAttribute('data-pk-theme', name);
  try { localStorage.setItem(THEME_KEY, name); } catch {}
  document.dispatchEvent(new CustomEvent('pk:themechange', { detail: { theme: name } }));
}

/** Admin action: set the GLOBAL theme — apply locally, then persist to the Worker
 *  (KV) so every other user picks it up. In demo mode (no Worker) it stays local. */
export async function setGlobalTheme(name) {
  applyTheme(name);
  if (!WORKER_URL) return;
  try {
    const pass = sessionStorage.getItem(ADMIN_PASS_KEY) || '';
    await fetch(WORKER_URL + '/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Pass': pass },
      body: JSON.stringify({ theme: name }),
    });
  } catch {}
}

/** Pull the global theme from the Worker and apply it (falls back to the cache). */
export async function syncTheme() {
  if (!WORKER_URL) { document.documentElement.setAttribute('data-pk-theme', getTheme()); return getTheme(); }
  try {
    const r = await fetch(WORKER_URL + '/settings', { headers: { 'Content-Type': 'application/json' } });
    if (r.ok) { const j = await r.json(); const t = (j && j.theme) || getTheme(); applyTheme(t); return t; }
  } catch {}
  document.documentElement.setAttribute('data-pk-theme', getTheme());
  return getTheme();
}

/** Admin toggle: flip the GLOBAL theme between the light skin and the dark default. */
export function toggleTheme() {
  setGlobalTheme(getTheme() === LIGHT_THEME ? DEFAULT_THEME : LIGHT_THEME);
}

/** Apply the cached theme instantly (no flash), then reconcile with the global one
 *  and keep it in sync whenever the tab regains focus (picks up another admin's flip). */
export function initTheme() {
  document.documentElement.setAttribute('data-pk-theme', getTheme()); // instant
  syncTheme();                                                        // reconcile with the Worker
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTheme(); });
  return getTheme();
}

/** Inject the keyed theme CSS once (id-guarded so it is safe to call per app). */
export function injectThemeStyle(id) {
  id = id || 'pk-theme-vars';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = themeCss();
  document.head.appendChild(el);
}

/* --------------------------------------------------------------------------
 * The creative light/dark toggle — a subtle sun⇄moon slider that lives under the
 * dashboard logo. Self-contained: injects its own scoped styles once, builds the
 * control, wires it to toggleTheme(), and stays in sync with the persisted state
 * (including changes made on another surface). Themes itself via --pk-* tokens.
 * ------------------------------------------------------------------------ */
const TOGGLE_CSS =
  '.pk-tt{--tt-w:52px;--tt-h:26px;position:relative;display:inline-flex;align-items:center;justify-content:center;' +
  'width:48px;height:48px;margin:-11px -11px -11px -1px;padding:0;border:0;background:none;cursor:pointer;' +
  '-webkit-tap-highlight-color:transparent}' +
  '.pk-tt-track{position:relative;width:var(--tt-w);height:var(--tt-h);border-radius:999px;' +
  'background:var(--pk-input);border:1px solid var(--pk-hair);' +
  'box-shadow:inset 0 1px 2px rgba(0,0,0,.28);transition:background .45s cubic-bezier(.4,0,.2,1),border-color .3s}' +
  '.pk-tt-thumb{position:absolute;top:50%;left:3px;width:20px;height:20px;border-radius:50%;' +
  'transform:translate(0,-50%);display:flex;align-items:center;justify-content:center;color:#fff;' +
  'background:var(--pk-red);box-shadow:0 1px 4px rgba(0,0,0,.4);' +
  'transition:transform .45s cubic-bezier(.34,1.56,.64,1),background .3s}' +
  '.pk-tt-thumb svg{width:12px;height:12px;display:block}' + // one glyph, centred inside the thumb
  '.pk-tt[aria-checked="true"] .pk-tt-thumb{transform:translate(calc(var(--tt-w) - 26px),-50%);background:var(--pk-amber)}' +
  '.pk-tt:focus-visible{outline:2px solid var(--pk-red);outline-offset:2px;border-radius:8px}' +
  '@media (min-width:1024px) and (hover:hover){.pk-tt:hover .pk-tt-track{border-color:var(--pk-body)}}';

/** Build one toggle control (a wired DOM node). aria-checked === light mode. */
export function buildThemeToggle() {
  if (!document.getElementById('pk-tt-style')) {
    const s = document.createElement('style');
    s.id = 'pk-tt-style';
    s.textContent = TOGGLE_CSS;
    document.head.appendChild(s);
  }
  const btn = document.createElement('button');
  btn.className = 'pk-tt';
  btn.type = 'button';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-label', 'Toggle light and dark theme');
  btn.innerHTML =
    '<span class="pk-tt-track"><span class="pk-tt-thumb">' +
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>' +
    '</span></span>';
  const sync = () => {
    const light = getTheme() === LIGHT_THEME;
    btn.setAttribute('aria-checked', String(light));
    btn.title = light ? 'Light mode — switch to dark' : 'Dark mode — switch to light';
  };
  btn.addEventListener('click', toggleTheme);
  document.addEventListener('pk:themechange', sync);
  sync();
  return btn;
}

/** Fill every `[data-pk-toggle]` slot on the page with a toggle control. */
export function mountThemeToggle(selector) {
  const slots = document.querySelectorAll(selector || '[data-pk-toggle]');
  slots.forEach((slot) => { if (!slot.firstChild) slot.appendChild(buildThemeToggle()); });
}

/* --------------------------------------------------------------------------
 * Friendly page names (dashboard link text). Project-configurable.
 * ------------------------------------------------------------------------ */
export const PAGE_NAMES = {
  '/': 'Homepage',
  '/about-us': 'About Us',
  '/open-demat-account': 'Open a Demat Account',
  '/become-a-partner': 'Become a Partner',
  '/karnataka-bank-customers': 'Karnataka Bank Customers',
  '/antara': 'Antara',
  '/sitemap': 'Sitemap',
  '/products': 'Product Suite',
  '/equity': 'Equity',
  '/derivatives': 'Derivatives',
  '/mtf': 'MTF',
  '/commodities': 'Commodities',
  '/currency': 'Currency',
  '/mutual-funds': 'Mutual Funds',
  '/etf': 'ETFs',
  '/ipo': 'IPO',
  '/nfo': 'NFO',
  '/nps': 'NPS',
  '/bonds': 'Bonds',
  '/fixed-deposit': 'Fixed Deposit',
  '/loan-against-mutual-fund': 'Loan Against Mutual Funds',
  '/loan-against-shares': 'Loan Against Securities',
  '/global-investing': 'Global Investing',
  '/research-hub': 'Research Centre',
  '/technical-analysis': 'Technical Research',
  '/fundamental-analysis': 'Fundamental Research',
  '/mutual-fund-analysis': 'Mutual Fund Research',
  '/calculators': 'Calculators',
  '/sip-calculator': 'SIP Calculator',
  '/lumpsum-calculator': 'Lumpsum Calculator',
  '/swp-calculator': 'SWP Calculator',
  '/nps-calculator': 'NPS Calculator',
  '/fd-calculator': 'FD Calculator',
  '/contact-us': 'Contact Us',
  '/grievance-redressal': 'Grievance Redressal',
  '/privacy-policy': 'Privacy Policy',
  '/terms-and-conditions': 'Terms & Conditions',
  '/terms-of-use-purse': 'Terms of Use – Purse',
  '/regulatorydocuments': 'Regulatory Documents',
  '/regulatorydocuments/investor-charter': 'Investor Charter',
  '/regulatorydocuments/mandatory-member-details': 'Mandatory Member Details',
  '/designsystem': 'Design System',
  '/designsystem/current': 'Design System – Current',
  '/designsystem/proposed': 'Design System – Proposed',
};

/** Friendly name for a page path (PAGE_NAMES, else a title-cased slug fallback). */
export function pageName(path) {
  const p = (path || '/').replace(/\/+$/, '') || '/';
  if (PAGE_NAMES[p]) return PAGE_NAMES[p];
  const seg = p.split('/').filter(Boolean).pop() || 'home';
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
