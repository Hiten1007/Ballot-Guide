/**
 * @file app.js
 * @description Main application controller — handles page routing,
 * navigation, component initialisation, progress tracking,
 * keyboard shortcuts, and dynamic engagement features.
 */

// @ts-nocheck
/* global Chatbot, Timeline, Quiz, Glossary, VoterInfo, DOM, BallotAPI */

(function App() {
  'use strict';

  const pages = ['home', 'process', 'quiz', 'glossary', 'voter-info'];
  let currentPage = 'home';

  /* ── Progress Tracking (localStorage) ──────────────────────────── */
  const STORAGE_KEY = 'ballotguide_progress';

  /** Returns saved progress from localStorage */
  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        phasesViewed: [],
        quizBestScore: 0,
        totalVisits: 0,
        lastVisit: null,
      };
    } catch { return { phasesViewed: [], quizBestScore: 0, totalVisits: 0, lastVisit: null }; }
  }

  /** Saves progress to localStorage */
  function saveProgress(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }

  /** Tracks a phase view */
  function trackPhaseView(phaseId) {
    const progress = getProgress();
    if (!progress.phasesViewed.includes(phaseId)) {
      progress.phasesViewed.push(phaseId);
      saveProgress(progress);
    }
    updateProgressBadge();
  }

  /** Updates the progress badge on the home page */
  function updateProgressBadge() {
    const badge = DOM.id('progress-badge');
    if (!badge) return;
    const progress = getProgress();
    const total = 7; // total phases
    const viewed = progress.phasesViewed.length;
    const pct = Math.round((viewed / total) * 100);
    badge.innerHTML = `<span class="progress-ring"><span class="progress-ring__fill" style="--pct:${pct}"></span></span> <span>${viewed}/${total} phases explored</span>`;
    badge.style.display = '';
  }

  /** Switches to a page */
  function navigateTo(page) {
    if (!pages.includes(page)) return;
    currentPage = page;

    /* Hide all pages, show selected */
    pages.forEach((p) => {
      const el = DOM.id(`page-${p}`);
      if (el) el.style.display = p === page ? '' : 'none';
    });

    /* Update nav buttons */
    DOM.qsa('.nav__btn').forEach((btn) => {
      const isActive = btn.dataset.page === page;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    /* Close mobile nav */
    DOM.id('main-nav').classList.remove('open');
    DOM.id('hamburger-btn').setAttribute('aria-expanded', 'false');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Expose navigateTo and trackPhaseView globally */
  window.BallotApp = { navigateTo, trackPhaseView, getProgress, saveProgress };

  /* ── Countdown & Facts ─────────────────────────────────────────── */

  /** Loads the election countdown */
  async function loadCountdown() {
    try {
      const res = await BallotAPI.getCountdown();
      const data = res.data;
      const el = DOM.id('countdown-widget');
      if (!el) return;

      el.innerHTML = `
        <div class="countdown__grid">
          <div class="countdown__item">
            <div class="countdown__number">${data.electionDay.daysUntil}</div>
            <div class="countdown__label">Days to Election Day</div>
          </div>
          <div class="countdown__item">
            <div class="countdown__number">${data.primarySeason.daysUntil}</div>
            <div class="countdown__label">Days to Primaries</div>
          </div>
          <div class="countdown__item">
            <div class="countdown__number">${data.inaugurationDay.daysUntil}</div>
            <div class="countdown__label">Days to Inauguration</div>
          </div>
          <div class="countdown__item">
            <div class="countdown__number">${data.nextElectionYear}</div>
            <div class="countdown__label">Next Election Year</div>
          </div>
        </div>
      `;
    } catch { /* graceful fail */ }
  }

  /** Loads a random fact */
  async function loadFact() {
    try {
      const res = await BallotAPI.getRandomFact();
      const el = DOM.id('did-you-know');
      if (!el || !res.data.fact) return;

      el.innerHTML = `<div class="fact-card"><span class="fact-card__icon">💡</span><div><strong>Did You Know?</strong><p>${res.data.fact}</p></div></div>`;
      el.style.display = '';
    } catch { /* graceful fail */ }
  }

  /* ── Keyboard Shortcuts ────────────────────────────────────────── */

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      /* Only when not focused on an input */
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      switch (e.key) {
        case '1': navigateTo('home'); break;
        case '2': navigateTo('process'); break;
        case '3': navigateTo('quiz'); break;
        case '4': navigateTo('glossary'); break;
        case '5': navigateTo('voter-info'); break;
        case '/':
          e.preventDefault();
          DOM.id('chat-fab')?.click();
          break;
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            showKeyboardHelp();
          }
          break;
      }
    });
  }

  /** Shows keyboard shortcuts help overlay */
  function showKeyboardHelp() {
    const existing = DOM.id('keyboard-help');
    if (existing) { existing.remove(); return; }

    const overlay = DOM.create('div', 'keyboard-help', { id: 'keyboard-help', role: 'dialog', 'aria-label': 'Keyboard shortcuts' });
    overlay.innerHTML = `
      <div class="keyboard-help__inner">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <div class="keyboard-help__grid">
          <kbd>1</kbd><span>Home</span>
          <kbd>2</kbd><span>Process</span>
          <kbd>3</kbd><span>Quiz</span>
          <kbd>4</kbd><span>Glossary</span>
          <kbd>5</kbd><span>Voter Info</span>
          <kbd>/</kbd><span>Open Chat</span>
          <kbd>?</kbd><span>This Help</span>
        </div>
        <button class="btn btn--sm btn--secondary" onclick="this.closest('.keyboard-help').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ── Navigation Init ───────────────────────────────────────────── */

  function initNav() {
    DOM.qsa('.nav__btn').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    DOM.id('hamburger-btn').addEventListener('click', () => {
      const nav = DOM.id('main-nav');
      const isOpen = nav.classList.toggle('open');
      DOM.id('hamburger-btn').setAttribute('aria-expanded', String(isOpen));
    });

    /* Hero buttons */
    DOM.id('hero-start-btn').addEventListener('click', () => navigateTo('process'));
    DOM.id('hero-quiz-btn').addEventListener('click', () => navigateTo('quiz'));
  }

  /* ── Boot ───────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', () => {
    /* Track visit */
    const progress = getProgress();
    progress.totalVisits++;
    progress.lastVisit = new Date().toISOString();
    saveProgress(progress);

    initNav();
    initKeyboardShortcuts();
    Timeline.init();
    Quiz.init();
    Glossary.init();
    VoterInfo.init();
    Chatbot.init();

    /* Load async features */
    loadCountdown();
    loadFact();
    updateProgressBadge();
  });
})();
