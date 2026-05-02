/**
 * @file glossary.js
 * @description Searchable election glossary component.
 */

// @ts-nocheck
/* global BallotAPI, DOM */

const Glossary = (() => {
  let allTerms = [];

  /** Renders terms into the grid */
  function renderTerms(terms) {
    const container = DOM.id('glossary-container');
    if (terms.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No terms found.</p>';
      return;
    }
    container.innerHTML = terms.map((t) => `
      <div class="card" role="listitem" tabindex="0">
        <div class="glossary__term">${t.term}</div>
        <div class="glossary__def">${t.definition}</div>
      </div>
    `).join('');
  }

  /** Loads glossary data */
  async function init() {
    try {
      const res = await BallotAPI.getGlossary();
      allTerms = res.data.terms;
      renderTerms(allTerms);
    } catch {
      DOM.html('glossary-container', '<p style="color:var(--danger)">Failed to load glossary.</p>');
    }

    /* Search with debounce */
    const search = DOM.id('glossary-search');
    search.addEventListener('input', DOM.debounce(async (e) => {
      const q = e.target.value.trim();
      if (!q) return renderTerms(allTerms);

      try {
        const res = await BallotAPI.getGlossary(q);
        renderTerms(res.data.terms);
      } catch {
        renderTerms(allTerms.filter((t) =>
          t.term.toLowerCase().includes(q.toLowerCase()) ||
          t.definition.toLowerCase().includes(q.toLowerCase())
        ));
      }
    }, 250));
  }

  return { init };
})();
