  import { TEAMS, TEAM_COLORS, WORKER_URL, PROOFKIT_ENABLED, checkReviewPassword, pageName,
    ADMIN_TEAM, buildPanelLogin, buildDropdown, getSession, setSession, clearSession,
    initTheme, mountThemeToggle, ensureDemoReset, isTeamEnabled } from './config.js';
  (() => {
    if (!PROOFKIT_ENABLED) return; // master switch (./config.ts)
    // Theme skins come from design/tokens.css (linked by the adapter); apply the
    // global choice and mount the admin toggle.
    initTheme(); mountThemeToggle();
    const LOCAL = !WORKER_URL;
    // Whether a team is active in this phase (config.js owns the list). Defensive: if the
    // export is missing/throws, fall back to "enabled" so navigation never hard-breaks.
    const teamEnabled = (t) => { try { return typeof isTeamEnabled === 'function' ? !!isTeamEnabled(t) : true; } catch { return true; } };

    async function apiFetch(path, opts = {}) {
      const headers = { 'Content-Type': 'application/json' };
      const pass = getSession().key; // the one shared session key
      if (pass) headers['X-Review-Pass'] = pass;
      const res = await fetch(WORKER_URL + path, { ...opts, headers });
      if (res.status === 401) { clearSession(); throw new Error('unauthorized'); }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }
    function localAll() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('rvc3:')) { try { out.push(...JSON.parse(localStorage.getItem(k) || '[]')); } catch {} }
      }
      out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return out;
    }
    const NOTIF_KEY = 'rvc3-notifications'; // local mirror of the Worker's notifications store
    const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'n_' + Date.now() + '_' + Math.random().toString(16).slice(2));

    // ---- Builder status state machine (mirror of the Worker's POST /team-status action) ----
    // Locate the root by id within its rvc3:<path> bucket, apply the transition, stamp
    // history + iteration, and (on complete/reopen) drop a status notification to the
    // raising team (Content). Returns the mutated record. Contract transitions:
    //   start    : to_be_initiated -> in_progress
    //   complete : in_progress     -> deployed_live (terminal for that iteration)
    //   reopen   : in_progress|deployed_live -> reopened (requires a reason)
    const TEAM_NEXT = {
      start: { from: ['to_be_initiated'], to: 'in_progress' },
      complete: { from: ['in_progress'], to: 'deployed_live' },
      reopen: { from: ['in_progress', 'deployed_live'], to: 'reopened' },
    };
    function localTeamAction(rec, action, reason) {
      const key = 'rvc3:' + rec.page.path;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const r = arr.find((x) => x.id === rec.id);
      if (!r) return { ...rec };
      const cur = r.teamStatus || 'to_be_initiated';
      const step = TEAM_NEXT[action];
      if (!step || step.from.indexOf(cur) === -1) return { ...r }; // invalid transition → no-op
      const now = new Date().toISOString();
      r.iteration = r.iteration || 1;
      r.teamStatus = step.to; r.teamStatusAt = now;
      if (!Array.isArray(r.history)) r.history = [];
      const h = { status: step.to, at: now, event: 'team-' + action, iteration: r.iteration };
      if (action === 'reopen') { h.reason = reason || ''; r.reopenReason = reason || ''; }
      r.history.push(h);
      localStorage.setItem(key, JSON.stringify(arr));
      if (action === 'complete' || action === 'reopen') {
        const n = localStatusNotif(r, step.to, action === 'reopen' ? reason : '');
        if (n) { let ex = []; try { ex = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch {}
          ex.push(n); localStorage.setItem(NOTIF_KEY, JSON.stringify(ex)); }
      }
      return { ...r };
    }
    // A status notification to the RAISING team when Builder deploys live or reopens.
    function localStatusNotif(r, next, reason) {
      const where = (r.page && r.page.title) || (r.page && r.page.path) || 'a page';
      const tick = r.ticket ? '#' + r.ticket + ' ' : '';
      const summary = next === 'reopened'
        ? 'Builder reopened ' + tick + 'on ' + where + (reason ? ': ' + reason : '') + '.'
        : tick + 'on ' + where + ' was deployed live.';
      return {
        id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        team: r.team || '', kind: 'status', chainId: r.parentId || r.id, commentId: r.id,
        ticket: r.ticket || '', teamStatus: next, iteration: r.iteration || 1, reason: reason || '',
        fromTeam: r.toTeam || '', path: (r.page && r.page.path) || '/', pageName: where,
        summary, readTeam: false, readAdmin: false,
      };
    }
    function localNotifs() {
      let arr = []; try { arr = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch {}
      arr.sort((a, b) => ((a.updatedAt || a.createdAt) < (b.updatedAt || b.createdAt) ? 1 : -1));
      return arr;
    }
    function localMarkRead(ids, read = true) {
      let arr = []; try { arr = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return { ok: true, updated: 0 }; }
      let updated = 0;
      for (const n of arr) { if (ids.includes(n.id) && n.readAdmin !== read) { n.readAdmin = read; updated++; } }
      if (updated) localStorage.setItem(NOTIF_KEY, JSON.stringify(arr));
      return { ok: true, updated };
    }
    function localDelete(rec) {
      const key = 'rvc3:' + rec.page.path;
      let arr = JSON.parse(localStorage.getItem(key) || '[]');
      // remove the whole chain: the record, its replies, and its resubmit sub-tickets
      const rootId = rec.parentId || rec.id;
      arr = arr.filter((r) => r.id !== rootId && r.parentId !== rootId);
      localStorage.setItem(key, JSON.stringify(arr));
    }
    // Re-route: set the raising team (From) and/or directed team (To) on a record.
    function localSetTeams(rec, team, toTeam) {
      const key = 'rvc3:' + rec.page.path;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const r = arr.find((x) => x.id === rec.id);
      if (!r) return { ...rec, team, toTeam };
      if (team !== undefined) r.team = team;
      if (toTeam !== undefined) r.toTeam = toTeam;
      localStorage.setItem(key, JSON.stringify(arr));
      return { ...r };
    }
    // No-Worker gate: check the session password against the configured review password.
    const localGuard = async () => {
      if (!(await checkReviewPassword(getSession().key || ''))) throw new Error('unauthorized');
    };
    const store = LOCAL
      ? {
          all: async () => { await localGuard(); return localAll(); },
          // Builder drives the status machine: start | complete | reopen(reason).
          teamAction: async (rec, action, reason) => { await localGuard(); return localTeamAction(rec, action, reason); },
          notifications: async () => { await localGuard(); return localNotifs(); },
          markRead: async (ids, read = true) => { await localGuard(); return localMarkRead(ids, read); },
          del: async (rec) => { await localGuard(); localDelete(rec); return { ok: true }; },
          setTeams: async (rec, team, toTeam) => { await localGuard(); return localSetTeams(rec, team, toTeam); },
        }
      : {
          all: () => apiFetch('/comments'),
          // Contract body: { id, action:'start'|'complete'|'reopen', reason? }. No `path`.
          teamAction: (rec, action, reason) => apiFetch('/team-status', { method: 'POST', body: JSON.stringify({ id: rec.id, action, reason }) }),
          notifications: () => apiFetch('/notifications'),
          markRead: (ids, read = true) => apiFetch('/notifications/read', { method: 'POST', body: JSON.stringify({ ids, read }) }),
          del: (rec) => apiFetch('/delete', { method: 'POST', body: JSON.stringify({ id: rec.parentId || rec.id, path: rec.page.path }) }),
          setTeams: (rec, team, toTeam) => apiFetch('/teams', { method: 'POST', body: JSON.stringify({ id: rec.id, path: rec.page.path, team, toTeam }) }),
        };

    let login = null, refreshTimer = null;

    async function loadData() {
      all = await store.all();
      try { notifs = await store.notifications(); } catch (e) { notifs = notifs || []; }
      // Polling runs every ~5s; skip the whole re-render when the data is byte-identical to
      // what's already on screen — stops the entry animation replaying (and the DOM churn /
      // scroll jump) on every idle poll. Only repaint when something actually changed.
      const sig = dataSig();
      if (seenMarked && sig === lastSig) return;
      lastSig = sig;
      counts(); render();
      if (!seenMarked) { seenMarked = true; try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch (e) {} }
    }

    // Poll on the shared ~5s debounced cadence (the Worker coalesces server-side).
    function startAutoRefresh() {
      if (refreshTimer) return;
      refreshTimer = setInterval(() => { if (!document.hidden) loadData().catch(() => {}); }, 5000);
      window.addEventListener('focus', () => loadData().catch(() => {}));
    }

    function showLogin() {
      if (!login) {
        login = buildPanelLogin({ title: 'Panel Login', sub: 'Enter your key to continue.' });
        const go = () => tryLogin();
        login.button.addEventListener('click', go);
        login.keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      }
      login.setError(''); login.keyInput.value = '';
      let prefill = '';
      try { if ((new URLSearchParams(location.search).get('login') || '').toLowerCase() === ADMIN_TEAM.toLowerCase()) prefill = ADMIN_TEAM; } catch {}
      login.setTeam(prefill);
      document.body.appendChild(login.el);
      if (prefill) login.keyInput.focus(); else login.focusTeam();
    }
    function hideLogin() { login && login.el.remove(); }

    // Reveal the gated-off stub and hide the app shell (init calls this when a
    // signed-in identity is parked off via TEAM_ENABLED). CSS keys `display` off
    // `:not([hidden])`, so toggling `hidden` is all that's needed.
    function showBlocked() {
      const b = $('#rvd-blocked'); const app = $('.rvd-app');
      if (b) b.hidden = false;
      if (app) app.hidden = true;
    }

    async function tryLogin() {
      const team = login.getTeam();
      const key = login.keyInput.value.trim();
      if (!team) { login.focusTeam(); login.setError('Please choose your team.'); return; }
      if (!key) { login.keyInput.focus(); return; }
      setSession(team, key);
      login.setBusy(true, 'Authenticating'); login.setError('');
      if (team !== ADMIN_TEAM) { location.replace('/teamdash3'); return; }
      try { await loadData(); hideLogin(); startAutoRefresh(); }
      catch (e) {
        clearSession();
        login.setBusy(false, 'Authenticate');
        login.setError(e.message === 'unauthorized' ? 'Incorrect key. Please try again.' : ('Could not connect — ' + e.message));
        login.keyInput.focus(); login.keyInput.select();
      }
    }

    function init() {
      if (LOCAL) ensureDemoReset();
      buildQueueTabs();   // rebuild the tab bar for the Phase-1 Team Queue
      relabelNav();       // "Team Queue" + retire the Delivery nav
      const s = getSession();
      if (s.key && s.team && s.team !== ADMIN_TEAM) { location.replace('/teamdash3'); return; }
      // Defence-in-depth: a signed-in identity parked off via TEAM_ENABLED gets the
      // "no access" stub, not the app. Builder/ADMIN_TEAM is always enabled, so this
      // is belt-and-braces rather than a path hit in normal operation.
      if (s.key && s.team && !isTeamEnabled(s.team)) { showBlocked(); return; }
      if (s.key && s.team === ADMIN_TEAM) {
        loadData().then(startAutoRefresh).catch((e) => {
          if (e.message === 'unauthorized') { clearSession(); showLogin(); }
          else { $('#rvd-empty').hidden = false; $('#rvd-empty').textContent = 'Could not load — ' + e.message; }
        });
      } else showLogin();
    }

    // Rebuild the Team Queue tab bar (the shell markup carries the retired lifecycle tabs).
    function buildQueueTabs() {
      const el = $('#rvd-tabs'); if (!el) return;
      el.innerHTML =
        `<button class="rvd-tab is-active" data-tab="all">All</button>` +
        `<button class="rvd-tab" data-tab="page">By Page</button>`;
      tab = 'all';
    }
    // Relabel Overview→Team Queue and retire the Delivery (deploy-gate) nav item.
    function relabelNav() {
      const nav = (v) => document.querySelector('.rvd-nav[data-view="' + v + '"]');
      const dash = nav('dash'); if (dash) dash.textContent = 'Team Queue';
      const dep = nav('deploy'); if (dep) dep.hidden = true;
    }

    const $ = (s) => document.querySelector(s);
    const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
    const mix = (a, b, t) => {
      const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
      const ch = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
      return '#' + ch(ar, br) + ch(ag, bg) + ch(ab, bb);
    };
    const isLight = () => document.documentElement.getAttribute('data-pk-theme') === 'light';
    const tokenHex = (name, fb) => { try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb; } catch { return fb; } };
    const teamStyle = (team) => {
      const tc = TEAM_COLORS[team] || ['#e8e8e8', '#888'];
      const white = tokenHex('--pk-on-accent', '#ffffff');
      if (isLight()) return { bg: tc[0], fg: tc[1], bd: mix(tc[1], white, 0.62) };
      const canvas = tokenHex('--pk-canvas', '#181818');
      const accent = tc[1];
      return { bg: mix(accent, canvas, 0.82), fg: mix(accent, white, 0.55), bd: mix(accent, canvas, 0.5) };
    };
    const teamChip = (team) => {
      if (!team) return '';
      const s = teamStyle(team);
      return `<span class="rvd-team-chip" style="background:${s.bg};color:${s.fg};border:1px solid ${s.bd}">${esc(team)}</span>`;
    };
    const routeChips = (c) => {
      const from = teamChip(c.team);
      if (!c.toTeam) return from;
      return `${from || '<span class="rvd-team-chip rvd-team-none">—</span>'}` +
        `<span class="rvd-route-arrow" aria-label="directed to">→</span>${teamChip(c.toTeam)}`;
    };

    // ---- real-time status (Builder framing) ----
    const TEAM_STATUS = {
      to_be_initiated: ['tbi', 'TBI'],
      in_progress: ['inprog', 'In Progress'],
      deployed_live: ['deployed', 'Deployed live'],
      reopened: ['reopened', 'Reopened'],
    };
    const teamStatusOf = (c) => (TEAM_STATUS[c && c.teamStatus] ? c.teamStatus : 'to_be_initiated');
    const statusLabel = (c) => TEAM_STATUS[teamStatusOf(c)][1];
    const displayState = (c) => TEAM_STATUS[teamStatusOf(c)][0];
    const statusChip = (c) => { const [cls, label] = TEAM_STATUS[teamStatusOf(c)]; return `<span class="rvd-chip ${cls}">${label}</span>`; };
    // Builder's Team Queue = every ticket currently directed at Builder in a non-terminal
    // iteration state (to_be_initiated | in_progress). deployed_live is terminal; reopened
    // has bounced back to the raiser (Content).
    const inQueue = (c) => { const s = teamStatusOf(c); return s === 'to_be_initiated' || s === 'in_progress'; };

    // ---- ticket-chain (iteration) model ----
    // A resubmit sub-ticket AND a comment reply both carry parentId → the origin root id;
    // they are told apart by iteration (reply = iteration 1; sub-ticket = iteration ≥ 2).
    // The LIVE record of a chain is the highest-iteration member (its teamStatus is "now").
    const isReply = (c) => !!c.parentId && (c.iteration || 1) < 2;
    const chainOf = (c) => c.parentId || c.id;

    let all = [], notifs = [], tab = 'all', teamFilter = '', entryDetail = null, view = 'dash', search = '', sort = 'new';
    const sel = new Set();
    let selectMode = false;
    let lastSig = '';   // signature of the last-rendered data — lets polling skip no-op re-renders
    const dataSig = () => JSON.stringify([all, notifs]);

    // ---- unread: chains touched since the last dashboard visit ----
    const SEEN_KEY = 'reviewLastSeen';
    const seenAt = localStorage.getItem(SEEN_KEY) || '';
    let seenMarked = false;
    const isNew = (c) => !!seenAt && (c.teamStatusAt || c.createdAt) > seenAt;

    // ---- search / sort ----
    function matchesSearch(c) {
      if (!search) return true;
      const a = c.anchor || {};
      return [c.comment, c.changeTo, c.page && c.page.path, c.name, c.team, c.toTeam, c.reopenReason, a.snippet, a.tag]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    }
    function sortRoots(rs) {
      const s = rs.slice();
      if (sort === 'old') s.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      else if (sort === 'page') s.sort((a, b) => a.page.path.localeCompare(b.page.path) || (a.createdAt < b.createdAt ? 1 : -1));
      else s.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return s;
    }
    // Team Queue roots for the current view (tab + team + search + sort).
    function currentRoots() {
      let rs = roots().filter(inQueue);
      if (teamFilter) rs = rs.filter((c) => c.team === teamFilter);
      return sortRoots(rs.filter(matchesSearch));
    }

    // ---- AI prompt text ----
    function localPrompt(c) {
      if (c.aiPrompt) return c.aiPrompt;
      const a = c.anchor || {};
      const where = a.snippet ? `the “${a.snippet}” ${a.tag || 'element'}` : (a.tag || 'the element');
      let s = `On page ${c.page.path}, in ${where}: ${c.comment}`;
      if (c.changeTo) s += `\nChange the content to exactly (preserve casing/punctuation): “${c.changeTo}”`;
      return s;
    }
    const promptsText = (list) => list.map((c) => '- ' + localPrompt(c).replace(/\n/g, '\n  ')).join('\n');
    async function copyToClip(text, btn, okLabel) {
      try {
        await navigator.clipboard.writeText(text);
        if (btn) { const t = btn.textContent; btn.textContent = okLabel || 'Copied ✓'; setTimeout(() => { btn.textContent = t; }, 1400); }
      } catch (e) { alert('Copy failed — ' + e.message); }
    }
    function mdExport(list) {
      const lines = ['# Content review — ' + list.length + ' change' + (list.length === 1 ? '' : 's'), ''];
      list.forEach((c) => {
        const a = c.anchor || {};
        lines.push(`- **${c.page.path}** — ${c.team || '—'} → ${c.toTeam || '—'} · ${statusLabel(c)}`);
        lines.push(`  - ${c.comment}${a.snippet ? ` _(on “${a.snippet}”)_` : ''}`);
        if (c.changeTo) lines.push(`  - Change to: “${c.changeTo}”`);
      });
      return lines.join('\n');
    }
    function downloadJSON() {
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement('a'); aEl.href = url; aEl.download = 'proofkit-comments.json';
      document.body.appendChild(aEl); aEl.click(); aEl.remove(); URL.revokeObjectURL(url);
    }

    function buildTeamChips() {
      const one = (label, team) => {
        const active = teamFilter === team;
        let style;
        if (active && team) { const accent = (TEAM_COLORS[team] || [])[1] || 'var(--pk-red)'; style = `background:${accent};color:var(--pk-on-accent);border-color:${accent}`; }
        else if (active) style = 'background:var(--pk-red);color:var(--pk-on-accent);border-color:var(--pk-red)';
        else if (team) { const s = teamStyle(team); style = `background:${s.bg};color:${s.fg};border-color:${s.bd}`; }
        else style = 'background:var(--pk-elev);color:var(--pk-body);border-color:var(--pk-hair)';
        return `<button class="rvd-tchip${active ? ' is-active' : ''}" data-team="${esc(team)}" style="${style}">${esc(label)}</button>`;
      };
      const host = $('#rvd-teamchips'); if (!host) return;
      host.innerHTML = '<span class="rvd-chips-from">From</span>' + one('All Teams', '') + TEAMS.map((t) => one(t, t)).join('');
      host.querySelectorAll('.rvd-tchip').forEach((b) => {
        b.addEventListener('click', () => { teamFilter = b.dataset.team; buildTeamChips(); render(); });
      });
    }

    document.addEventListener('pk:themechange', () => {
      try { buildTeamChips(); if (typeof counts === 'function') counts(); render(); } catch (e) {}
    });

    // ---- ticket-chain helpers (the LIVE record per family + timeline) ----
    function families() {
      const byChain = new Map();
      for (const c of all) {
        if (isReply(c)) continue;
        const cid = chainOf(c);
        const prev = byChain.get(cid);
        if (!prev || (c.iteration || 1) > (prev.iteration || 1)) byChain.set(cid, c);
      }
      return [...byChain.values()];
    }
    const roots = () => families();
    const repliesOf = (rec) => all.filter((c) => isReply(c) && chainOf(c) === chainOf(rec)).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    function chainMembers(rec) {
      const cid = chainOf(rec);
      return all.filter((c) => !isReply(c) && chainOf(c) === cid)
        .sort((a, b) => (a.iteration || 1) - (b.iteration || 1) || (a.createdAt < b.createdAt ? -1 : 1));
    }
    function chainHistory(rec) {
      const evs = [];
      for (const m of chainMembers(rec)) {
        (Array.isArray(m.history) ? m.history : []).forEach((h) => evs.push({ ...h, iteration: h.iteration || m.iteration || 1 }));
      }
      if (!evs.length) evs.push({ at: rec.createdAt, event: 'created', iteration: rec.iteration || 1 });
      return evs.sort((a, b) => (a.at < b.at ? -1 : 1));
    }
    function eventLabel(h) {
      const e = h.event || '', st = h.status || '';
      if (e === 'created') return 'Raised (TBI)';
      if (e === 'resubmitted' || e === 'resubmit') return 'Resubmitted (TBI)';
      if (e === 'team-start' || e === 'start' || st === 'in_progress') return 'Started — in progress';
      if (e === 'team-complete' || e === 'complete' || st === 'deployed_live') return 'Deployed live';
      if (e === 'team-reopen' || e === 'reopen' || st === 'reopened') return 'Reopened' + (h.reason ? ' — ' + h.reason : '');
      return 'Status → ' + (st || '');
    }

    function counts() {
      const rs = roots();
      const tbi = rs.filter((c) => teamStatusOf(c) === 'to_be_initiated').length;
      const prog = rs.filter((c) => teamStatusOf(c) === 'in_progress').length;
      const live = rs.filter((c) => teamStatusOf(c) === 'deployed_live').length;
      const reop = rs.filter((c) => teamStatusOf(c) === 'reopened').length;
      $('#rvd-counts').innerHTML =
        `<span class="rvd-count"><b>${tbi}</b> TBI</span>` +
        `<span class="rvd-count"><b>${prog}</b> In Progress</span>` +
        `<span class="rvd-count"><b>${live}</b> Deployed live</span>` +
        `<span class="rvd-count"><b>${reop}</b> Reopened</span>`;
      updateBadges();
    }
    function updateBadges() {
      const unread = (notifs || []).filter((n) => n.readAdmin === false).length;
      const nd = $('#rvd-badge-notifs'); if (nd) { nd.textContent = unread; nd.hidden = !unread; }
    }

    function routeRow(root) {
      const chip = (t) => t ? teamChip(t) : `<span class="rvd-team-chip rvd-team-none">—</span>`;
      return `<div class="rvd-route">` + chip(root.team) +
        `<span class="rvd-route-arrow" aria-hidden="true">→</span>` + chip(root.toTeam) + `</div>`;
    }

    function card(root) {
      const a = root.anchor || {};
      const id = esc(root.id);
      const iter = root.iteration || 1;
      const replies = repliesOf(root);
      const repliesToggle = replies.length
        ? `<button class="rvd-repliestoggle" type="button" data-replies="${id}">` +
            `<span class="rvd-caret">▸</span>${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}</button>`
        : '';
      const repliesBlock = replies.length
        ? `<div class="rvd-replies" data-replies-for="${id}" hidden>` + replies.map((r) =>
            `<div class="rvd-reply">${teamChip(r.team)}<div class="rvd-rtxt">${esc(r.comment)}</div>` +
            (r.changeTo ? `<div class="rvd-change"><span>Change to</span><div>${esc(r.changeTo)}</div></div>` : '') +
            `<div class="rvd-rmeta">${esc(fmt(r.createdAt))}</div></div>`).join('') + `</div>`
        : '';
      const selected = sel.has(root.id);
      return (
        `<article class="rvd-item${selectMode && selected ? ' is-selected' : ''}" data-state="${displayState(root)}">` +
          `<div class="rvd-card-top">` +
            (selectMode ? `<input type="checkbox" class="rvd-sel" data-id="${id}"${selected ? ' checked' : ''} aria-label="Select">` : '') +
            (isNew(root) ? `<span class="rvd-chip rvd-new">New</span>` : '') +
            statusChip(root) +
            (iter > 1 ? `<span class="rvd-iter">Iter ${iter}</span>` : '') +
            `<span class="rvd-loc">` +
              `<a class="rvd-slug" href="${esc(root.page.path)}" target="_blank" rel="noopener">${esc(pageName(root.page.path))}</a>` +
              `<span class="rvd-time">${esc(fmt(root.createdAt))}</span>` +
            `</span>` +
          `</div>` +
          `<div class="rvd-card-body">` +
            `<div class="rvd-comment-text rvd-clamp">${esc(root.comment)}</div>` +
            `<button class="rvd-morebtn" type="button" hidden>Show more</button>` +
            (a.snippet ? `<div class="rvd-snip">on “${esc(a.snippet)}”</div>` : '') +
          `</div>` +
          routeRow(root) +
          (root.changeTo ? `<div class="rvd-change"><span>Change to</span><div>${esc(root.changeTo)}</div></div>` : '') +
          `<div class="rvd-card-foot">` +
            `<div class="rvd-foot-left">${repliesToggle}</div>` +
            `<div class="rvd-acts">` +
              `<a class="rvd-openpin" href="${esc(root.page.path)}?review3=1#c3=${id}" target="_blank" rel="noopener">Open Pin</a>` +
              `<button class="rvd-a rvd-copyone" data-copy="${id}">Copy prompt</button>` +
              lifecycleActions(root) +
              `<button class="rvd-del delete" data-id="${id}">Delete</button>` +
            `</div>` +
          `</div>` +
          repliesBlock +
        `</article>`
      );
    }

    function revealClamps(host) {
      host.querySelectorAll('.rvd-comment-text.rvd-clamp').forEach((el) => {
        const btn = el.parentElement.querySelector('.rvd-morebtn');
        if (btn) btn.hidden = el.scrollHeight <= el.clientHeight + 2;
      });
    }

    // Status actions per state: TBI→Start · In Progress→Mark Complete + Reopen ·
    // Deployed live→Reopen. Reopen prompts for a required reason.
    function lifecycleActions(root) {
      const id = esc(root.id);
      const s = teamStatusOf(root);
      if (s === 'to_be_initiated') return `<button class="rvd-a" data-action="start" data-id="${id}">Start</button>`;
      if (s === 'in_progress') return `<button class="rvd-a" data-action="complete" data-id="${id}">Mark Complete</button>` +
        `<button class="rvd-a" data-action="reopen" data-id="${id}">Reopen</button>`;
      if (s === 'deployed_live') return `<button class="rvd-a" data-action="reopen" data-id="${id}">Reopen</button>`;
      return ''; // reopened → with the raiser (Content)
    }

    // ---- status actions ----
    async function doTeamAction(rec, action) {
      let reason;
      if (action === 'reopen') {
        reason = prompt('Reason for reopening (required — shown to the raising team):');
        if (reason == null) return;
        reason = reason.trim();
        if (!reason) { alert('A reason is required to reopen.'); return; }
      }
      try { Object.assign(rec, await store.teamAction(rec, action, reason)); counts(); render(); lastSig = dataSig(); }
      catch (e) { alert('Could not update — ' + e.message); }
    }
    async function rowDelete(root) {
      if (!confirm('Delete this whole ticket chain (all iterations + replies)? This cannot be undone.')) return;
      try {
        await store.del(root);
        const rootId = root.parentId || root.id;
        all = all.filter((c) => c.id !== rootId && c.parentId !== rootId);
        counts(); render(); lastSig = dataSig();
      } catch (e) { alert('Could not delete — ' + e.message); }
    }
    function rowMenuItems(root) {
      const s = teamStatusOf(root);
      const items = [
        { label: 'View details', onSelect: () => { entryDetail = root.id; render(); } },
        { label: 'Open pin', onSelect: () => window.open(root.page.path + '?review3=1#c3=' + encodeURIComponent(root.id), '_blank', 'noopener') },
        { label: 'Edit teams (From / To)', onSelect: () => openEditTeams(root) },
      ];
      if (s === 'to_be_initiated') items.push({ label: 'Start', onSelect: () => doTeamAction(root, 'start') });
      if (s === 'in_progress') items.push({ label: 'Mark complete', onSelect: () => doTeamAction(root, 'complete') });
      if (s === 'in_progress' || s === 'deployed_live') items.push({ label: 'Reopen', onSelect: () => doTeamAction(root, 'reopen') });
      items.push({ label: 'Copy prompt', onSelect: () => copyToClip(localPrompt(root), null) });
      items.push({ label: 'Delete', danger: true, onSelect: () => rowDelete(root) });
      return items;
    }
    let rowMenuEl = null;
    function closeRowMenu() {
      if (!rowMenuEl) return;
      rowMenuEl.remove(); rowMenuEl = null;
      document.removeEventListener('click', onRowMenuDoc, true);
      document.removeEventListener('keydown', onRowMenuKey, true);
      window.removeEventListener('scroll', closeRowMenu, true);
      window.removeEventListener('resize', closeRowMenu);
    }
    function onRowMenuDoc(e) { if (rowMenuEl && !rowMenuEl.contains(e.target)) closeRowMenu(); }
    function onRowMenuKey(e) { if (e.key === 'Escape') closeRowMenu(); }
    function openRowMenu(btn, root) {
      closeRowMenu();
      const items = rowMenuItems(root);
      const menu = document.createElement('div'); menu.className = 'rvd-rowmenu';
      menu.innerHTML = items.map((it, i) =>
        `<button type="button" class="rvd-rowmenu-item${it.danger ? ' danger' : ''}" data-i="${i}">${esc(it.label)}</button>`).join('');
      document.body.appendChild(menu); rowMenuEl = menu;
      const r = btn.getBoundingClientRect();
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      let left = r.right - mw;
      if (left + mw > innerWidth - 8) left = innerWidth - mw - 8;
      if (left < 8) left = 8;
      let top = r.bottom + 6;
      if (top + mh > innerHeight - 8) top = r.top - mh - 6;
      if (top < 8) top = 8;
      menu.style.left = left + 'px'; menu.style.top = top + 'px';
      menu.querySelectorAll('.rvd-rowmenu-item').forEach((b) =>
        b.addEventListener('click', () => { const it = items[+b.dataset.i]; closeRowMenu(); it.onSelect(); }));
      setTimeout(() => {
        document.addEventListener('click', onRowMenuDoc, true);
        document.addEventListener('keydown', onRowMenuKey, true);
        window.addEventListener('scroll', closeRowMenu, true);
        window.addEventListener('resize', closeRowMenu);
      }, 0);
    }

    function openEditTeams(root) {
      const el = document.createElement('div'); el.className = 'rvd-editmodal';
      el.innerHTML =
        `<div class="rvd-editcard" role="dialog" aria-modal="true">` +
          `<div class="rvd-edithead"><div class="rvd-edittitle">Edit teams</div>` +
            `<button class="rvd-editx" aria-label="Close">×</button></div>` +
          `<p class="rvd-editsub">Re-route this comment — who raised it (From) and which team should action it (To).</p>` +
          `<div class="rvd-editfield"><span class="rvd-editlbl">From</span><div class="rvd-editfrom"></div></div>` +
          `<div class="rvd-editfield"><span class="rvd-editlbl">Directed to</span><div class="rvd-editto"></div></div>` +
          `<div class="rvd-editactions"><button class="rvd-editbtn rvd-editcancel">Cancel</button>` +
            `<button class="rvd-editbtn rvd-editsave">Save</button></div>` +
        `</div>`;
      document.body.appendChild(el);
      const fromDD = buildDropdown({ items: TEAMS.map((t) => ({ value: t, label: t })), value: root.team || '', placeholder: 'Select team', block: true });
      const toDD = buildDropdown({ items: TEAMS.map((t) => ({ value: t, label: t })).concat([{ value: ADMIN_TEAM, label: ADMIN_TEAM, dividerBefore: true }]), value: root.toTeam || '', placeholder: 'Select team', block: true });
      el.querySelector('.rvd-editfrom').appendChild(fromDD.el);
      el.querySelector('.rvd-editto').appendChild(toDD.el);
      const close = () => el.remove();
      el.querySelector('.rvd-editx').addEventListener('click', close);
      el.querySelector('.rvd-editcancel').addEventListener('click', close);
      el.addEventListener('click', (e) => { if (e.target === el) close(); });
      el.querySelector('.rvd-editsave').addEventListener('click', async () => {
        const save = el.querySelector('.rvd-editsave'); save.disabled = true; save.textContent = 'Saving…';
        try { Object.assign(root, await store.setTeams(root, fromDD.getValue(), toDD.getValue())); close(); counts(); render(); lastSig = dataSig(); }
        catch (e) { save.disabled = false; save.textContent = 'Save'; alert('Could not save — ' + e.message); }
      });
    }

    // ---- Master Log: tabular log of every ticket chain (live state), with drill-in ----
    function renderEntries() {
      if (entryDetail) { renderEntryDetail(); return; }
      const rs = sortRoots(roots());
      $('#rvd-empty').hidden = rs.length > 0;
      if (!rs.length) { $('#rvd-entries').innerHTML = ''; return; }
      $('#rvd-entries').innerHTML =
        `<div class="rvd-entrieshead"><h2>Master Log <span style="font-weight:500;color:var(--pk-muted)">(${rs.length})</span></h2></div>` +
        `<div class="rvd-logwrap"><table class="rvd-log"><thead><tr>` +
        `<th>Ticket</th><th>When</th><th>Page</th><th>Element</th><th>Requirement</th><th>From</th><th>Directed to</th><th>Status</th><th>More</th>` +
        `</tr></thead><tbody>` +
        rs.map((c) => {
          const a = c.anchor || {};
          const el = a.snippet ? '“' + esc(a.snippet.slice(0, 40)) + '”' : esc(a.tag || '—');
          const req = (c.comment || '').trim();
          const reqShort = req ? esc(req.slice(0, 120)) + (req.length > 120 ? '…' : '') : '—';
          return `<tr class="rvd-logrow" data-id="${esc(c.id)}">` +
            `<td><span class="rvd-ticket">${c.ticket ? esc(c.ticket) : '—'}</span></td>` +
            `<td>${esc(fmt(c.createdAt))}</td>` +
            `<td><a class="rvd-slug" href="${esc(c.page.path)}" target="_blank" rel="noopener">${esc(pageName(c.page.path))}</a></td>` +
            `<td>${el}</td>` +
            `<td class="rvd-log-req">${reqShort}</td>` +
            `<td>${teamChip(c.team) || '—'}</td>` +
            `<td>${teamChip(c.toTeam) || '—'}</td>` +
            `<td>${statusChip(c)}</td>` +
            `<td><button class="rvd-moreopts" data-more="${esc(c.id)}">More options <span class="rvd-moreopts-chev">▾</span></button></td>` +
          `</tr>`;
        }).join('') +
        `</tbody></table></div>`;
      const open = (id) => { entryDetail = id; render(); };
      $('#rvd-entries').querySelectorAll('.rvd-logrow').forEach((tr) => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('a, .rvd-moreopts')) return;
          open(tr.dataset.id);
        });
      });
      $('#rvd-entries').querySelectorAll('.rvd-moreopts').forEach((b) => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const rec = roots().find((c) => c.id === b.dataset.more); if (rec) openRowMenu(b, rec);
        });
      });
    }

    function renderEntryDetail() {
      const c = roots().find((x) => x.id === entryDetail) || all.find((x) => x.id === entryDetail);
      if (!c) { entryDetail = null; return renderEntries(); }
      $('#rvd-empty').hidden = true;
      const a = c.anchor || {};
      const where = a.snippet ? '“' + esc(a.snippet) + '”' + (a.tag ? ' · ' + esc(a.tag) : '') : (a.tag ? esc(a.tag) : '—');
      const hist = chainHistory(c);
      const field = (k, vHtml) => `<div class="rvd-field"><div class="rvd-field-k">${k}</div><div class="rvd-field-v">${vHtml}</div></div>`;
      const timeline = hist.length
        ? `<ol class="rvd-timeline">` + hist.map((h, i) =>
            `<li class="rvd-tl${i === hist.length - 1 ? ' is-current' : ''}">` +
              `<div class="rvd-tl-top"><span class="rvd-tl-iter">-${h.iteration || 1}</span>` +
              `<span class="rvd-tl-event">${esc(eventLabel(h))}</span>` +
              `<span class="rvd-tl-time">${esc(fmt(h.at))}</span></div>` +
            `</li>`).join('') + `</ol>`
        : '—';
      const acts = lifecycleActions(c);
      $('#rvd-entries').innerHTML =
        `<button class="rvd-back" id="rvd-back">← Back to Master Log</button>` +
        `<article class="rvd-detail">` +
          `<h2 class="rvd-detail-title">${esc(c.comment)}</h2>` +
          `<div class="rvd-detail-chips">${statusChip(c)}${routeChips(c)}` +
            `<a class="rvd-slug" href="${esc(c.page.path)}?review3=1#c3=${esc(c.id)}" target="_blank" rel="noopener">Open pin</a></div>` +
          (acts ? `<div class="rvd-detail-acts">${acts}</div>` : '') +
          `<div class="rvd-fields">` +
            field('Ticket', c.ticket ? `<span class="rvd-ticket">${esc(c.ticket)}</span>` : '—') +
            field('Iteration', String(c.iteration || 1)) +
            field('Page', `<a href="${esc(c.page.path)}" target="_blank" rel="noopener">${esc(pageName(c.page.path))}</a> <span style="color:var(--pk-muted)">${esc(c.page.path)}</span>`) +
            field('Element / anchor', where) +
            field('From (raised by)', esc(c.name || 'anonymous') + (c.team ? ' · ' + esc(c.team) : '')) +
            field('Directed to', c.toTeam ? teamChip(c.toTeam) : '—') +
            field('Submitted', esc(fmt(c.createdAt))) +
            (c.changeTo ? `<div class="rvd-field"><div class="rvd-field-k">Change to</div><div class="rvd-change"><div>${esc(c.changeTo)}</div></div></div>` : '') +
            (c.reopenReason && teamStatusOf(c) === 'reopened' ? field('Reopen reason', esc(c.reopenReason)) : '') +
            field('Current status', esc(statusLabel(c))) +
            `<div class="rvd-field"><div class="rvd-field-k">AI prompt</div>` +
              (c.aiPrompt ? `<div class="rvd-field-prompt">${esc(c.aiPrompt)}</div>`
                          : `<div class="rvd-field-v" style="color:var(--pk-muted);font-style:italic">Generating — usually ready within seconds of submit. Refresh in a moment.</div>`) + `</div>` +
            `<div class="rvd-field"><div class="rvd-field-k">Iteration timeline</div>${timeline}</div>` +
          `</div>` +
        `</article>`;
      $('#rvd-back').addEventListener('click', () => { entryDetail = null; render(); });
      $('#rvd-entries').querySelectorAll('.rvd-detail-acts .rvd-a[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const rec = roots().find((x) => x.id === btn.dataset.id); if (!rec) return;
          btn.disabled = true;
          await doTeamAction(rec, btn.dataset.action);
        });
      });
    }

    // ---- Notifications (admin: all), newest first, unread flagged ----
    function renderNotifs() {
      $('#rvd-empty').hidden = true;
      const list = (notifs || []).slice().sort((a, b) => ((a.updatedAt || a.createdAt) < (b.updatedAt || b.createdAt) ? 1 : -1));
      const unread = list.filter((n) => n.readAdmin === false);
      $('#rvd-view-notifs').innerHTML =
        `<div class="rvd-notifhead">` +
          `<div><h2>Notifications</h2>` +
          `<p class="rvd-deploy-explain">Fired as tickets move through the status machine (started, deployed live, reopened, resubmitted).</p></div>` +
          (unread.length ? `<button class="rvd-a" id="rvd-notif-read">Mark all read (${unread.length})</button>` : '') +
        `</div>` +
        (list.length
          ? `<div class="rvd-notiflist">${list.map(notifItem).join('')}</div>`
          : `<p class="rvd-empty">No notifications yet.</p>`);
      const rb = $('#rvd-notif-read');
      if (rb) rb.addEventListener('click', async () => {
        rb.disabled = true;
        try { await store.markRead(unread.map((n) => n.id), true); await loadData(); }
        catch (e) { rb.disabled = false; alert('Could not update — ' + e.message); }
      });
      $('#rvd-view-notifs').querySelectorAll('.rvd-notif-toggle').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try { await store.markRead([btn.dataset.id], btn.dataset.read === 'true'); await loadData(); }
          catch (e) { btn.disabled = false; alert('Could not update — ' + e.message); }
        });
      });
    }
    function notifItem(n) {
      const unread = n.readAdmin === false;
      let chip;
      if (n.kind === 'status' && TEAM_STATUS[n.teamStatus]) {
        const [cls, label] = TEAM_STATUS[n.teamStatus];
        chip = `<span class="rvd-chip ${cls}">${label}</span>`;
      } else if (n.kind === 'directed') {
        chip = `<span class="rvd-chip open">Directed</span>`;
      } else {
        chip = `<span class="rvd-chip deployed">Update</span>`;
      }
      const openPin = n.commentId
        ? `<a class="rvd-openpin" href="${esc(n.path)}?review3=1#c3=${esc(n.commentId)}" target="_blank" rel="noopener">Open Pin</a>` : '';
      return `<div class="rvd-notif${unread ? ' is-unread' : ''}">` +
        `<span class="rvd-notif-dot"></span>` +
        `<div class="rvd-notif-body">` +
          `<div class="rvd-notif-summary">${esc(n.summary || '')}</div>` +
          `<div class="rvd-notif-meta">${teamChip(n.team)}` +
            `<a class="rvd-slug" href="${esc(n.path)}" target="_blank" rel="noopener">${esc(pageName(n.path))}</a>` +
            `<span class="rvd-time">${esc(fmt(n.updatedAt || n.createdAt))}</span>` +
            chip + openPin +
          `</div>` +
        `</div>` +
        `<button class="rvd-a rvd-notif-toggle" type="button" data-id="${esc(n.id)}" data-read="${unread ? 'true' : 'false'}">` +
          `${unread ? 'Mark read' : 'Mark unread'}</button>` +
      `</div>`;
    }

    function render() {
      $('#rvd-view-dash').hidden = view !== 'dash';
      $('#rvd-view-entries').hidden = view !== 'entries';
      $('#rvd-view-notifs').hidden = view !== 'notifs';
      const dep = $('#rvd-view-deploy'); if (dep) dep.hidden = true;
      if (view === 'entries') { renderEntries(); return; }
      if (view === 'notifs') { renderNotifs(); return; }

      const host = $('#rvd-list');
      const rs = currentRoots();

      if (tab === 'page') {
        const paths = [...new Set(rs.map((c) => c.page.path))].sort();
        host.innerHTML = paths.map((p) => {
          const group = rs.filter((c) => c.page.path === p);
          const tbiN = group.filter((c) => teamStatusOf(c) === 'to_be_initiated').length;
          const progN = group.filter((c) => teamStatusOf(c) === 'in_progress').length;
          return `<div class="rvd-group"><h2 class="rvd-gh">` +
            `<a href="${esc(p)}" target="_blank" rel="noopener">${esc(pageName(p))}</a>` +
            `<span class="rvd-gh-rollup">${tbiN} TBI · ${progN} in progress</span>` +
            `<span class="rvd-gh-actions"><button class="rvd-gh-copy" data-page="${esc(p)}">Copy prompts</button></span>` +
            `</h2><div class="rvd-grid">${group.map(card).join('')}</div></div>`;
        }).join('');
        host.querySelectorAll('.rvd-gh-copy').forEach((b) => b.addEventListener('click', () =>
          copyToClip(promptsText(rs.filter((c) => c.page.path === b.dataset.page)), b, 'Copied ✓')));
      } else {
        host.innerHTML = `<div class="rvd-grid">${rs.map(card).join('')}</div>`;
      }
      const emp = $('#rvd-empty');
      emp.hidden = rs.length > 0;
      if (!rs.length) emp.textContent = search ? 'No tickets match your search.' : 'Nothing in the Team Queue.';
      bindActions();
      updateSelectToggle();
    }

    function updateBulk() {
      const n = sel.size;
      const bar = $('#rvd-bulk');
      bar.hidden = !(selectMode && n > 0);
      if (n) $('#rvd-bulk-n').textContent = n + ' selected';
      updateSelectToggle();
    }

    function updateSelectToggle() {
      const btn = $('#rvd-selectall'); if (!btn) return;
      btn.textContent = selectMode ? 'Deselect All' : 'Select';
      btn.classList.toggle('is-active', selectMode);
    }
    function setSelectMode(on) {
      selectMode = on;
      if (!on) sel.clear();
      updateBulk(); render();
    }

    function bindActions(scope) {
      const host = scope || $('#rvd-list');
      host.querySelectorAll('.rvd-sel').forEach((cb) => {
        cb.addEventListener('change', () => {
          cb.checked ? sel.add(cb.dataset.id) : sel.delete(cb.dataset.id);
          updateBulk(); render();
        });
      });
      host.querySelectorAll('.rvd-a[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const rec = roots().find((c) => c.id === btn.dataset.id); if (!rec) return;
          btn.disabled = true;
          await doTeamAction(rec, btn.dataset.action);
        });
      });
      host.querySelectorAll('.rvd-copyone').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rec = all.find((c) => c.id === btn.dataset.copy); if (!rec) return;
          copyToClip(localPrompt(rec), btn, 'Copied ✓');
        });
      });
      host.querySelectorAll('.delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const rec = roots().find((c) => c.id === btn.dataset.id) || all.find((c) => c.id === btn.dataset.id); if (!rec) return;
          rowDelete(rec);
        });
      });
      host.querySelectorAll('.rvd-morebtn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const el = btn.parentElement.querySelector('.rvd-comment-text');
          const clamped = el.classList.toggle('rvd-clamp');
          btn.textContent = clamped ? 'Show more' : 'Show less';
        });
      });
      host.querySelectorAll('.rvd-repliestoggle').forEach((btn) => {
        btn.addEventListener('click', () => {
          const wrap = host.querySelector('.rvd-replies[data-replies-for="' + btn.dataset.replies + '"]');
          if (!wrap) return;
          const open = wrap.hasAttribute('hidden');
          if (open) wrap.removeAttribute('hidden'); else wrap.setAttribute('hidden', '');
          btn.classList.toggle('is-open', open);
        });
      });
      revealClamps(host);
    }

    document.querySelector('.rvd-side').addEventListener('click', (e) => {
      const b = e.target.closest('.rvd-nav'); if (!b) return;
      view = b.dataset.view; entryDetail = null;
      document.querySelectorAll('.rvd-nav').forEach((n) => n.classList.toggle('is-active', n === b));
      render();
    });

    $('#rvd-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('.rvd-tab'); if (!b) return;
      tab = b.dataset.tab;
      $('#rvd-tabs').querySelectorAll('.rvd-tab').forEach((t) => t.classList.toggle('is-active', t === b));
      render();
    });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    $('#rvd-refresh').addEventListener('click', async () => {
      const btn = $('#rvd-refresh');
      if (btn.classList.contains('is-refreshing')) return;
      btn.classList.remove('is-done');
      btn.classList.add('is-refreshing');
      const t0 = Date.now();
      try {
        await loadData();
        await wait(Math.max(0, 650 - (Date.now() - t0)));
        btn.classList.remove('is-refreshing');
        btn.classList.add('is-done');
        setTimeout(() => {
          btn.classList.add('is-resetting');
          btn.classList.remove('is-done');
          setTimeout(() => btn.classList.remove('is-resetting'), 550);
        }, 1100);
      } catch (e) {
        btn.classList.remove('is-refreshing');
        alert('Could not refresh — ' + e.message);
      }
    });
    // ---- toolbar: search / sort / export / copy-all-prompts ----
    $('#rvd-search').addEventListener('input', (e) => { search = e.target.value.trim(); render(); });
    $('#rvd-selectall').addEventListener('click', () => setSelectMode(!selectMode));
    const IC = {
      newest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
      oldest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
      page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6"/></svg>',
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
      md: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
      json: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
    };
    const sortDD = buildDropdown({
      small: true, value: sort,
      items: [
        { value: 'new', label: 'Newest first', icon: IC.newest },
        { value: 'old', label: 'Oldest first', icon: IC.oldest },
        { value: 'page', label: 'Page A–Z', icon: IC.page },
      ],
      onSelect: (v) => { sort = v; render(); },
    });
    $('#rvd-sort-mount').appendChild(sortDD.el);
    let copyDD;
    const flashCopy = () => { copyDD.setLabel('Copied ✓'); setTimeout(() => copyDD.setLabel('Copy'), 1400); };
    copyDD = buildDropdown({
      small: true, fixedLabel: 'Copy', menuAlign: 'right',
      items: [
        { label: 'Copy prompts', icon: IC.copy, onSelect: () => { copyToClip(promptsText(currentRoots()), null); flashCopy(); } },
        { label: 'Copy MD', icon: IC.md, onSelect: () => { copyToClip(mdExport(currentRoots()), null); flashCopy(); } },
        { label: 'Download JSON', icon: IC.json, onSelect: () => downloadJSON() },
      ],
    });
    $('#rvd-copy-mount').appendChild(copyDD.el);

    // ---- bulk actions on the selected tickets (Start / Mark Complete / Reopen) ----
    $('#rvd-bulk').addEventListener('click', async (e) => {
      const b = e.target.closest('.rvd-bulk-a'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'all') { currentRoots().forEach((c) => sel.add(c.id)); updateBulk(); render(); return; }
      const recs = [...sel].map((id) => roots().find((c) => c.id === id)).filter(Boolean);
      if (!recs.length) return;
      if (act === 'copy') { copyToClip(promptsText(recs), b, 'Copied ✓'); return; }
      if (act === 'delete' && !confirm(`Delete ${recs.length} ticket chain${recs.length > 1 ? 's' : ''} (all iterations + replies)? This cannot be undone.`)) return;
      let reason;
      if (act === 'reopen') {
        reason = prompt('Reason for reopening the selected tickets (required):');
        if (reason == null) return;
        reason = reason.trim();
        if (!reason) { alert('A reason is required to reopen.'); return; }
      }
      [...$('#rvd-bulk').querySelectorAll('.rvd-bulk-a')].forEach((x) => (x.disabled = true));
      try {
        for (const rec of recs) {
          if (act === 'start') { Object.assign(rec, await store.teamAction(rec, 'start')); }
          else if (act === 'complete') { Object.assign(rec, await store.teamAction(rec, 'complete')); }
          else if (act === 'reopen') { Object.assign(rec, await store.teamAction(rec, 'reopen', reason)); }
          else if (act === 'delete') { await store.del(rec); const rid = rec.parentId || rec.id; all = all.filter((c) => c.id !== rid && c.parentId !== rid); }
        }
        sel.clear(); updateBulk(); counts(); render(); lastSig = dataSig();
      } catch (err) { alert('Bulk action failed — ' + err.message); }
      finally { [...$('#rvd-bulk').querySelectorAll('.rvd-bulk-a')].forEach((x) => (x.disabled = false)); }
    });
    $('#rvd-bulk-clear').addEventListener('click', () => { sel.clear(); updateBulk(); render(); });

    buildTeamChips();

    // "Team dashboards" — admin can open ANY team's board. Teams not enabled in this phase
    // (config.js: isTeamEnabled) are greyed out + non-navigable.
    const teamViewMount = $('#rvd-teamview-mount');
    if (teamViewMount) {
      const teamViewDD = buildDropdown({
        block: true, fixedLabel: 'Jump To Team',
        // Teams gated off via config.js (isTeamEnabled) render greyed + inert (buildDropdown
        // honours `disabled`: aria-disabled, out of the focus order, click is a no-op).
        items: TEAMS.map((t) => ({
          value: t, label: t, disabled: !teamEnabled(t),
          onSelect: () => window.open('/teamdash3?team=' + encodeURIComponent(t), '_blank', 'noopener'),
        })),
      });
      teamViewMount.appendChild(teamViewDD.el);
    }

    init();
  })();
