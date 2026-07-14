  import { TEAMS, TEAM_COLORS, WORKER_URL, PROOFKIT_ENABLED, pageName, ADMIN_TEAM,
    buildPanelLogin, buildDropdown, getSession, setSession, clearSession, initLocalTheme, mountThemeToggle, ensureDemoReset } from './config.js';
  (() => {
    if (!PROOFKIT_ENABLED) return; // master switch (./config.ts)
    // Theme skins come from design/tokens.css (linked by the adapter). Each team member
    // controls their OWN light/dark mode — an individual, per-browser toggle (never the
    // admin's global one). initLocalTheme applies the remembered choice; the toggle flips
    // it locally and persists it, so the next login on this browser starts in that mode.
    initLocalTheme(); mountThemeToggle('[data-pk-toggle]', { local: true });
    const LOCAL = !WORKER_URL;

    // Admin override: Builder (admin) can open ANY team's board via /teamdash?team=<T>
    // (the "View a team's board" dropdown on the admin dashboard). The admin key has
    // full access on the Worker, so it returns that team's inbox. Non-admins can never
    // impersonate — the param is honoured only for an admin session, and the Worker
    // enforces it regardless.
    const OVERRIDE = (() => {
      try {
        const t = new URLSearchParams(location.search).get('team');
        return t && TEAMS.includes(t) && getSession().team === ADMIN_TEAM ? t : '';
      } catch { return ''; }
    })();

    // The effective team: the admin-chosen override, else the signed-in team (config).
    const team = () => OVERRIDE || getSession().team;

    // ---- transport: Worker (X-Review-Pass) or the localStorage demo store ----
    async function apiFetch(path, opts = {}) {
      const headers = { 'Content-Type': 'application/json' };
      const pass = getSession().key; // the one shared session key
      if (pass) headers['X-Review-Pass'] = pass;
      const res = await fetch(WORKER_URL + path, { ...opts, headers });
      if (res.status === 401) { clearSession(); throw new Error('unauthorized'); }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }
    // The team-visible projection (matches the Worker's maskForTeam) for LOCAL mode.
    const maskLocal = (c) => ({
      id: c.id, ticket: c.ticket || '', parentId: c.parentId || null, createdAt: c.createdAt, team: c.team || '', toTeam: c.toTeam || '',
      name: c.name || '', comment: c.comment, changeTo: c.changeTo || '',
      aiPrompt: c.aiPrompt || '', validation: c.validation || null,
      page: c.page, anchor: c.anchor || {},
      status: c.published ? (c.publishedStatus || 'open') : 'open', // masked
      publishedStatus: c.published ? (c.publishedStatus || '') : '', publishedAt: c.publishedAt || '',
      // Team-owned workflow (not masked — it is the team's own progress).
      teamStatus: c.teamStatus || 'to_be_initiated', teamStatusAt: c.teamStatusAt || '',
      teamDelivered: !!c.teamDelivered, teamDeliveredAt: c.teamDeliveredAt || '',
      ack: c.ack || '',
    });
    // ---- LOCAL writers for the team workflow (mirror the Worker endpoints) ----
    // Find + mutate one root record in its rvc:<path> array, then return the masked copy.
    function localMutate(rec, fn) {
      const key = 'rvc:' + rec.page.path;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const r = arr.find((x) => x.id === rec.id);
      if (!r) return { ...rec };
      fn(r);
      localStorage.setItem(key, JSON.stringify(arr));
      return maskLocal(r);
    }
    function localTeamStatus(rec, teamStatus) {
      const now = new Date().toISOString();
      return localMutate(rec, (r) => {
        r.teamStatus = teamStatus; r.teamStatusAt = now;
        if (!Array.isArray(r.history)) r.history = [];
        r.history.push({ event: 'teamStatus', teamStatus, team: r.toTeam || '', at: now });
      });
    }
    // Deliver every completed-not-yet-delivered item directed to <t>; notify each raiser.
    function localTeamDeliver(t) {
      const now = new Date().toISOString();
      const created = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('rvc:')) continue;
        let arr; try { arr = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
        let dirty = false;
        for (const r of arr) {
          if (r.parentId || (r.toTeam || '') !== t) continue;
          if (r.teamStatus !== 'complete' || r.teamDelivered) continue;
          r.teamDelivered = true; r.teamDeliveredAt = now;
          if (!Array.isArray(r.history)) r.history = [];
          r.history.push({ event: 'teamDeliver', team: t, at: now });
          dirty = true;
          if (r.team) created.push(localMakeTeamNotif(r, now, 'delivered'));
        }
        if (dirty) localStorage.setItem(k, JSON.stringify(arr));
      }
      if (created.length) {
        let ex = []; try { ex = JSON.parse(localStorage.getItem('rvc-notifications') || '[]'); } catch {}
        ex.push(...created);
        localStorage.setItem('rvc-notifications', JSON.stringify(ex));
      }
      return { delivered: created.length, notifications: created };
    }
    function localTeamAck(rec, action) {
      const now = new Date().toISOString();
      let notif = null;
      const out = localMutate(rec, (r) => {
        if (!Array.isArray(r.history)) r.history = [];
        if (action === 'conclude') {
          r.ack = 'concluded';
          r.history.push({ event: 'ack', team: r.team || '', at: now });
        } else {
          r.teamStatus = 'in_progress'; r.teamStatusAt = now;
          r.teamDelivered = false; r.teamDeliveredAt = '';
          r.ack = '';
          r.history.push({ event: 'redo', team: r.team || '', at: now });
          if (r.toTeam) notif = localMakeTeamNotif(r, now, 'redo');
        }
      });
      if (notif) {
        let ex = []; try { ex = JSON.parse(localStorage.getItem('rvc-notifications') || '[]'); } catch {}
        ex.push(notif);
        localStorage.setItem('rvc-notifications', JSON.stringify(ex));
      }
      return out;
    }
    const luid = () => (crypto.randomUUID ? crypto.randomUUID() : 'n_' + Date.now() + '_' + Math.random().toString(16).slice(2));
    // Local mirror of the Worker's makeTeamNotif (round-trip notification).
    function localMakeTeamNotif(r, now, kind) {
      const where = (r.page && r.page.title) || (r.page && r.page.path) || 'a page';
      const toTeam = kind === 'redo' ? (r.toTeam || '') : (r.team || '');
      const tick = r.ticket ? '#' + r.ticket + ' ' : '';
      const summary = kind === 'redo'
        ? 'Redo requested on ' + tick + '(' + where + ') by ' + (r.team || 'the raising team') + '.'
        : (r.toTeam || 'A team') + ' completed & delivered your comment ' + tick + 'on ' + where + ' — acknowledge it.';
      return {
        id: luid(), createdAt: now, team: toTeam, kind,
        fromTeam: kind === 'redo' ? (r.team || '') : (r.toTeam || ''),
        commentId: r.id, ticket: r.ticket || '', path: (r.page && r.page.path) || '/', pageName: where,
        summary, readTeam: false, readAdmin: false,
      };
    }
    // Every task this team is part of — ones it RAISED (team) AND ones DIRECTED to it
    // (toTeam) — so the raiser and the receiver both see it. Thread-aware.
    function localComments(t) {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('rvc:')) { try { out.push(...JSON.parse(localStorage.getItem(k) || '[]')); } catch {} }
      }
      const mine = new Set(out.filter((c) => !c.parentId && ((c.team || '') === t || (c.toTeam || '') === t)).map((c) => c.id));
      return out
        .filter((c) => (!c.parentId && mine.has(c.id)) || (c.parentId && mine.has(c.parentId)))
        .map(maskLocal).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    function localNotifs(t) {
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem('rvc-notifications') || '[]'); } catch {}
      return arr.filter((n) => n.team === t).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    function localMarkRead(ids, read = true) {
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem('rvc-notifications') || '[]'); } catch {}
      let updated = 0;
      for (const n of arr) { if (ids.includes(n.id) && n.team === team() && n.readTeam !== read) { n.readTeam = read; updated++; } }
      if (updated) localStorage.setItem('rvc-notifications', JSON.stringify(arr));
      return { ok: true, updated };
    }

    const store = LOCAL
      ? {
          comments: async () => localComments(team()),
          notifs: async () => localNotifs(team()),
          markRead: async (ids, read = true) => localMarkRead(ids, read),
          teamStatus: async (rec, teamStatus) => localTeamStatus(rec, teamStatus),
          teamDeliver: async () => localTeamDeliver(team()),
          teamAck: async (rec, action) => localTeamAck(rec, action),
        }
      : {
          comments: () => apiFetch('/comments?team=' + encodeURIComponent(team())),
          notifs: () => apiFetch('/notifications?team=' + encodeURIComponent(team())),
          markRead: (ids, read = true) => apiFetch('/notifications/read', { method: 'POST', body: JSON.stringify({ ids, team: team(), read }) }),
          teamStatus: (rec, teamStatus) => apiFetch('/team-status', { method: 'POST', body: JSON.stringify({ id: rec.id, path: rec.page.path, teamStatus }) }),
          teamDeliver: () => apiFetch('/team-deliver', { method: 'POST', body: JSON.stringify({ team: team() }) }),
          teamAck: (rec, action) => apiFetch('/team-ack', { method: 'POST', body: JSON.stringify({ id: rec.id, path: rec.page.path, action }) }),
        };

    // ---- helpers ----
    const $ = (s) => document.querySelector(s);
    const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
    // "11:11:53 | 14 July, 2026" — the rail timestamp format (per the Figma card).
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const pad2 = (n) => String(n).padStart(2, '0');
    const fmtTimeDate = (iso) => {
      try {
        const d = new Date(iso);
        return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} | ${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
      } catch { return String(iso || ''); }
    };
    // ---- the team's OWN status (its progress on an item), independent of the admin lifecycle ----
    const TEAM_STATUS = {
      to_be_initiated: ['tbi', 'To Be Initiated'],
      in_progress: ['inprog', 'In Progress'],
      complete: ['complete', 'Complete'],
    };
    const teamStatusOf = (c) => (TEAM_STATUS[c.teamStatus] ? c.teamStatus : 'to_be_initiated');
    // Card left-border state keyed to the team status (tbi · in-progress · complete).
    const dataState = (c) => TEAM_STATUS[teamStatusOf(c)][0];
    // Team chip colour derived from the team's identity hue (mirrors Dashboard.astro).
    const mix = (a, b, t) => {
      const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
      const ch = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
      return '#' + ch(ar, br) + ch(ag, bg) + ch(ab, bb);
    };
    const isLight = () => document.documentElement.getAttribute('data-pk-theme') === 'light';
    // Blend anchors read from the live tokens (canvas / white) so the derived team-chip
    // colours track the theme — no isolated literals (the fallbacks are defensive only).
    const tokenHex = (name, fb) => { try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb; } catch { return fb; } };
    const teamStyle = (t) => {
      const tc = TEAM_COLORS[t] || ['#e8e8e8', '#888']; // fallback: every real team is in TEAM_COLORS
      const white = tokenHex('--pk-on-accent', '#ffffff');
      // Light: the on-page pastel chip (light bg + dark ink). Dark: hue muted toward the canvas.
      if (isLight()) return { bg: tc[0], fg: tc[1], bd: mix(tc[1], white, 0.62) };
      const canvas = tokenHex('--pk-canvas', '#181818');
      const accent = tc[1];
      return { bg: mix(accent, canvas, 0.82), fg: mix(accent, white, 0.55), bd: mix(accent, canvas, 0.5) };
    };
    const teamChip = (t) => {
      if (!t) return '';
      const s = teamStyle(t);
      return `<span class="tmd-team-chip" style="background:${s.bg};color:${s.fg};border:1px solid ${s.bd}">${esc(t)}</span>`;
    };
    // The team-status chip. For the RECEIVER team (settable) it is a chevron button that
    // opens the status menu; everywhere else it is a static chip.
    const statusChip = (c, settable) => {
      const [cls, label] = TEAM_STATUS[teamStatusOf(c)];
      if (settable) {
        return `<button type="button" class="tmd-chip ${cls} tmd-chip--set" data-setstatus="${esc(c.id)}">${label}` +
          `<svg class="tmd-chip-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`;
      }
      return `<span class="tmd-chip ${cls}">${label}</span>`;
    };
    const statusLabel = (c) => TEAM_STATUS[teamStatusOf(c)][1];
    // Is the signed-in team the RECEIVER (the team directed to action this item)?
    const isReceiver = (c) => (c.toTeam || '') === team();
    // Is it the RAISER, and has the receiver delivered it (awaiting acknowledge)?
    const awaitingAck = (c) => (c.team || '') === team() && c.teamDelivered && c.ack !== 'concluded';

    // The AI change-prompt (falls back to a deterministic instruction if not ready yet).
    function localPrompt(c) {
      if (c.aiPrompt) return c.aiPrompt;
      const a = c.anchor || {};
      const where = a.snippet ? `the “${a.snippet}” ${a.tag || 'element'}` : (a.tag || 'the element');
      let s = `On page ${c.page.path}, in ${where}: ${c.comment}`;
      if (c.changeTo) s += `\nChange the content to exactly (preserve casing/punctuation): “${c.changeTo}”`;
      return s;
    }
    async function copyToClip(text, btn, ok) {
      try {
        await navigator.clipboard.writeText(text);
        if (btn) { const t = btn.textContent; btn.textContent = ok || 'Copied ✓'; setTimeout(() => { btn.textContent = t; }, 1400); }
      } catch (e) { alert('Copy failed — ' + e.message); }
    }
    // Team-safe status history: only the events a team should see (Raised → Marked
    // done/Closed on deploy). Pre-deploy transitions (the bucket) are never surfaced.
    function teamHistory(c) {
      const out = [{ at: c.createdAt, label: 'Raised' }];
      if (c.teamStatusAt) out.push({ at: c.teamStatusAt, label: 'Status → ' + statusLabel(c) });
      if (c.teamDeliveredAt) out.push({ at: c.teamDeliveredAt, label: 'Delivered to raising team' });
      return out.slice().sort((a, b) => (a.at < b.at ? -1 : 1));
    }
    // Completion validation, framed for the team (only content-copy-match is meaningful).
    function validLine(c) {
      const v = c && c.validation;
      if (!v) return '—';
      if (v.method === 'content-copy-match') return (v.ok ? '✓ Verified on the live page' : '⚠ Not verified on the live page yet') + (v.detail ? ' — ' + esc(v.detail) : '');
      return 'Confirmed by admin' + (v.detail ? ' — ' + esc(v.detail) : '');
    }

    // ---- state ----
    let comments = [], notes = [], view = 'comments', filter = 'all', byPage = false;
    let search = '', sort = 'new', fromFilter = '', entryDetail = null;
    const roots = () => comments.filter((c) => !c.parentId);
    const repliesOf = (id) => comments.filter((c) => c.parentId === id).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    const unreadNotes = () => notes.filter((n) => n.readTeam === false);

    function matchesSearch(c) {
      if (!search) return true;
      const a = c.anchor || {};
      return [c.comment, c.changeTo, c.page && c.page.path, c.name, c.team, a.snippet, a.tag]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    }
    function matchesNoteSearch(n) {
      if (!search) return true;
      return [n.summary, n.path, pageName(n.path || '/')]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    }
    function sortRoots(rs) {
      const s = rs.slice();
      if (sort === 'old') s.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      else if (sort === 'page') s.sort((a, b) => a.page.path.localeCompare(b.page.path) || (a.createdAt < b.createdAt ? 1 : -1));
      else s.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest
      return s;
    }
    function currentRoots() {
      let rs = roots();
      if (filter === 'tbi') rs = rs.filter((c) => teamStatusOf(c) === 'to_be_initiated');
      else if (filter === 'in_progress') rs = rs.filter((c) => teamStatusOf(c) === 'in_progress');
      else if (filter === 'complete') rs = rs.filter((c) => teamStatusOf(c) === 'complete');
      if (fromFilter) rs = rs.filter((c) => (c.team || '') === fromFilter); // raised-by team
      return sortRoots(rs.filter(matchesSearch));
    }
    // The receiver's Delivery Queue: items directed to this team, marked complete, not yet
    // delivered back to the raiser. This is the safety-net staging list — the CANONICAL set
    // (unfiltered) that drives the badge, counts and the Deploy action. Search/sort/By Page
    // only reshape what's *shown*, never what deploys.
    function deliveryRoots() {
      return roots().filter((c) => isReceiver(c) && teamStatusOf(c) === 'complete' && !c.teamDelivered);
    }

    // ---- data ----
    async function loadData() {
      const [c, n] = await Promise.all([store.comments(), store.notifs()]);
      comments = Array.isArray(c) ? c : [];
      notes = Array.isArray(n) ? n : [];
      renderHeader(); counts(); render();
    }
    let refreshTimer = null;
    function startAutoRefresh() {
      if (refreshTimer) return;
      refreshTimer = setInterval(() => { if (!document.hidden) loadData().catch(() => {}); }, 30000);
      window.addEventListener('focus', () => loadData().catch(() => {}));
    }

    function renderHeader() {
      // Team is the third section of the brand tag: "Content Review | Shriram FS | <Team>",
      // with the team name highlighted in a contrasting blue.
      const tt = $('#tmd-tag-team');
      if (tt) tt.innerHTML = team() ? ' | <span class="tmd-team-hi">' + esc(team()) + '</span>' : '';
      // Page title carries the team name: e.g. "SEO Team" (falls back to "Team").
      const h1 = document.querySelector('.tmd-h1');
      if (h1) h1.textContent = team() ? team() + ' Team' : 'Team';
      const badge = $('#tmd-navbadge');
      const u = unreadNotes().length;
      badge.textContent = u;
      badge.hidden = u === 0;
    }

    function counts() {
      const rs = roots();
      const inProg = rs.filter((c) => teamStatusOf(c) === 'in_progress').length;
      const complete = rs.filter((c) => teamStatusOf(c) === 'complete').length;
      const unread = unreadNotes().length;
      $('#tmd-counts').innerHTML =
        `<span class="tmd-count tmd-count-inprog"><b>${inProg}</b> In Progress</span>` +
        `<span class="tmd-count tmd-count-done"><b>${complete}</b> Complete</span>` +
        `<span class="tmd-count"><b>${unread}</b> Notifications</span>`;
      updateDeliveryBadge();
    }
    // Live count on the Delivery Queue nav item (items staged for delivery).
    function updateDeliveryBadge() {
      const n = deliveryRoots().length;
      const b = $('#tmd-badge-delivery');
      if (b) { b.textContent = n; b.hidden = n === 0; }
    }

    // The round-trip band shown to the RAISING team once the receiver delivers: accept the
    // change (Conclude) or bounce it back for another go (Request redo). Once concluded it
    // shows a quiet confirmation. Nothing for the receiver or undelivered items.
    function ackRow(root) {
      const id = esc(root.id);
      const raiser = (root.team || '') === team();
      if (raiser && root.ack === 'concluded') {
        return `<div class="tmd-ack tmd-ack--done"><span class="tmd-ack-lbl">✓ Concluded</span></div>`;
      }
      if (!awaitingAck(root)) return '';
      const by = root.toTeam ? esc(root.toTeam) : 'the team';
      return `<div class="tmd-ack">` +
        `<span class="tmd-ack-lbl">Delivered by <b>${by}</b> — acknowledge:</span>` +
        `<span class="tmd-ack-btns">` +
          `<button type="button" class="tmd-ack-btn tmd-ack-conclude" data-ack="conclude" data-id="${id}">Conclude</button>` +
          `<button type="button" class="tmd-ack-btn tmd-ack-redo" data-ack="redo" data-id="${id}">Request redo</button>` +
        `</span>` +
      `</div>`;
    }

    function card(root) {
      const a = root.anchor || {};
      const replies = repliesOf(root.id);
      const repliesHtml = replies.length
        ? `<div class="tmd-replies">` + replies.map((r) =>
            `<div class="tmd-reply">${teamChip(r.team)}<div class="tmd-rtxt">${esc(r.comment)}</div>` +
            (r.changeTo ? `<div class="tmd-change"><span>Change to</span><div>${esc(r.changeTo)}</div></div>` : '') +
            `<div class="tmd-rmeta">${esc(fmt(r.createdAt))}</div></div>`).join('') + `</div>`
        : '';
      const id = esc(root.id);
      // Direction: received → "Raised By <them>"; raised by us to another team → "To <them>".
      const dir = (root.team && root.team !== team())
        ? `Raised By <b>${esc(root.team)}</b>`
        : (root.toTeam && root.toTeam !== team() && root.toTeam !== ADMIN_TEAM)
          ? `To <b>${esc(root.toTeam)}</b>`
          : '';
      return (
        `<article class="tmd-item" data-id="${id}" data-state="${dataState(root)}" tabindex="0" role="button" aria-label="View comment details">` +
          `<div class="tmd-card-row">` +
            // LEFT — comment · selected element · raised-by · actions
            `<div class="tmd-card-main">` +
              `<div class="tmd-card-top">` +
                `<div class="tmd-card-title">` +
                  `<p class="tmd-comment">${esc(root.comment)}` +
                    (replies.length ? ` <span class="tmd-n">${replies.length + 1} comments</span>` : '') + `</p>` +
                  (a.snippet
                    ? `<p class="tmd-selel"><span class="tmd-selel-lbl">Selected element:</span> ` +
                      `<span class="tmd-selel-val">“${esc(a.snippet)}” on ` +
                      `<a class="tmd-selel-page" href="${esc(root.page.path)}" target="_blank" rel="noopener">${esc(pageName(root.page.path))}</a></span></p>`
                    : '') +
                `</div>` +
                (dir ? `<p class="tmd-raised">${dir}</p>` : '') +
              `</div>` +
              (root.changeTo ? `<div class="tmd-change"><span>Change to</span><div>${esc(root.changeTo)}</div></div>` : '') +
              ackRow(root) +
              `<div class="tmd-card-actions">` +
                `<a class="tmd-openpin" href="${esc(root.page.path)}?review=1#c=${id}" target="_blank" rel="noopener">Open Pin</a>` +
                `<span class="tmd-detailhint">View details →</span>` +
              `</div>` +
            `</div>` +
            // RIGHT rail — status chip + ticket, then the timestamp
            `<div class="tmd-card-rail">` +
              `<div class="tmd-rail-top">` +
                statusChip(root, isReceiver(root)) +
                (root.ticket ? `<span class="tmd-ticket">#${esc(root.ticket)}</span>` : '') +
              `</div>` +
              `<span class="tmd-card-time">${esc(fmtTimeDate(root.createdAt))}</span>` +
            `</div>` +
          `</div>` +
          repliesHtml +
        `</article>`
      );
    }

    // From-team filter chips — the teams that raised the items in this inbox. "All"
    // (red) clears; a team chip fills with its own identity colour when active.
    function buildTeamChips() {
      const host = $('#tmd-teamchips'); if (!host) return;
      const present = [...new Set(roots().map((c) => c.team).filter(Boolean))]
        .sort((a, b) => TEAMS.indexOf(a) - TEAMS.indexOf(b));
      const one = (label, t) => {
        const active = fromFilter === t;
        let style;
        if (active && t) { const acc = (TEAM_COLORS[t] || [])[1] || 'var(--pk-red)'; style = `background:${acc};color:var(--pk-on-accent);border-color:${acc}`; }
        else if (active) style = 'background:var(--pk-red);color:var(--pk-on-accent);border-color:var(--pk-red)';
        else if (t) { const s = teamStyle(t); style = `background:${s.bg};color:${s.fg};border-color:${s.bd}`; }
        else style = 'background:var(--pk-elev);color:var(--pk-body);border-color:var(--pk-hair)';
        return `<button class="tmd-tchip${active ? ' is-active' : ''}" data-team="${esc(t)}" style="${style}">${esc(label)}</button>`;
      };
      host.hidden = present.length < 2; // only worth showing when items come from ≥2 teams
      host.innerHTML = present.length < 2 ? ''
        : '<span class="tmd-chips-from">From</span>' + one('All Teams', '') + present.map((t) => one(t, t)).join('');
    }

    // ---- comment detail (reviewer, AI prompt, validation, status history) ----
    function renderDetail() {
      const c = roots().find((x) => x.id === entryDetail);
      const host = $('#tmd-list');
      if (!c) { entryDetail = null; return renderComments(); }
      const a = c.anchor || {};
      const where = a.snippet ? '“' + esc(a.snippet) + '”' + (a.tag ? ' · ' + esc(a.tag) : '') : (a.tag ? esc(a.tag) : '—');
      const hist = teamHistory(c);
      const replies = repliesOf(c.id);
      const field = (k, vHtml) => `<div class="tmd-field"><div class="tmd-field-k">${k}</div><div class="tmd-field-v">${vHtml}</div></div>`;
      const timeline = `<ol class="tmd-timeline">` + hist.map((h, i) =>
        `<li class="tmd-tl${i === hist.length - 1 ? ' is-current' : ''}"><span class="tmd-tl-event">${esc(h.label)}</span>` +
        `<span class="tmd-tl-time">${esc(fmt(h.at))}</span></li>`).join('') + `</ol>`;
      const repliesHtml = replies.length
        ? `<div class="tmd-field"><div class="tmd-field-k">Replies</div><div class="tmd-replies">` + replies.map((r) =>
            `<div class="tmd-reply">${teamChip(r.team)}<div class="tmd-rtxt">${esc(r.comment)}</div>` +
            `<div class="tmd-rmeta">${esc(fmt(r.createdAt))}</div></div>`).join('') + `</div></div>`
        : '';
      host.innerHTML =
        `<button class="tmd-back" id="tmd-back">← Back to list</button>` +
        `<article class="tmd-detail">` +
          `<h2 class="tmd-detail-title">${esc(c.comment)}</h2>` +
          `<div class="tmd-detail-chips">${statusChip(c, isReceiver(c))}${c.team ? '<span class="tmd-from">from ' + teamChip(c.team) + '</span>' : ''}` +
            `<a class="tmd-slug" href="${esc(c.page.path)}?review=1#c=${esc(c.id)}" target="_blank" rel="noopener">Open pin</a></div>` +
          `<div class="tmd-fields">` +
            field('Ticket', c.ticket ? `<span class="tmd-ticket">#${esc(c.ticket)}</span>` : '—') +
            field('Page', `<a class="tmd-slug" href="${esc(c.page.path)}" target="_blank" rel="noopener">${esc(pageName(c.page.path))}</a> <span style="color:var(--pk-muted)">${esc(c.page.path)}</span>`) +
            field('Element / anchor', where) +
            field('Raised by', esc(c.name || 'anonymous') + (c.team ? ' · ' + esc(c.team) : '')) +
            field('Submitted', esc(fmt(c.createdAt))) +
            (c.changeTo ? `<div class="tmd-field"><div class="tmd-field-k">Change to</div><div class="tmd-change"><div>${esc(c.changeTo)}</div></div></div>` : '') +
            field('Status', esc(statusLabel(c))) +
            field('Validation', validLine(c)) +
            `<div class="tmd-field"><div class="tmd-field-k">AI change prompt</div>` +
              (c.aiPrompt || c.comment
                ? `<div class="tmd-prompt-box">${esc(localPrompt(c))}</div><button class="tmd-copyprompt" type="button">Copy prompt</button>`
                : `<div class="tmd-field-v" style="color:var(--pk-muted);font-style:italic">Generating…</div>`) + `</div>` +
            `<div class="tmd-field"><div class="tmd-field-k">Status history</div>${timeline}</div>` +
            repliesHtml +
          `</div>` +
        `</article>`;
      $('#tmd-back').addEventListener('click', () => { entryDetail = null; render(); });
      const cp = $('.tmd-copyprompt');
      if (cp) cp.addEventListener('click', () => copyToClip(localPrompt(c), cp, 'Copied ✓'));
    }

    // Shared "By Page" grouping: bucket items by page path (A–Z), each group a titled
    // .tmd-grid. `pathOf` reads the path, `renderItem` renders one item, `meta` (optional)
    // returns the muted sub-label shown beside the page name.
    function groupByPage(items, pathOf, renderItem, meta) {
      const paths = [...new Set(items.map(pathOf))].sort();
      return paths.map((p) => {
        const group = items.filter((it) => pathOf(it) === p);
        return `<div class="tmd-group"><h2 class="tmd-gh">` +
          `<a href="${esc(p)}" target="_blank" rel="noopener">${esc(pageName(p))}</a>` +
          (meta ? `<span>${esc(meta(group))}</span>` : '') +
          `</h2><div class="tmd-grid">${group.map(renderItem).join('')}</div></div>`;
      }).join('');
    }

    function renderComments() {
      const host = $('#tmd-list');
      const controls = $('#tmd-controls');
      // Detail drill-in: hide the list controls, show the single-comment detail.
      if (entryDetail) { if (controls) controls.hidden = true; renderDetail(); return; }
      if (controls) controls.hidden = false;
      buildTeamChips();
      const rs = currentRoots();
      if (byPage) {
        host.innerHTML = groupByPage(rs, (c) => c.page.path, card, (group) => {
          const inProg = group.filter((c) => teamStatusOf(c) === 'in_progress').length;
          const complete = group.filter((c) => teamStatusOf(c) === 'complete').length;
          return `${inProg} in progress · ${complete} complete`;
        });
      } else {
        host.innerHTML = `<div class="tmd-grid">${rs.map(card).join('')}</div>`;
      }
      const emp = $('#tmd-empty');
      emp.hidden = rs.length > 0;
      if (!rs.length) emp.textContent = search ? 'No comments match your search.'
        : (filter !== 'all' || fromFilter) ? 'Nothing in this filter.'
        : 'Nothing directed to your team yet.';
    }

    function noteItem(n) {
      const unread = n.readTeam === false;
      return `<article class="tmd-note${unread ? ' is-unread' : ''}">` +
        `<span class="tmd-note-dot"></span>` +
        `<div class="tmd-note-body">` +
          `<div class="tmd-note-sum">${esc(n.summary || 'Your comment was updated.')}</div>` +
          `<div class="tmd-note-meta">` +
            `<a class="tmd-slug" href="${esc(n.path || '/')}" target="_blank" rel="noopener">${esc(pageName(n.path || '/'))}</a>` +
            `<span class="tmd-time">${esc(fmt(n.createdAt))}</span>` +
            (n.commentId ? `<a class="tmd-openpin" href="${esc(n.path || '/')}?review=1#c=${esc(n.commentId)}" target="_blank" rel="noopener">Open Pin</a>` : '') +
          `</div>` +
        `</div>` +
        `<button class="tmd-note-toggle" type="button" data-id="${esc(n.id)}" data-read="${unread ? '1' : '0'}">` +
          (unread ? 'Mark read' : 'Mark unread') +
        `</button>` +
      `</article>`;
    }

    function sortNotes(ns) {
      const s = ns.slice();
      if (sort === 'old') s.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      else if (sort === 'page') s.sort((a, b) => (a.path || '/').localeCompare(b.path || '/') || (a.createdAt < b.createdAt ? 1 : -1));
      else s.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest
      return s;
    }
    function renderNotes() {
      const host = $('#tmd-notes');
      const list = sortNotes(notes.filter(matchesNoteSearch));
      if (byPage) {
        host.innerHTML = list.length
          ? [...new Set(list.map((n) => n.path || '/'))].sort().map((p) => {
              const group = list.filter((n) => (n.path || '/') === p);
              const unread = group.filter((n) => n.readTeam === false).length;
              return `<div class="tmd-group"><h2 class="tmd-gh">` +
                `<a href="${esc(p)}" target="_blank" rel="noopener">${esc(pageName(p))}</a>` +
                `<span>${group.length} notification${group.length === 1 ? '' : 's'}${unread ? ` · ${unread} unread` : ''}</span>` +
                `</h2><div class="tmd-notes">${group.map(noteItem).join('')}</div></div>`;
            }).join('')
          : '';
      } else {
        host.innerHTML = list.length ? `<div class="tmd-notes">${list.map(noteItem).join('')}</div>` : '';
      }
      const emp = $('#tmd-empty');
      emp.hidden = list.length > 0;
      if (!list.length) emp.textContent = search ? 'No notifications match your search.' : 'No notifications yet.';
    }

    // ---- status-setter popover (receiver sets its own team status) ----
    // A fixed-position menu anchored to the chip, appended to <body> so a card's overflow
    // never clips it (mirrors the admin dashboard's openRowMenu).
    let statusMenuEl = null;
    function closeStatusMenu() {
      if (!statusMenuEl) return;
      statusMenuEl.remove(); statusMenuEl = null;
      document.removeEventListener('click', onStatusMenuDoc, true);
      document.removeEventListener('keydown', onStatusMenuKey, true);
      window.removeEventListener('scroll', closeStatusMenu, true);
      window.removeEventListener('resize', closeStatusMenu);
    }
    function onStatusMenuDoc(e) { if (statusMenuEl && !statusMenuEl.contains(e.target)) closeStatusMenu(); }
    function onStatusMenuKey(e) { if (e.key === 'Escape') closeStatusMenu(); }
    function openStatusMenu(btn, id) {
      closeStatusMenu();
      const rec = roots().find((c) => c.id === id); if (!rec) return;
      const cur = teamStatusOf(rec);
      const menu = document.createElement('div'); menu.className = 'tmd-statusmenu';
      menu.innerHTML = Object.keys(TEAM_STATUS).map((k) => {
        const [cls, label] = TEAM_STATUS[k];
        return `<button type="button" class="tmd-statusmenu-item ${cls}${k === cur ? ' is-current' : ''}" data-val="${k}">` +
          `<span class="tmd-statusmenu-dot"></span>${label}</button>`;
      }).join('');
      document.body.appendChild(menu); statusMenuEl = menu;
      const r = btn.getBoundingClientRect();
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      let left = r.left; if (left + mw > innerWidth - 8) left = innerWidth - mw - 8; if (left < 8) left = 8;
      let top = r.bottom + 6; if (top + mh > innerHeight - 8) top = r.top - mh - 6; if (top < 8) top = 8;
      menu.style.left = left + 'px'; menu.style.top = top + 'px';
      menu.querySelectorAll('.tmd-statusmenu-item').forEach((b) =>
        b.addEventListener('click', () => { const v = b.dataset.val; closeStatusMenu(); setTeamStatus(rec, v); }));
      setTimeout(() => {
        document.addEventListener('click', onStatusMenuDoc, true);
        document.addEventListener('keydown', onStatusMenuKey, true);
        window.addEventListener('scroll', closeStatusMenu, true);
        window.addEventListener('resize', closeStatusMenu);
      }, 0);
    }
    async function setTeamStatus(rec, teamStatus) {
      if (teamStatusOf(rec) === teamStatus) return;
      try { Object.assign(rec, await store.teamStatus(rec, teamStatus)); counts(); render(); }
      catch (e) { alert('Could not update status — ' + e.message); }
    }
    // ---- acknowledgment (raiser concludes / requests a redo) ----
    async function doAck(btn) {
      const rec = roots().find((c) => c.id === btn.dataset.id); if (!rec) return;
      const action = btn.dataset.ack;
      if (action === 'redo' && !confirm('Send this back to ' + (rec.toTeam || 'the team') + ' for a redo?')) return;
      btn.disabled = true;
      try { Object.assign(rec, await store.teamAck(rec, action)); counts(); render(); }
      catch (e) { btn.disabled = false; alert('Could not update — ' + e.message); }
    }

    // ---- Delivery Queue: the receiver's completed items, staged before pushing live ----
    let deliverResult = '';
    function renderDelivery() {
      const host = $('#tmd-view-delivery');
      const staged = deliveryRoots();                                  // canonical set (for the empty check)
      const shown = sortRoots(staged.filter(matchesSearch));           // reshaped by Search + Sort
      const banner = deliverResult ? `<div class="tmd-deploy-banner">${esc(deliverResult)}</div>` : '';
      let body;
      if (!staged.length) {
        body = `<p class="tmd-empty">Nothing staged. Mark items <b>Complete</b> in Team Queue to fill your Delivery Queue.</p>`;
      } else if (!shown.length) {
        body = `<p class="tmd-empty">No staged items match your search.</p>`;
      } else if (byPage) {
        body = groupByPage(shown, (c) => c.page.path, card, (g) => `${g.length} to deliver`);
      } else {
        body = `<div class="tmd-grid">${shown.map(card).join('')}</div>`;
      }
      host.innerHTML = banner + body;
    }
    async function doTeamDeliver() {
      const prim = $('#tmd-primary'); if (!prim || prim.disabled) return;
      if (!confirm('Deploy all completed items now? This delivers them to the teams that raised them.')) return;
      const label = prim.textContent;
      prim.disabled = true; prim.textContent = 'Deploying…';
      try {
        const res = await store.teamDeliver();
        const n = res.delivered || 0;
        deliverResult = `Delivered ${n} item${n === 1 ? '' : 's'} to the raising team${n === 1 ? '' : 's'}.`;
        await loadData(); // refreshes comments + notifs; render() redraws with the banner
      } catch (e) { prim.disabled = false; prim.textContent = label; alert('Deploy failed — ' + e.message); }
    }

    // The shared toolbar (Search · Sort · By Page · primary) sits in the SAME slot for all
    // three tabs; this reconciles the parts that differ per view — the status-filter tabs
    // (Team Queue only), the caption, and the primary button's label / action / enabled-state.
    function syncControls() {
      const filters = $('#tmd-filters');
      const note = $('#tmd-viewnote');
      const prim = $('#tmd-primary');
      const searchEl = $('#tmd-search');
      const inDetail = view === 'comments' && entryDetail;
      filters.hidden = view !== 'comments';                 // status tabs belong to the Team Queue
      if (view !== 'comments') $('#tmd-teamchips').hidden = true;
      if (view === 'comments') {
        searchEl.placeholder = 'Search comments, pages, reviewers…';
        note.hidden = true;
        prim.textContent = 'Clear filters';
        prim.disabled = !(search || filter !== 'all' || fromFilter || byPage || sort !== 'new');
      } else if (view === 'delivery') {
        searchEl.placeholder = 'Search delivery queue…';
        note.hidden = false;
        note.textContent = 'A safety net before pushing live. Deploying delivers these completed items back to the team that raised each one to acknowledge.';
        const n = deliveryRoots().length;
        prim.textContent = n ? 'Deploy ' + n : 'Deploy';
        prim.disabled = n === 0;
      } else { // notifs
        searchEl.placeholder = 'Search notifications…';
        note.hidden = true;
        prim.textContent = 'Mark all read';
        prim.disabled = unreadNotes().length === 0;
      }
      // Hidden alongside the rest of the controls while a single comment is drilled into.
      note.hidden = note.hidden || inDetail;
    }

    function render() {
      $('#tmd-view-comments').hidden = view !== 'comments';
      $('#tmd-view-notifs').hidden = view !== 'notifs';
      $('#tmd-view-delivery').hidden = view !== 'delivery';
      $('#tmd-empty').hidden = true;
      if (view === 'notifs') renderNotes();
      else if (view === 'delivery') renderDelivery();
      else renderComments();
      syncControls();
      renderHeader();
    }

    // Team Queue primary: reset Search, Sort, status filter, From-team and By Page to defaults.
    function clearFilters() {
      search = ''; sort = 'new'; filter = 'all'; fromFilter = ''; byPage = false;
      $('#tmd-search').value = '';
      sortDD.setValue('new');
      $('#tmd-bypage').classList.remove('is-active');
      $('#tmd-filters').querySelectorAll('.tmd-filter').forEach((f) => f.classList.toggle('is-active', f.dataset.filter === 'all'));
      renderComments(); syncControls();
    }

    // Notifications primary: mark every unread item read.
    async function markAllRead() {
      const ids = unreadNotes().map((n) => n.id);
      if (!ids.length) return;
      const prim = $('#tmd-primary'); prim.disabled = true;
      try {
        await store.markRead(ids, true);
        notes.forEach((n) => { if (ids.includes(n.id)) n.readTeam = true; });
        counts(); render();
      } catch (err) { prim.disabled = false; alert('Could not update — ' + err.message); }
    }

    // ---- login (the shared common login — Team + Key) ----
    let login = null;
    function showLogin() {
      if (!login) {
        login = buildPanelLogin({ title: 'Panel Login', sub: 'Enter your key to continue.' });
        const go = () => tryLogin();
        login.button.addEventListener('click', go);
        login.keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      }
      login.setError(''); login.keyInput.value = ''; login.setTeam(team() || '');
      document.body.appendChild(login.el);
      if (team()) login.keyInput.focus(); else login.focusTeam();
    }
    function hideLogin() { login && login.el.remove(); }

    async function tryLogin() {
      const t = login.getTeam();
      const key = login.keyInput.value.trim();
      if (!t) { login.focusTeam(); login.setError('Please choose your team.'); return; }
      if (!key) { login.keyInput.focus(); return; }
      setSession(t, key); // the one shared per-tab session
      login.setBusy(true, 'Authenticating'); login.setError('');
      // ADMIN_TEAM ('Builder') is the admin door → hand off to /reviewdash, UNLESS an
      // admin is opening a specific team's board here (?team=…), which we render inline.
      if (t === ADMIN_TEAM && !OVERRIDE) { location.replace('/reviewdash'); return; }
      // Team: validate the key against the team-scoped read.
      try { await loadData(); hideLogin(); startAutoRefresh(); }
      catch (e) {
        clearSession();
        login.setBusy(false, 'Authenticate');
        login.setError(e.message === 'unauthorized' ? 'Incorrect team or key.' : ('Could not connect — ' + e.message));
        login.keyInput.focus(); login.keyInput.select();
      }
    }

    function init() {
      if (LOCAL) ensureDemoReset(); // demo mode: start clean (clears old demo rows once)
      const s = getSession();
      if (OVERRIDE) mountAdminBar(); // admin is viewing a specific team's board
      // A live admin session (Builder) → straight to the admin panel, UNLESS viewing a
      // specific team's board (?team=…), which loads below with the admin key.
      if (s.key && s.team === ADMIN_TEAM && !OVERRIDE) { location.replace('/reviewdash'); return; }
      // A team session (or an admin viewing a team) → load it; else ask to log in once.
      if (s.key && (s.team || OVERRIDE)) {
        loadData().then(startAutoRefresh).catch((e) => {
          if (e.message === 'unauthorized') { clearSession(); showLogin(); }
          else { $('#tmd-empty').hidden = false; $('#tmd-empty').textContent = 'Could not load — ' + e.message; }
        });
      } else showLogin();
    }

    // ---- events ----
    $('.tmd-side').addEventListener('click', (e) => {
      const b = e.target.closest('.tmd-nav'); if (!b) return;
      view = b.dataset.view; entryDetail = null;
      deliverResult = ''; // the delivery banner only shows right after a deploy
      document.querySelectorAll('.tmd-nav').forEach((n) => n.classList.toggle('is-active', n === b));
      render();
    });
    // Chip status-setter + acknowledgment buttons (delegated across both card containers).
    $('.tmd-content').addEventListener('click', (e) => {
      const setBtn = e.target.closest('[data-setstatus]');
      if (setBtn) { e.stopPropagation(); openStatusMenu(setBtn, setBtn.dataset.setstatus); return; }
      const ackBtn = e.target.closest('[data-ack]');
      if (ackBtn) { e.stopPropagation(); doAck(ackBtn); return; }
    });
    $('#tmd-filters').addEventListener('click', (e) => {
      const b = e.target.closest('.tmd-filter'); if (!b) return;
      filter = b.dataset.filter; entryDetail = null;
      $('#tmd-filters').querySelectorAll('.tmd-filter').forEach((f) => f.classList.toggle('is-active', f === b));
      renderComments(); syncControls();
    });
    // By Page — shared across all three tabs (groups the active view by page).
    $('#tmd-bypage').addEventListener('click', (e) => {
      byPage = !byPage; entryDetail = null;
      e.currentTarget.classList.toggle('is-active', byPage);
      render();
    });
    // Primary button — one slot, one action per tab.
    $('#tmd-primary').addEventListener('click', () => {
      if (view === 'comments') clearFilters();
      else if (view === 'delivery') doTeamDeliver();
      else markAllRead();
    });
    // Open a comment's full detail (click/Enter a card; links inside pass through).
    $('#tmd-list').addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const item = e.target.closest('.tmd-item[data-id]'); if (!item) return;
      entryDetail = item.dataset.id; renderComments();
    });
    $('#tmd-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest && e.target.closest('.tmd-item[data-id]'); if (!item) return;
      e.preventDefault(); entryDetail = item.dataset.id; renderComments();
    });
    // Search across the active view (comments · delivery · notifications).
    $('#tmd-search').addEventListener('input', (e) => { search = e.target.value.trim(); entryDetail = null; render(); });
    // From-team filter chips.
    $('#tmd-teamchips').addEventListener('click', (e) => {
      const b = e.target.closest('.tmd-tchip'); if (!b) return;
      fromFilter = b.dataset.team; entryDetail = null; renderComments();
    });
    // Sort — the shared custom dropdown.
    const sortDD = buildDropdown({
      small: true, value: sort,
      items: [
        { value: 'new', label: 'Newest first' },
        { value: 'old', label: 'Oldest first' },
        { value: 'page', label: 'Page A–Z' },
      ],
      onSelect: (v) => { sort = v; entryDetail = null; render(); },
    });
    $('#tmd-sort-mount').appendChild(sortDD.el);
    // Admin can push a global theme (SSE); repaint so JS-inlined chip colours re-derive.
    document.addEventListener('pk:themechange', () => { try { render(); } catch (e) {} });
    // Per-item read/unread toggle. data-read="1" = currently unread ⇒ mark read; "0" ⇒ mark unread.
    $('#tmd-notes').addEventListener('click', async (e) => {
      const b = e.target.closest('.tmd-note-toggle'); if (!b) return;
      const id = b.dataset.id;
      const read = b.dataset.read === '1';
      b.disabled = true;
      try {
        await store.markRead([id], read);
        const n = notes.find((x) => x.id === id);
        if (n) n.readTeam = read;
        counts(); render();
      } catch (err) { b.disabled = false; alert('Could not update — ' + err.message); }
    });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    $('#tmd-refresh').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (btn.classList.contains('is-refreshing')) return;
      btn.classList.add('is-refreshing');
      const t0 = Date.now();
      try { await loadData(); await wait(Math.max(0, 550 - (Date.now() - t0))); }
      catch (err) { alert('Could not refresh — ' + err.message); }
      finally { btn.classList.remove('is-refreshing'); }
    });

    // Admin-view ribbon: shown when Builder is viewing a specific team's board. Makes
    // the impersonation explicit and offers a one-click way back to the admin panel.
    function mountAdminBar() {
      const app = $('.tmd-app'); if (!app || $('#tmd-adminbar')) return;
      const bar = document.createElement('div');
      bar.className = 'tmd-adminbar'; bar.id = 'tmd-adminbar';
      bar.innerHTML = `<span class="tmd-adminbar-txt">Admin view — <b>${esc(OVERRIDE)}</b> team board (full access)</span>` +
        `<a class="tmd-adminbar-back" href="/reviewdash">← Back to admin</a>`;
      app.prepend(bar);
      const foot = $('.tmd-foot'); if (foot) foot.hidden = true; // no "upgrade to admin" while already admin
    }

    // "Upgrade access to admin" — drop this team session and go to the admin door
    // (/reviewdash), where the user can sign in as Builder (admin, access to everything).
    const upgrade = $('#tmd-upgrade');
    if (upgrade) upgrade.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      location.href = '/reviewdash?login=builder'; // prefill the login's Team to Builder
    });

    init();
  })();
