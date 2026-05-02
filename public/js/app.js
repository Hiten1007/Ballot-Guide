/**
 * @file app.js
 * @description Main application controller — handles page routing,
 * navigation, and component initialisation.
 */

// @ts-nocheck
/* global Chatbot, Timeline, Quiz, Glossary, VoterInfo, DOM */

(function App() {
  'use strict';

  const pages = ['home', 'process', 'quiz', 'glossary', 'voter-info'];
  let currentPage = 'home';

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

  /** Initialise navigation */
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

  /** Boot */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    Timeline.init();
    Quiz.init();
    Glossary.init();
    VoterInfo.init();
    Chatbot.init();
  });
})();
