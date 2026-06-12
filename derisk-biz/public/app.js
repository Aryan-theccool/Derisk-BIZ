/* ═══════════════════════════════════════════════════════════
   DeRisk.biz — Frontend logic
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const startTime = Date.now();

  /* ─────────── News Ticker Web Component ─────────── */
  class NewsTicker extends HTMLElement {
    connectedCallback() {
      const isReverse = this.hasAttribute('reverse');
      const badgeText = this.getAttribute('badge') || '⚠ AI RISK NEWS';

      this.className = `ticker ${isReverse ? 'ticker-bottom' : 'ticker-top'}`;
      this.setAttribute('aria-label', `Breaking news ticker ${isReverse ? 'bottom' : 'top'}`);

      const itemsHtml = NEWS_TICKERS.map(
        (n) =>
          `<a class="ticker-item" href="${n.url}" target="_blank" rel="noopener noreferrer"><span class="dot">●</span><span class="ticker-text">${n.text}</span></a>`
      ).join('');

      this.innerHTML = `
        <span class="ticker-badge">${badgeText}</span>
        <div class="ticker-viewport">
          <div class="ticker-track">
            ${itemsHtml}
          </div>
        </div>
      `;

      const track = this.querySelector('.ticker-track');
      const items = Array.from(track.querySelectorAll('.ticker-item'));
      if (items.length === 0) return;

      // Clone the first item to the end for seamless looping
      const firstClone = items[0].cloneNode(true);
      track.appendChild(firstClone);

      const totalItems = items.length;
      let currentIndex = 0;
      let timer = null;

      const slideNext = () => {
        currentIndex++;
        track.style.transition = 'transform 0.5s ease-in-out';
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        if (currentIndex === totalItems) {
          // After transition ends, snap back to index 0 with transition disabled
          setTimeout(() => {
            track.style.transition = 'none';
            currentIndex = 0;
            track.style.transform = 'translateX(0)';
          }, 500); // must match the 0.5s transition duration
        }
      };

      const startTimer = () => {
        if (!timer) {
          timer = setInterval(slideNext, 3000);
        }
      };

      const stopTimer = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };

      // Set initial transition styles
      track.style.transition = 'transform 0.5s ease-in-out';
      track.style.transform = 'translateX(0)';

      startTimer();

      // Pause animation on hover
      this.addEventListener('mouseenter', stopTimer);
      this.addEventListener('mouseleave', startTimer);
    }
  }
  customElements.define('news-ticker', NewsTicker);

  /* Footer news links */
  $('#footerNews').innerHTML = NEWS_TICKERS.map(
    (n) => `<a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.text}</a>`
  ).join('');

  /* ─────────── Why cards ─────────── */
  const WHY = [
    { ic: '🛰️', h: 'Early Warning, Not Post-Mortems', p: 'Flag risk patterns before notices arrive, whistleblower allegations escalate, or lender pressure builds — by connecting legal, finance, contracts, compliance and management behaviour.' },
    { ic: '🔐', h: 'Private, Inside Your Network', p: 'A private AI environment operating within company-controlled infrastructure — no privileged legal reasoning or board-sensitive data leaves your perimeter.' },
    { ic: '🧩', h: 'Triangulate Fragmented Data', p: 'Regulators triangulate GST, income-tax, customs, banking and vendor data. DeRisk connects your legal, finance, tax, HR, compliance and operational data first.' },
    { ic: '📡', h: 'Continuous Intelligence', p: 'Real-time monitoring of regulators, journalists, competitors and social media — actionable alerts reach your Board the same day, not next quarter.' },
    { ic: '📊', h: 'Decision-Ready, CXO-Grade', p: 'One place that answers: what is the issue, where is the exposure, which contracts are implicated, what are the financial consequences, what actions to prioritise.' },
    { ic: '💰', h: 'Measurable ROI', p: 'Faster decisions, reduced external advisory spend, shorter turnaround times, fewer confidentiality leaks — outcomes a CFO can measure, not AI theatre.' },
  ];
  $('#whyCards').innerHTML = WHY.map(
    (c) => `<article class="card"><div class="ic">${c.ic}</div><h3>${c.h}</h3><p>${c.p}</p></article>`
  ).join('');

  /* ─────────── Survey state ─────────── */
  const state = {
    activeSurvey: null, // 'governance' | 'legal'
    stepIndex: 0,
    answers: { governance: {}, legal: {} }, // questionId -> {choice, other, multi:[]}
    completed: { governance: false, legal: false },
    results: { governance: null, legal: null },
    submitted: false,
  };

  /* Build unified step lists */
  const GOV_STEPS = [
    ...CONTEXT_QUESTIONS.map((q) => ({ kind: 'context', q })),
    ...GOVERNANCE_SCENARIOS.map((q) => ({ kind: 'scenario', q })),
  ];
  const LEGAL_STEPS = LEGAL_VS_ENTERPRISE_SCENARIOS.map((q) => ({ kind: 'scenario', q }));
  const steps = () => (state.activeSurvey === 'governance' ? GOV_STEPS : LEGAL_STEPS);

  /* ─────────── DOM refs ─────────── */
  const surveyPick = $('#surveyPick');
  const runner = $('#runner');
  const qCard = $('#qCard');
  const progressBar = $('#progressBar');
  const progressLabel = $('#progressLabel');
  const runnerTitle = $('#runnerTitle');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const completePanel = $('#completePanel');
  const emailGate = $('#emailGate');
  const resultsPanel = $('#resultsPanel');
  const toast = $('#toast');

  function showToast(msg, ms = 3200) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), ms);
  }

  function scrollToSurvey() {
    $('#survey').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─────────── Render question ─────────── */
  function letter(i) { return String.fromCharCode(65 + i); }

  function renderStep() {
    const list = steps();
    const step = list[state.stepIndex];
    const q = step.q;
    const saved = state.answers[state.activeSurvey][q.id] || {};

    progressBar.style.width = `${((state.stepIndex) / list.length) * 100}%`;
    progressLabel.textContent = `Question ${state.stepIndex + 1} of ${list.length}`;
    runnerTitle.textContent = state.activeSurvey === 'governance'
      ? 'Governance Vulnerability Assessment'
      : 'Legal AI vs Enterprise Risk AI';

    let html = '';
    if (step.kind === 'scenario') {
      html += `<div class="q-scn-title">${q.title}</div>`;
      html += `<p class="q-scenario">${q.scenario}</p>`;
      html += `<p class="q-question">${q.question}</p>`;
      html += `<div class="q-options">`;
      const isAnswered = saved.checked === true;
      q.options.forEach((opt, i) => {
        let optClass = '';
        if (isAnswered) {
          if (i === q.best) {
            optClass = 'correct disabled';
          } else if (saved.choice === i) {
            optClass = 'incorrect disabled';
          } else {
            optClass = 'disabled';
          }
        } else if (saved.choice === i) {
          optClass = 'selected';
        }
        const checked = saved.choice === i ? 'checked' : '';
        const disabled = isAnswered ? 'disabled' : '';
        html += `<label class="opt ${optClass}"><input type="radio" name="opt" value="${i}" ${checked} ${disabled}/><span class="opt-letter">${letter(i)}.</span><span>${opt}</span></label>`;
      });
      html += `</div>`;
      if (isAnswered) {
        const isCorrect = saved.choice === q.best;
        if (isCorrect) {
          html += `<div class="q-feedback correct">Correct!</div>`;
        } else {
          html += `<div class="q-feedback incorrect">Incorrect. The correct answer is: <strong>${letter(q.best)}. ${q.options[q.best]}</strong></div>`;
        }
      }
    } else {
      // context question (single / multi, optional "other")
      html += `<div class="q-scn-title">Section 1 — Context Setting</div>`;
      html += `<p class="q-question">${q.question}</p>`;
      html += `<div class="q-options">`;
      const type = q.type === 'multi' ? 'checkbox' : 'radio';
      q.options.forEach((opt, i) => {
        const isSel = q.type === 'multi' ? (saved.multi || []).includes(opt) : saved.choice === i;
        html += `<label class="opt ${isSel ? 'selected' : ''}"><input type="${type}" name="opt" value="${i}" ${isSel ? 'checked' : ''}/><span>${opt}</span></label>`;
      });
      if (q.other) {
        const otherSel = saved.choice === 'other' || (q.type === 'multi' && saved.otherChecked);
        html += `<label class="opt ${otherSel ? 'selected' : ''}"><input type="${type}" name="opt" value="other" ${otherSel ? 'checked' : ''}/><span>${q.other}</span></label>`;
        html += `<input type="text" class="other-input ${otherSel ? '' : 'hidden'}" id="otherText" placeholder="Please specify…" maxlength="200" value="${saved.other ? String(saved.other).replace(/"/g, '&quot;') : ''}"/>`;
      }
      html += `</div>`;
    }
    qCard.innerHTML = html;

    /* interactions */
    qCard.querySelectorAll('input[name="opt"]').forEach((inp) => {
      inp.addEventListener('change', () => {
        const list2 = steps();
        const st = list2[state.stepIndex];
        const qq = st.q;
        const store = state.answers[state.activeSurvey];
        if (st.kind === 'scenario' || qq.type !== 'multi') {
          const val = inp.value === 'other' ? 'other' : Number(inp.value);
          store[qq.id] = { ...(store[qq.id] || {}), choice: val };
          if (st.kind === 'scenario') {
            qCard.querySelectorAll('.opt').forEach((o) => o.classList.remove('selected'));
            inp.closest('.opt').classList.add('selected');
            return;
          }
          qCard.querySelectorAll('.opt').forEach((o) => o.classList.remove('selected'));
          inp.closest('.opt').classList.add('selected');
        } else {
          const cur = store[qq.id] || { multi: [], otherChecked: false, other: '' };
          if (inp.value === 'other') {
            cur.otherChecked = inp.checked;
          } else {
            const optText = qq.options[Number(inp.value)];
            cur.multi = cur.multi || [];
            if (inp.checked) { if (!cur.multi.includes(optText)) cur.multi.push(optText); }
            else cur.multi = cur.multi.filter((x) => x !== optText);
          }
          store[qq.id] = cur;
          inp.closest('.opt').classList.toggle('selected', inp.checked);
        }
        const otherText = qCard.querySelector('#otherText');
        if (otherText) {
          const show = (store[qq.id].choice === 'other') || store[qq.id].otherChecked;
          otherText.classList.toggle('hidden', !show);
          if (show) otherText.focus();
        }
      });
    });
    const otherText = qCard.querySelector('#otherText');
    if (otherText) {
      otherText.addEventListener('input', () => {
        const qq = steps()[state.stepIndex].q;
        const store = state.answers[state.activeSurvey];
        store[qq.id] = { ...(store[qq.id] || {}), other: otherText.value };
      });
    }

    prevBtn.style.visibility = state.stepIndex === 0 ? 'hidden' : 'visible';
    const isLast = state.stepIndex === list.length - 1;
    if (isLast && (step.kind !== 'scenario' || saved.checked)) {
      nextBtn.textContent = 'Finish ✓';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }

  function validateCurrent() {
    const st = steps()[state.stepIndex];
    const a = state.answers[state.activeSurvey][st.q.id];
    if (!a) return false;
    if (st.kind === 'scenario') return typeof a.choice === 'number';
    if (st.q.type === 'multi') return (a.multi && a.multi.length > 0) || (a.otherChecked && a.other && a.other.trim());
    if (a.choice === 'other') return !!(a.other && a.other.trim());
    return typeof a.choice === 'number';
  }

  /* ─────────── Survey flow ─────────── */
  function startSurvey(which) {
    state.activeSurvey = which;
    state.answers[which] = {};
    state.completed[which] = false;
    state.results[which] = null;
    state.stepIndex = 0;
    surveyPick.classList.add('hidden');
    completePanel.classList.add('hidden');
    emailGate.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    runner.classList.remove('hidden');
    renderStep();
    scrollToSurvey();
  }

  function exitToPick() {
    runner.classList.add('hidden');
    completePanel.classList.add('hidden');
    surveyPick.classList.remove('hidden');
    updatePickStatus();
    scrollToSurvey();
  }

  function computeScore(which) {
    const scen = which === 'governance' ? GOVERNANCE_SCENARIOS : LEGAL_VS_ENTERPRISE_SCENARIOS;
    let score = 0;
    scen.forEach((q) => {
      const a = state.answers[which][q.id];
      if (a && a.choice === q.best) score++;
    });
    const max = scen.length;
    const pct = (score / max) * 100;
    const riskLevel = pct >= 80 ? 'Low Vulnerability' : pct >= 50 ? 'Moderate Vulnerability' : 'High Vulnerability';
    return { score, max, pct, riskLevel };
  }

  function finishSurvey() {
    const which = state.activeSurvey;
    state.completed[which] = true;
    state.results[which] = computeScore(which);
    runner.classList.add('hidden');

    const msg = which === 'governance' ? GOVERNANCE_COMPLETION_MESSAGE : LEGAL_VS_ENTERPRISE_COMPLETION_MESSAGE;
    const bothDone = state.completed.governance && state.completed.legal;
    const otherLabel = which === 'governance' ? 'Take Assessment 2 — Legal AI vs Enterprise Risk AI' : 'Take Assessment 1 — Governance Vulnerability';
    const otherKey = which === 'governance' ? 'legal' : 'governance';

    completePanel.innerHTML = `
      <div class="complete-card">
        <div class="big">✅</div>
        <h3>Assessment complete!</h3>
        <p>${msg}</p>
        <div class="complete-actions">
          ${!state.completed[otherKey] ? `<button class="btn btn-ghost" id="takeOther">${otherLabel}</button>` : ''}
          <button class="btn btn-primary" id="goEmail">${bothDone ? 'Submit My Results →' : 'Finish & Submit Results →'}</button>
        </div>
      </div>`;
    completePanel.classList.remove('hidden');
    updatePickStatus();
    scrollToSurvey();

    const takeOther = $('#takeOther');
    if (takeOther) takeOther.addEventListener('click', () => startSurvey(otherKey));
    $('#goEmail').addEventListener('click', showEmailGate);
  }

  function updatePickStatus() {
    ['governance', 'legal'].forEach((k) => {
      const el = $(`#status-${k}`);
      el.textContent = state.completed[k] ? '✓ Completed' : '';
    });
  }

  /* ─────────── Email gate & submission ─────────── */
  function showEmailGate() {
    completePanel.classList.add('hidden');
    runner.classList.add('hidden');
    surveyPick.classList.add('hidden');
    emailGate.classList.remove('hidden');
    scrollToSurvey();
  }

  function answersPayload(which) {
    if (which === 'governance') {
      const context = CONTEXT_QUESTIONS.map((q) => {
        const a = state.answers.governance[q.id] || {};
        let answer;
        if (q.type === 'multi') {
          answer = [...(a.multi || [])];
          if (a.otherChecked && a.other) answer.push(`Other: ${a.other.trim()}`);
        } else if (a.choice === 'other') {
          answer = `${q.other}: ${a.other ? a.other.trim() : ''}`;
        } else {
          answer = typeof a.choice === 'number' ? q.options[a.choice] : '';
        }
        return { questionId: q.id, question: q.question, answer, isBest: null };
      });
      const scenarios = GOVERNANCE_SCENARIOS.map((q) => {
        const a = state.answers.governance[q.id] || {};
        return {
          questionId: q.id,
          question: q.title,
          answer: typeof a.choice === 'number' ? `${letter(a.choice)}. ${q.options[a.choice]}` : '',
          isBest: a.choice === q.best,
        };
      });
      return { context, scenarios };
    }
    const scenarios = LEGAL_VS_ENTERPRISE_SCENARIOS.map((q) => {
      const a = state.answers.legal[q.id] || {};
      return {
        questionId: q.id,
        question: q.title,
        answer: typeof a.choice === 'number' ? `${letter(a.choice)}. ${q.options[a.choice]}` : '',
        isBest: a.choice === q.best,
      };
    });
    return { scenarios };
  }

  $('#emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#subEmail').value.trim();
    const formMsg = $('#formMsg');
    const submitBtn = $('#submitBtn');
    formMsg.className = 'form-msg';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formMsg.textContent = 'Please enter a valid email address.';
      formMsg.classList.add('err');
      return;
    }

    const payload = {
      email,
      name: $('#subName').value.trim(),
      company: $('#subCompany').value.trim(),
      surveys: {},
      meta: { referrer: document.referrer || '', durationSeconds: Math.round((Date.now() - startTime) / 1000) },
    };
    if (state.completed.governance) {
      const r = state.results.governance;
      payload.surveys.governance = { completed: true, ...answersPayload('governance'), score: r.score, maxScore: r.max, riskLevel: r.riskLevel };
    }
    if (state.completed.legal) {
      const r = state.results.legal;
      payload.surveys.legalVsEnterprise = { completed: true, ...answersPayload('legal'), score: r.score, maxScore: r.max, riskLevel: r.riskLevel };
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        state.submitted = true;
        showResults();
        showToast('✅ Saved! Your results have been recorded.');
      } else {
        formMsg.textContent = data.error || 'Something went wrong. Please try again.';
        formMsg.classList.add('err');
      }
    } catch {
      formMsg.textContent = 'Network error — is the server running? Your answers are kept in this page; try again.';
      formMsg.classList.add('err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit & Get My Results';
    }
  });

  /* ─────────── Results ─────────── */
  function ringSVG(pct, color) {
    const r = 62, c = 2 * Math.PI * r;
    return `<svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="rgba(148,163,184,0.15)" stroke-width="11"/>
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
    </svg>`;
  }

  function riskClass(level) {
    return level.startsWith('Low') ? 'risk-low' : level.startsWith('Moderate') ? 'risk-med' : 'risk-high';
  }
  function riskColor(level) {
    return level.startsWith('Low') ? '#34d399' : level.startsWith('Moderate') ? '#fbbf24' : '#f87171';
  }

  function showResults() {
    emailGate.classList.add('hidden');
    const g = state.results.governance;
    const l = state.results.legal;
    const totalScore = (g ? g.score : 0) + (l ? l.score : 0);
    const totalMax = (g ? g.max : 0) + (l ? l.max : 0);
    const pct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
    const overall = pct >= 80 ? 'Low Vulnerability' : pct >= 50 ? 'Moderate Vulnerability' : 'High Vulnerability';

    const advice =
      pct >= 80
        ? 'Strong strategic instincts. Your thinking aligns with a private, connected enterprise risk-intelligence approach. Let’s talk about turning that into deployed capability.'
        : pct >= 50
        ? 'Partially ready. Some choices still favour fragmented, retrospective or public-AI approaches that regulators and leaks routinely outpace. A private intelligence layer would close the gap.'
        : 'High exposure. Your current instincts lean on post-mortem audits, fragmented repositories and public AI tools — exactly the patterns that let governance vulnerabilities surface via regulators first.';

    resultsPanel.innerHTML = `
      <div class="result-card">
        <h3>Your Governance Readiness Profile</h3>
        <div class="score-ring">${ringSVG(pct, riskColor(overall))}<div class="val"><b>${pct}%</b><small>${totalScore}/${totalMax} best answers</small></div></div>
        <span class="risk-pill ${riskClass(overall)}">${overall}</span>
        <p class="result-msg">${advice}</p>
        <div class="result-breakdown">
          ${g ? `<div class="rb-item">Governance Vulnerability Assessment<b>${g.score}/${g.max} · ${g.riskLevel}</b></div>` : ''}
          ${l ? `<div class="rb-item">Legal AI vs Enterprise Risk AI<b>${l.score}/${l.max} · ${l.riskLevel}</b></div>` : ''}
        </div>
        <p class="result-msg"><strong>DeRisk.biz</strong> is a private AI risk intelligence layer for CXOs — deployable inside your own network. To know how it can be deployed within your organization, at what cost and timeline → <a href="mailto:info@derisk.biz">info@derisk.biz</a></p>
        <div class="complete-actions">
          <a class="btn btn-primary" href="#consult">🎁 Claim FREE 30-min CXO Consultation</a>
          <a class="btn btn-ghost" href="#contact">Contact Us</a>
        </div>
      </div>`;
    resultsPanel.classList.remove('hidden');
    scrollToSurvey();
  }

  /* ─────────── Runner nav ─────────── */
  nextBtn.addEventListener('click', () => {
    if (!validateCurrent()) {
      showToast('Please select an answer to continue.');
      return;
    }
    const list = steps();
    const step = list[state.stepIndex];
    const q = step.q;
    const store = state.answers[state.activeSurvey];
    const saved = store[q.id] || {};

    if (step.kind === 'scenario' && !saved.checked) {
      saved.checked = true;
      store[q.id] = saved;
      renderStep();
      return;
    }

    if (state.stepIndex < list.length - 1) {
      state.stepIndex++;
      renderStep();
      qCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      finishSurvey();
    }
  });
  prevBtn.addEventListener('click', () => {
    if (state.stepIndex > 0) {
      state.stepIndex--;
      renderStep();
    }
  });
  $('#exitSurvey').addEventListener('click', exitToPick);

  /* ─────────── Start buttons ─────────── */
  document.querySelectorAll('[data-action="start-survey"]').forEach((b) =>
    b.addEventListener('click', () => {
      surveyPick.classList.remove('hidden');
      runner.classList.add('hidden');
      scrollToSurvey();
    })
  );
  document.querySelector('[data-action="start-governance"]').addEventListener('click', () => startSurvey('governance'));
  document.querySelector('[data-action="start-legal"]').addEventListener('click', () => startSurvey('legal'));

  /* ─────────── Contact form ─────────── */
  $('#contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = $('#contactMsg');
    const btn = $('#contactBtn');
    msgEl.className = 'form-msg';
    const name = $('#cName').value.trim();
    const email = $('#cEmail').value.trim();
    if (!name) { msgEl.textContent = 'Please enter your name.'; msgEl.classList.add('err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msgEl.textContent = 'Please enter a valid email.'; msgEl.classList.add('err'); return; }

    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email,
          company: $('#cCompany').value.trim(),
          message: $('#cMessage').value.trim(),
          wantsConsultation: $('#cConsult').checked,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        msgEl.textContent = '✅ ' + (data.message || 'Message sent!');
        msgEl.classList.add('ok');
        e.target.reset();
        $('#cConsult').checked = true;
      } else {
        msgEl.textContent = data.error || 'Could not send. Try again.';
        msgEl.classList.add('err');
      }
    } catch {
      msgEl.textContent = 'Network error — please email us directly at info@derisk.biz';
      msgEl.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = 'Send Message';
    }
  });

  /* ─────────── Social share links ─────────── */
  const shareText = encodeURIComponent(
    'Is Your Company Vulnerable To Internal Governance Risk Due To Hidden Data Patterns? Take the DeRisk.biz Governance Vulnerability Assessment — and tag @derisk.biz for a FREE 30-min CXO consultation!'
  );
  const shareUrl = encodeURIComponent('https://derisk.biz');
  $('#shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  $('#shareX').href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  /* ─────────── Misc ─────────── */
  $('#year').textContent = new Date().getFullYear();
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }
})();
