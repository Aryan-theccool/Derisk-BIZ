/* ═══════════════════════════════════════════════════════════
   DeRisk.biz — Admin Dashboard logic
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* ─────────── Auth state ─────────── */
  const TOKEN_KEY = 'derisk_admin_token';
  let TOKEN = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';

  /* ─────────── Data state ─────────── */
  let submissions = [];
  let contacts = [];
  let stats = null;
  let pendingDelete = null; // { type, id, label }

  const toast = $('#toast');
  function showToast(msg, ms = 3000) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), ms);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function riskPill(level) {
    if (!level) return '<span class="pill neutral">—</span>';
    const cls = level.startsWith('Low') ? 'low' : level.startsWith('Moderate') ? 'med' : 'high';
    return `<span class="pill ${cls}">${esc(level)}</span>`;
  }

  /* ─────────── API helper ─────────── */
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN, ...(opts.headers || {}) },
    });
    if (res.status === 401) {
      logout(true);
      throw new Error('Unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  /* ─────────── Login flow ─────────── */
  const loginWrap = $('#loginWrap');
  const dash = $('#dash');

  $('#toggleToken').addEventListener('click', () => {
    const inp = $('#tokenInput');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#loginMsg');
    const btn = $('#loginBtn');
    msg.className = 'form-msg';
    const token = $('#tokenInput').value.trim();
    if (!token) { msg.textContent = 'Please enter the admin token.'; msg.classList.add('err'); return; }

    btn.disabled = true; btn.textContent = 'Verifying…';
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        TOKEN = token;
        sessionStorage.setItem(TOKEN_KEY, token);
        if ($('#rememberToken').checked) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
        enterDash();
      } else {
        msg.textContent = data.error || 'Invalid admin token.';
        msg.classList.add('err');
      }
    } catch {
      msg.textContent = 'Network error — is the server running?';
      msg.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = '🔐 Sign In';
    }
  });

  function logout(expired = false) {
    TOKEN = '';
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    dash.classList.add('hidden');
    loginWrap.classList.remove('hidden');
    if (expired) {
      const msg = $('#loginMsg');
      msg.textContent = 'Session expired or token invalid — please sign in again.';
      msg.className = 'form-msg err';
    }
  }
  $('#logoutBtn').addEventListener('click', () => logout(false));

  async function enterDash() {
    loginWrap.classList.add('hidden');
    dash.classList.remove('hidden');
    await refreshAll();
  }

  /* ─────────── Data loading ─────────── */
  async function refreshAll() {
    try {
      const [s, c, st] = await Promise.all([
        api('/api/admin/submissions'),
        api('/api/admin/contacts'),
        api('/api/admin/stats'),
      ]);
      submissions = s.data || [];
      contacts = c.data || [];
      stats = st.data || null;
      renderAll();
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('⚠ ' + err.message);
    }
  }
  $('#refreshBtn').addEventListener('click', async () => {
    await refreshAll();
    showToast('🔄 Data refreshed');
  });

  function renderAll() {
    $('#pillSubs').textContent = submissions.length;
    $('#pillContacts').textContent = contacts.length;
    if (stats) $('#storageChip').textContent = '🗄 ' + stats.storage;
    renderOverview();
    renderSubmissions();
    renderContacts();
    renderSettings();
  }

  /* ─────────── Overview ─────────── */
  function renderOverview() {
    if (!stats) return;
    const cards = [
      { ic: '📋', v: stats.submissions, l: 'Total submissions' },
      { ic: '🔥', v: stats.last7Days, l: 'Last 7 days' },
      { ic: '📨', v: stats.contacts, l: 'Contact messages' },
      { ic: '🎁', v: stats.consultRequests, l: 'Consultation requests' },
      { ic: '🧭', v: stats.govCompleted, l: 'Governance survey done' },
      { ic: '⚖️', v: stats.legalCompleted, l: 'Legal-AI survey done' },
    ];
    $('#statGrid').innerHTML = cards.map(
      (c) => `<div class="stat-card"><span class="ic">${c.ic}</span><b>${c.v}</b><span>${c.l}</span></div>`
    ).join('');

    /* bar chart — last 14 days */
    const max = Math.max(1, ...stats.perDay.map((d) => d.count));
    $('#barChart').innerHTML = stats.perDay.map((d) => {
      const h = Math.round((d.count / max) * 100);
      const lbl = d.date.slice(5).replace('-', '/');
      return `<div class="bar-col" title="${d.date}: ${d.count}">
        <span class="bar-val">${d.count || ''}</span>
        <div class="bar" style="height:${Math.max(3, h)}%"></div>
        <span class="bar-label">${lbl}</span>
      </div>`;
    }).join('');

    /* risk distribution */
    const rc = stats.riskCounts;
    const total = Math.max(1, rc['Low Vulnerability'] + rc['Moderate Vulnerability'] + rc['High Vulnerability']);
    const rows = [
      ['Low', rc['Low Vulnerability'], 'low'],
      ['Moderate', rc['Moderate Vulnerability'], 'med'],
      ['High', rc['High Vulnerability'], 'high'],
    ];
    $('#riskBars').innerHTML = rows.map(
      ([lbl, n, cls]) => `<div class="risk-row"><span class="lbl">${lbl}</span><div class="risk-track"><div class="risk-fill ${cls}" style="width:${Math.round((n / total) * 100)}%"></div></div><span class="num">${n}</span></div>`
    ).join('');
    $('#avgScore').innerHTML = `Average best-answer score across completed surveys: <b>${stats.avgScorePct}%</b>`;

    /* recent activity */
    const recent = [
      ...submissions.map((s) => ({ t: 'Submission', when: s.createdAt, who: s.email, extra: overallRisk(s), id: s._id, kind: 'sub' })),
      ...contacts.map((c) => ({ t: 'Contact', when: c.createdAt, who: c.email, extra: c.wantsConsultation ? '<span class="pill yes">🎁 Consultation</span>' : '<span class="pill neutral">Message</span>', id: c._id, kind: 'con' })),
    ].sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0)).slice(0, 8);

    $('#recentTable').innerHTML = `
      <thead><tr><th>Type</th><th>Who</th><th>Detail</th><th>When</th></tr></thead>
      <tbody>${recent.length ? recent.map(
        (r) => `<tr data-kind="${r.kind}" data-id="${esc(r.id)}"><td>${r.t === 'Submission' ? '📋' : '📨'} ${r.t}</td><td class="email-cell">${esc(r.who)}</td><td>${r.extra}</td><td class="muted">${fmtDate(r.when)}</td></tr>`
      ).join('') : '<tr><td colspan="4" class="muted" style="text-align:center;padding:1.6rem">No activity yet</td></tr>'}</tbody>`;

    $('#recentTable').querySelectorAll('tbody tr[data-id]').forEach((tr) => {
      tr.addEventListener('click', () => {
        const { kind, id } = tr.dataset;
        if (kind === 'sub') { switchView('submissions'); openSubmission(id); }
        else { switchView('contacts'); openContact(id); }
      });
    });
  }

  function overallRisk(s) {
    const g = s.surveys?.governance, l = s.surveys?.legalVsEnterprise;
    const score = (g?.completed ? g.score : 0) + (l?.completed ? l.score : 0);
    const max = (g?.completed ? g.maxScore : 0) + (l?.completed ? l.maxScore : 0);
    if (!max) return '<span class="pill neutral">—</span>';
    const pct = (score / max) * 100;
    const level = pct >= 80 ? 'Low Vulnerability' : pct >= 50 ? 'Moderate Vulnerability' : 'High Vulnerability';
    return riskPill(level);
  }

  /* ─────────── Submissions view ─────────── */
  function subMatchesFilter(s) {
    const q = $('#subSearch').value.trim().toLowerCase();
    const f = $('#subFilter').value;
    const txt = `${s.email} ${s.name || ''} ${s.company || ''}`.toLowerCase();
    if (q && !txt.includes(q)) return false;
    if (f !== 'all') {
      const levels = [s.surveys?.governance?.riskLevel, s.surveys?.legalVsEnterprise?.riskLevel].filter(Boolean);
      if (!levels.includes(f)) return false;
    }
    return true;
  }

  function renderSubmissions() {
    const list = submissions.filter(subMatchesFilter);
    $('#subsEmpty').classList.toggle('hidden', list.length > 0);
    $('#subsTable').innerHTML = list.length ? `
      <thead><tr><th>Email</th><th>Name / Company</th><th>Governance</th><th>Legal-AI</th><th>Date</th><th></th></tr></thead>
      <tbody>${list.map((s) => {
        const g = s.surveys?.governance, l = s.surveys?.legalVsEnterprise;
        return `<tr data-id="${esc(s._id)}">
          <td class="email-cell">${esc(s.email)}</td>
          <td>${esc(s.name || '—')}<div class="muted">${esc(s.company || '')}</div></td>
          <td>${g?.completed ? `${g.score}/${g.maxScore}<br>${riskPill(g.riskLevel)}` : '<span class="pill neutral">Not taken</span>'}</td>
          <td>${l?.completed ? `${l.score}/${l.maxScore}<br>${riskPill(l.riskLevel)}` : '<span class="pill neutral">Not taken</span>'}</td>
          <td class="muted">${fmtDate(s.createdAt)}</td>
          <td class="actions">
            <button class="icon-btn" data-act="view" title="View details">👁</button>
            <button class="icon-btn del" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join('')}</tbody>` : '';

    $('#subsTable').querySelectorAll('tbody tr').forEach((tr) => {
      const id = tr.dataset.id;
      tr.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'del') {
          const s = submissions.find((x) => String(x._id) === id);
          confirmDelete('submissions', id, s ? s.email : 'this submission');
        } else {
          openSubmission(id);
        }
      });
    });
  }
  $('#subSearch').addEventListener('input', renderSubmissions);
  $('#subFilter').addEventListener('change', renderSubmissions);

  function openSubmission(id) {
    const s = submissions.find((x) => String(x._id) === String(id));
    if (!s) return;
    const g = s.surveys?.governance, l = s.surveys?.legalVsEnterprise;

    const ansBlock = (arr) => (arr || []).map((a) => {
      const best = a.isBest === true ? ' best' : a.isBest === false ? ' notbest' : '';
      const flag = a.isBest === true ? '<span class="ans-flag ok">✔ best answer</span>' : a.isBest === false ? '<span class="ans-flag no">✘ not best</span>' : '';
      const ansTxt = Array.isArray(a.answer) ? a.answer.join(', ') : a.answer;
      return `<div class="ans-item${best}"><div class="q">${esc(a.question)}</div><div class="a">${esc(ansTxt)}${flag}</div></div>`;
    }).join('') || '<p class="muted">—</p>';

    $('#drawerTitle').textContent = '📋 Submission — ' + s.email;
    $('#drawerBody').innerHTML = `
      <div class="kv">
        <div class="kv-row"><b>Email</b><span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></span></div>
        <div class="kv-row"><b>Name</b><span>${esc(s.name || '—')}</span></div>
        <div class="kv-row"><b>Company</b><span>${esc(s.company || '—')}</span></div>
        <div class="kv-row"><b>Submitted</b><span>${fmtDate(s.createdAt)}</span></div>
        <div class="kv-row"><b>Time taken</b><span>${s.meta?.durationSeconds ? Math.round(s.meta.durationSeconds / 60) + ' min ' + (s.meta.durationSeconds % 60) + ' s' : '—'}</span></div>
        <div class="kv-row"><b>Overall</b><span>${overallRisk(s)}</span></div>
      </div>
      ${g?.completed ? `
        <div class="drawer-section">
          <h4>Governance Vulnerability — ${g.score}/${g.maxScore} ${riskPill(g.riskLevel)}</h4>
          <h4 style="border:none;margin-bottom:0.4rem">Context</h4>${ansBlock(g.context)}
          <h4 style="border:none;margin:0.8rem 0 0.4rem">Scenarios</h4>${ansBlock(g.scenarios)}
        </div>` : ''}
      ${l?.completed ? `
        <div class="drawer-section">
          <h4>Legal AI vs Enterprise Risk AI — ${l.score}/${l.maxScore} ${riskPill(l.riskLevel)}</h4>
          ${ansBlock(l.scenarios)}
        </div>` : ''}
      <div class="drawer-section btn-row">
        <a class="btn btn-ghost btn-sm" href="mailto:${esc(s.email)}?subject=DeRisk.biz%20—%20Your%20Governance%20Assessment">✉ Reply by email</a>
        <button class="btn btn-danger btn-sm" id="drawerDelete">🗑 Delete submission</button>
      </div>`;
    openDrawer();
    $('#drawerDelete').addEventListener('click', () => { closeDrawer(); confirmDelete('submissions', s._id, s.email); });
  }

  /* ─────────── Contacts view ─────────── */
  function conMatchesFilter(c) {
    const q = $('#conSearch').value.trim().toLowerCase();
    const f = $('#conFilter').value;
    const txt = `${c.name} ${c.email} ${c.company || ''} ${c.message || ''}`.toLowerCase();
    if (q && !txt.includes(q)) return false;
    if (f === 'consult' && !c.wantsConsultation) return false;
    if (f === 'no-consult' && c.wantsConsultation) return false;
    return true;
  }

  function renderContacts() {
    const list = contacts.filter(conMatchesFilter);
    $('#contactsEmpty').classList.toggle('hidden', list.length > 0);
    $('#contactsTable').innerHTML = list.length ? `
      <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Consultation</th><th>Date</th><th></th></tr></thead>
      <tbody>${list.map((c) => `
        <tr data-id="${esc(c._id)}">
          <td><b>${esc(c.name)}</b></td>
          <td class="email-cell">${esc(c.email)}</td>
          <td>${esc(c.company || '—')}</td>
          <td>${c.wantsConsultation ? '<span class="pill yes">🎁 Yes</span>' : '<span class="pill neutral">No</span>'}</td>
          <td class="muted">${fmtDate(c.createdAt)}</td>
          <td class="actions">
            <button class="icon-btn" data-act="view" title="View">👁</button>
            <button class="icon-btn del" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`).join('')}</tbody>` : '';

    $('#contactsTable').querySelectorAll('tbody tr').forEach((tr) => {
      const id = tr.dataset.id;
      tr.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'del') {
          const c = contacts.find((x) => String(x._id) === id);
          confirmDelete('contacts', id, c ? c.email : 'this contact');
        } else {
          openContact(id);
        }
      });
    });
  }
  $('#conSearch').addEventListener('input', renderContacts);
  $('#conFilter').addEventListener('change', renderContacts);

  function openContact(id) {
    const c = contacts.find((x) => String(x._id) === String(id));
    if (!c) return;
    $('#drawerTitle').textContent = '📨 Contact — ' + c.name;
    $('#drawerBody').innerHTML = `
      <div class="kv">
        <div class="kv-row"><b>Name</b><span>${esc(c.name)}</span></div>
        <div class="kv-row"><b>Email</b><span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></div>
        <div class="kv-row"><b>Company</b><span>${esc(c.company || '—')}</span></div>
        <div class="kv-row"><b>Consultation</b><span>${c.wantsConsultation ? '🎁 Wants the FREE 30-min CXO session' : 'No'}</span></div>
        <div class="kv-row"><b>Received</b><span>${fmtDate(c.createdAt)}</span></div>
      </div>
      <div class="drawer-section">
        <h4>Message</h4>
        <div class="msg-quote">${esc(c.message || '(no message)')}</div>
      </div>
      <div class="drawer-section btn-row">
        <a class="btn btn-ghost btn-sm" href="mailto:${esc(c.email)}?subject=Re:%20Your%20DeRisk.biz%20enquiry">✉ Reply by email</a>
        <button class="btn btn-danger btn-sm" id="drawerDelete">🗑 Delete contact</button>
      </div>`;
    openDrawer();
    $('#drawerDelete').addEventListener('click', () => { closeDrawer(); confirmDelete('contacts', c._id, c.email); });
  }

  /* ─────────── Settings ─────────── */
  function renderSettings() {
    if (!stats) return;
    $('#settingsInfo').innerHTML = `
      <div class="kv-row"><b>Storage backend</b><span>${esc(stats.storage)}</span></div>
      <div class="kv-row"><b>Total submissions</b><span>${stats.submissions}</span></div>
      <div class="kv-row"><b>Total contacts</b><span>${stats.contacts}</span></div>
      <div class="kv-row"><b>Avg score</b><span>${stats.avgScorePct}% best answers</span></div>
      <div class="kv-row"><b>Site contact</b><span><a href="mailto:info@derisk.biz">info@derisk.biz</a></span></div>`;
  }

  /* ─────────── CSV export (with auth header) ─────────── */
  async function exportCsv(type) {
    try {
      const res = await fetch(`/api/admin/export/${type}`, { headers: { 'X-Admin-Token': TOKEN } });
      if (res.status === 401) return logout(true);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `derisk-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`⬇ ${type} exported as CSV`);
    } catch (e) {
      showToast('⚠ ' + e.message);
    }
  }
  $('#exportSubs').addEventListener('click', () => exportCsv('submissions'));
  $('#exportSubs2').addEventListener('click', () => exportCsv('submissions'));
  $('#exportContacts').addEventListener('click', () => exportCsv('contacts'));
  $('#exportContacts2').addEventListener('click', () => exportCsv('contacts'));

  /* ─────────── Delete flow ─────────── */
  const modalOverlay = $('#modalOverlay');
  function confirmDelete(type, id, label) {
    pendingDelete = { type, id };
    $('#modalText').textContent = `You're about to permanently delete the record for "${label}". This action cannot be undone.`;
    modalOverlay.classList.remove('hidden');
  }
  $('#modalCancel').addEventListener('click', () => { pendingDelete = null; modalOverlay.classList.add('hidden'); });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { pendingDelete = null; modalOverlay.classList.add('hidden'); } });
  $('#modalConfirm').addEventListener('click', async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    modalOverlay.classList.add('hidden');
    try {
      await api(`/api/admin/${type}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('🗑 Record deleted');
      await refreshAll();
    } catch (e) {
      if (e.message !== 'Unauthorized') showToast('⚠ ' + e.message);
    }
    pendingDelete = null;
  });

  /* ─────────── Drawer ─────────── */
  const drawer = $('#drawer');
  const drawerOverlay = $('#drawerOverlay');
  function openDrawer() { drawer.classList.remove('hidden'); drawerOverlay.classList.remove('hidden'); }
  function closeDrawer() { drawer.classList.add('hidden'); drawerOverlay.classList.add('hidden'); }
  $('#drawerClose').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); modalOverlay.classList.add('hidden'); } });

  /* ─────────── View switching ─────────── */
  const titles = { overview: 'Overview', submissions: 'Submissions', contacts: 'Contacts', settings: 'Settings' };
  function switchView(view) {
    $$('.view').forEach((v) => v.classList.add('hidden'));
    $(`#view-${view}`).classList.remove('hidden');
    $$('.side-link[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    $('#viewTitle').textContent = titles[view];
    $('#sidebar').classList.remove('open');
  }
  $$('.side-link[data-view]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  /* ─────────── Auto refresh every 60s while dashboard open ─────────── */
  setInterval(() => { if (!dash.classList.contains('hidden')) refreshAll(); }, 60000);

  /* ─────────── Boot ─────────── */
  (async () => {
    if (!TOKEN) return;
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN }),
      });
      if (res.ok) enterDash();
      else logout(false);
    } catch { /* stay on login */ }
  })();
})();
