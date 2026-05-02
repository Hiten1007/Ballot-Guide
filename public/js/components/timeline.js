/**
 * @file timeline.js
 * @description Election process timeline component — renders the interactive
 * timeline and phase detail views with TTS + translation support.
 */

// @ts-nocheck
/* global BallotAPI, DOM */

const Timeline = (() => {
  let phases = [];

  /** Renders the timeline */
  function renderTimeline() {
    const container = DOM.id('timeline-container');
    container.innerHTML = phases.map((p, i) => `
      <div class="timeline__item" role="listitem" style="animation-delay:${i * 0.1}s">
        <div class="timeline__dot"></div>
        <div class="timeline__content" data-phase="${p.id}" tabindex="0" role="button"
             aria-label="View details about ${p.title}">
          <div class="card">
            <div class="timeline__phase">${p.icon} ${p.title}</div>
            <div class="timeline__desc">${p.shortDescription}</div>
          </div>
        </div>
      </div>
    `).join('');

    /* Attach click handlers */
    DOM.qsa('[data-phase]', container).forEach((el) => {
      const handler = () => showPhaseDetail(el.dataset.phase);
      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handler(); });
    });
  }

  /** Shows phase detail view */
  function showPhaseDetail(phaseId) {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;

    DOM.hide('process-timeline');
    const detail = DOM.id('process-detail');
    detail.classList.add('active');
    detail.style.display = 'block';

    const stepsHtml = phase.steps.map((s, i) => `
      <div class="step">
        <div class="step__number">${i + 1}</div>
        <div class="step__content">
          <div class="step__title">${s.title}</div>
          <div class="step__desc">${s.description}</div>
          ${s.tip ? `<div class="step__tip">💡 ${s.tip}</div>` : ''}
        </div>
      </div>
    `).join('');

    const datesHtml = phase.keyDates
      ? Object.entries(phase.keyDates).map(([k, v]) =>
          `<div style="display:flex;gap:8px;align-items:baseline;margin-bottom:4px">
            <strong style="color:var(--accent-light);text-transform:capitalize">${k.replace(/([A-Z])/g, ' $1')}:</strong>
            <span style="color:var(--text-secondary)">${v}</span>
          </div>`).join('')
      : '';

    const resourcesHtml = phase.resources
      ? phase.resources.map((r) =>
          `<a href="${r.url}" target="_blank" rel="noopener" class="btn btn--sm btn--secondary" style="margin:4px">${r.name} ↗</a>`).join('')
      : '';

    DOM.html('phase-content', `
      <div class="process-detail__header">
        <div class="process-detail__icon">${phase.icon}</div>
        <h2 class="process-detail__title">${phase.title}</h2>
      </div>
      <p class="process-detail__desc">${phase.description}</p>
      <h3 style="margin-bottom:16px;font-size:1.1rem">Steps</h3>
      <div class="steps">${stepsHtml}</div>
      ${datesHtml ? `<div class="card" style="margin-top:24px"><h3 style="margin-bottom:12px">📅 Key Dates</h3>${datesHtml}</div>` : ''}
      ${resourcesHtml ? `<div style="margin-top:20px"><h3 style="margin-bottom:12px">🔗 Resources</h3>${resourcesHtml}</div>` : ''}
    `);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Loads and renders phases */
  async function init() {
    try {
      const res = await BallotAPI.getProcess();
      phases = res.data.phases;
      renderTimeline();
    } catch (err) {
      DOM.html('timeline-container', '<p style="color:var(--danger);text-align:center">Failed to load election process data.</p>');
    }

    DOM.id('back-to-timeline').addEventListener('click', () => {
      DOM.id('process-detail').style.display = 'none';
      DOM.id('process-detail').classList.remove('active');
      DOM.show('process-timeline');
    });

    /* TTS button */
    DOM.id('tts-btn').addEventListener('click', async () => {
      const detail = DOM.id('phase-content');
      if (!detail.textContent.trim()) {
        alert('Select a phase first to listen to its content.');
        return;
      }
      try {
        const res = await BallotAPI.tts(detail.textContent.substring(0, 4000));
        if (res.data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${res.data.audioContent}`);
          audio.play();
        } else {
          alert(res.data.warning || 'TTS not available.');
        }
      } catch { alert('Text-to-speech is not configured. Add GOOGLE_CLOUD_API_KEY to .env'); }
    });

    /* Translation */
    DOM.id('lang-select').addEventListener('change', async (e) => {
      const lang = e.target.value;
      if (lang === 'en') return;
      const detail = DOM.id('phase-content');
      if (!detail.textContent.trim()) return;
      try {
        const res = await BallotAPI.translate(detail.textContent.substring(0, 3000), lang);
        if (res.data.translatedText) {
          DOM.html('phase-content', `<div class="card"><p style="line-height:1.8">${res.data.translatedText}</p></div>`);
        }
      } catch { alert('Translation not configured. Add GOOGLE_CLOUD_API_KEY to .env'); }
    });
  }

  return { init, showPhaseDetail };
})();
