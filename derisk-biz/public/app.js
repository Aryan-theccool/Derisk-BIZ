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

      // Render items twice for a seamless infinite loop
      const itemsHtml = NEWS_TICKERS.map(
        (n) =>
          `<a class="ticker-item" href="${n.url}" target="_blank" rel="noopener noreferrer"><span class="dot">●</span><span class="ticker-text">${n.text}</span></a>`
      ).join('');

      this.innerHTML = `
        <span class="ticker-badge">${badgeText}</span>
        <div class="ticker-viewport">
          <div class="ticker-track">
            ${itemsHtml}
            ${itemsHtml}
          </div>
        </div>
      `;

      const track = this.querySelector('.ticker-track');
      const totalItems = NEWS_TICKERS.length;
      if (totalItems > 0) {
        const duration = totalItems * 10; // 10 seconds per item for smooth readable scroll
        track.style.animation = `continuous-slide ${duration}s linear infinite`;
        if (isReverse) {
          track.style.animationDirection = 'reverse';
        }
      }
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
    (c) => `<article class="card"><h3>${c.ic} &nbsp;${c.h}</h3><p>${c.p}</p></article>`
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

  function saveState() {
    try {
      localStorage.setItem('derisk_survey_state_v2', JSON.stringify(state));
    } catch (e) {}
  }

  function restoreState() {
    try {
      const saved = localStorage.getItem('derisk_survey_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach((k) => {
            if (typeof parsed[k] === 'object' && parsed[k] !== null && state[k]) {
              Object.assign(state[k], parsed[k]);
            } else {
              state[k] = parsed[k];
            }
          });
        }
      }
    } catch (e) {}
    updatePickStatus();
    if (state.activeSurvey) {
      surveyPick.classList.add('hidden');
      if (state.completed[state.activeSurvey]) {
        if (state.submitted) {
          showResults();
        } else {
          finishSurvey();
        }
      } else {
        runner.classList.remove('hidden');
        renderStep();
      }
    } else {
      updatePickStatus();
    }
  }

  /* Build unified step lists */
  const GOV_STEPS = [
    ...CONTEXT_QUESTIONS.map((q) => ({ kind: 'context', q })),
    {
      kind: 'transition',
      title: 'Part 2: Strategic Governance Scenarios',
      info: 'In the next 5 questions, you will face scenario-based strategic readiness questions covering board early-warning, regulator notices, M&A diligence, whistleblower reviews, data residency & more.<br><br>Evaluate each scenario carefully and choose the option that best reflects the optimal risk mitigation path.',
    },
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
    const saved = q ? (state.answers[state.activeSurvey][q.id] || {}) : {};

    let qNum = 0;
    let totalQs = 0;
    list.forEach((s, idx) => {
      if (s.kind !== 'transition') {
        totalQs++;
        if (idx <= state.stepIndex) qNum++;
      }
    });

    progressBar.style.width = `${((state.stepIndex) / list.length) * 100}%`;
    progressLabel.textContent = step.kind === 'transition'
      ? 'Introduction'
      : `Question ${qNum} of ${totalQs}`;
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
    } else if (step.kind === 'transition') {
      html += `<div style="text-align: center; padding: 1.5rem 0;">`;
      html += `  <div style="font-size: 3.2rem; margin-bottom: 1.2rem;">🎯</div>`;
      html += `  <div class="q-scn-title" style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-bottom: 1.1rem; text-align: center;">${step.title}</div>`;
      html += `  <p style="font-size: 1.05rem; line-height: 1.6; color: var(--muted); max-width: 560px; margin: 0 auto; text-align: center;">${step.info}</p>`;
      html += `</div>`;
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
        saveState();
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
        if (!qq) return;
        const store = state.answers[state.activeSurvey];
        store[qq.id] = { ...(store[qq.id] || {}), other: otherText.value };
        saveState();
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
    if (st.kind === 'transition') return true;
    const a = state.answers[state.activeSurvey][st.q.id];
    if (!a) return false;
    if (st.kind === 'scenario') return typeof a.choice === 'number';
    if (st.q.type === 'multi') return (a.multi && a.multi.length > 0) || (a.otherChecked && a.other && a.other.trim());
    if (a.choice === 'other') return !!(a.other && a.other.trim());
    return typeof a.choice === 'number';
  }

  /* ─────────── Survey flow ─────────── */
  function startSurvey(which) {
    if (which === 'legal' && !state.completed.governance) {
      showToast('⚠️ Please complete Assessment 1 (Governance Vulnerability Assessment) first!');
      return;
    }
    state.activeSurvey = which;
    state.answers[which] = {};
    state.completed[which] = false;
    state.results[which] = null;
    state.stepIndex = 0;
    saveState();
    surveyPick.classList.add('hidden');
    completePanel.classList.add('hidden');
    emailGate.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    runner.classList.remove('hidden');
    renderStep();
    scrollToSurvey();
  }

  function exitToPick() {
    state.activeSurvey = null;
    saveState();
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
    saveState();
    runner.classList.add('hidden');

    const msg = which === 'governance' ? GOVERNANCE_COMPLETION_MESSAGE : LEGAL_VS_ENTERPRISE_COMPLETION_MESSAGE;
    const bothDone = state.completed.governance && state.completed.legal;
    const otherLabel = which === 'governance' ? 'Take Assessment 2 — Legal AI vs Enterprise Risk AI' : 'Take Assessment 1 — Governance Vulnerability';
    const otherKey = which === 'governance' ? 'legal' : 'governance';

    const submitLabel = bothDone
      ? 'Submit All Results →'
      : (which === 'governance' ? 'Submit Assignment 1 →' : 'Submit Assignment 2 →');

    completePanel.innerHTML = `
      <div class="complete-card">
        <div class="big">✅</div>
        <h3>Assessment complete!</h3>
        <p>${msg}</p>
        <div class="complete-actions">
          <button class="btn btn-success" id="goEmail">${submitLabel}</button>
          ${!state.completed[otherKey] ? `<button class="btn btn-dark" id="takeOther">${otherLabel}</button>` : ''}
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
        saveState();
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

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return Promise.resolve();
      return Promise.reject(new Error('Fallback copy failed'));
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }

  function openShareModal(platform, text, shareUrl) {
    const modal = $('#shareModal');
    const title = $('#shareModalTitle');
    const sub = $('.modal-sub');
    const textarea = $('#shareModalText');
    const copyBtn = $('#copyShareText');
    const proceedBtn = $('#proceedToShare');
    const alertBox = $('#shareModalAlert');

    title.textContent = `Share on ${platform}`;
    if (platform === 'LinkedIn') {
      if (sub) sub.textContent = 'LinkedIn does not allow apps to pre-fill post text. We have copied the post message below to your clipboard. Simply paste it (Ctrl+V or Cmd+V) when LinkedIn opens!';
      proceedBtn.textContent = 'Continue to LinkedIn & Paste →';
      if (alertBox) {
        alertBox.innerHTML = `⚠️ <strong>Note</strong>: LinkedIn does not allow automated text filling. You must paste (<code>Ctrl + V</code> or <code>Cmd + V</code>) the copied text into the post box.`;
        alertBox.style.display = 'block';
      }
    } else {
      if (sub) sub.textContent = 'Copy the tweet message below to your clipboard. (We will also pre-fill it for you if your browser supports it!)';
      proceedBtn.textContent = 'Continue to X & Paste →';
      if (alertBox) {
        alertBox.innerHTML = `⚠️ <strong>X (Twitter) App Note</strong>: If your browser redirects to the X app, it may not auto-fill. You must paste (<code>Ctrl + V</code> or <code>Cmd + V</code>) the copied text into the post box.`;
        alertBox.style.display = 'block';
      }
    }

    textarea.value = text;
    modal.classList.remove('hidden');

    // Copy immediately
    copyTextToClipboard(text).then(() => {
      copyBtn.textContent = '✅ Copied!';
    }).catch(() => {
      copyBtn.textContent = '📋 Copy Text';
    });

    // Handlers
    const cleanListeners = () => {
      copyBtn.replaceWith(copyBtn.cloneNode(true));
      proceedBtn.replaceWith(proceedBtn.cloneNode(true));
      $('#closeShareModal').replaceWith($('#closeShareModal').cloneNode(true));
    };

    const setupModalHandlers = () => {
      const newCopyBtn = $('#copyShareText');
      const newProceedBtn = $('#proceedToShare');
      const newCloseBtn = $('#closeShareModal');

      newCopyBtn.addEventListener('click', () => {
        copyTextToClipboard(textarea.value).then(() => {
          newCopyBtn.textContent = '✅ Copied!';
          showToast('📋 Copied to clipboard!');
        }).catch(() => {
          showToast('Could not copy automatically. Please select all and copy.');
        });
      });

      newProceedBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        window.open(shareUrl, '_blank');
        cleanListeners();
      });

      newCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        cleanListeners();
      });
    };

    setupModalHandlers();
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
          <div class="share-row">
            <button class="btn btn-linkedin" id="shareLinkedIn">🔗 Share on LinkedIn</button>
            <button class="btn btn-x" id="shareX">🔗 Share on X</button>
          </div>
          <a class="btn btn-ghost" href="#contact">Contact Us</a>
        </div>
      </div>`;
    resultsPanel.classList.remove('hidden');
    scrollToSurvey();

    const shareBtn = $('#shareLinkedIn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const surveyName = (state.completed.legal && !state.completed.governance)
          ? 'Legal AI vs Enterprise Risk AI Assessment'
          : 'Governance Vulnerability Assessment';
        const text = `I recently completed the ${surveyName} by @deriskdotbiz and found it to be a refreshing shift from traditional Enterprise and Legal AI tools.\n\nInstead of focusing only on data and documents, it made me think about hidden governance risks, data silos, and whether Boards can detect issues before regulators or the media do.\n\nWorth exploring for founders, CXOs, investors and directors. Click here for insightful assessment: www.derisk.biz\n\n#CorporateGovernance #RiskManagement #AI #LegalAI #BoardGovernance #EnterpriseAI`;
        
        openShareModal('LinkedIn', text, 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.derisk.biz');
      });
    }

    const shareXBtn = $('#shareX');
    if (shareXBtn) {
      shareXBtn.addEventListener('click', () => {
        const surveyName = (state.completed.legal && !state.completed.governance)
          ? 'Legal AI vs Enterprise Risk AI Assessment'
          : 'Governance Vulnerability Assessment';
        const text = `Completed the ${surveyName} by @deriskdotbiz.\n\nInteresting perspective on how AI can connect legal, finance, tax, HR and compliance data to identify governance risks before they become crises.\n\nWorth a look for Boards, CXOs and investors. Click here for insightful assessment: www.derisk.biz\n\n#AI #Governance #RiskManagement #LegalAI #EnterpriseAI`;
        
        openShareModal('X (Twitter)', text, 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text));
      });
    }
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
    const saved = q ? (store[q.id] || {}) : {};

    if (q && step.kind === 'scenario' && !saved.checked) {
      saved.checked = true;
      store[q.id] = saved;
      saveState();
      renderStep();
      return;
    }

    if (state.stepIndex < list.length - 1) {
      state.stepIndex++;
      saveState();
      renderStep();
      qCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      finishSurvey();
    }
  });
  prevBtn.addEventListener('click', () => {
    if (state.stepIndex > 0) {
      state.stepIndex--;
      saveState();
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
  const lShare = $('#shareLinkedIn');
  if (lShare) lShare.href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const xShare = $('#shareX');
  if (xShare) xShare.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  /* ─────────── Misc ─────────── */
  $('#year').textContent = new Date().getFullYear();
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  restoreState();
})();
