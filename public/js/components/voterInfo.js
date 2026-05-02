/**
 * @file voterInfo.js
 * @description Voter information lookup via Google Civic Information API.
 */

// @ts-nocheck
/* global BallotAPI, DOM */

const VoterInfo = (() => {
  /** Renders voter info results */
  function renderResult(data) {
    const container = DOM.id('voter-result');

    if (data.error === 'noElections') {
      container.innerHTML = `<div class="card" style="text-align:center"><p style="color:var(--warning)">⚠️ ${data.message}</p></div>`;
      return;
    }

    let html = '';

    /* Election info */
    if (data.election) {
      html += `<div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:8px">🗳️ ${data.election.name}</h3>
        <p style="color:var(--text-secondary)">Election Day: ${data.election.electionDay}</p>
      </div>`;
    }

    /* Polling locations */
    if (data.pollingLocations?.length) {
      html += `<div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px">📍 Polling Locations</h3>
        ${data.pollingLocations.map((loc) => `
          <div class="step" style="margin-bottom:8px">
            <div class="step__content">
              <div class="step__title">${loc.address?.locationName || 'Polling Place'}</div>
              <div class="step__desc">${[loc.address?.line1, loc.address?.city, loc.address?.state, loc.address?.zip].filter(Boolean).join(', ')}</div>
              ${loc.pollingHours ? `<div class="step__tip">🕐 ${loc.pollingHours}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    /* Contests */
    if (data.contests?.length) {
      html += `<div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px">🏛️ Contests on Your Ballot (${data.contests.length})</h3>
        ${data.contests.slice(0, 10).map((c) => `
          <div style="padding:8px 0;border-bottom:1px solid var(--border-glass)">
            <div style="font-weight:600">${c.office || c.type}</div>
            ${c.candidates ? `<div style="color:var(--text-secondary);font-size:.85rem">${c.candidates.map((ca) => ca.name).join(' • ')}</div>` : ''}
          </div>
        `).join('')}
      </div>`;
    }

    /* Election administration */
    if (data.state?.[0]?.electionAdministrationBody) {
      const admin = data.state[0].electionAdministrationBody;
      html += `<div class="card">
        <h3 style="margin-bottom:12px">🏢 Election Office</h3>
        <p style="font-weight:600">${admin.name || ''}</p>
        ${admin.electionInfoUrl ? `<p><a href="${admin.electionInfoUrl}" target="_blank" rel="noopener">Election Info ↗</a></p>` : ''}
        ${admin.electionRegistrationUrl ? `<p><a href="${admin.electionRegistrationUrl}" target="_blank" rel="noopener">Register to Vote ↗</a></p>` : ''}
      </div>`;
    }

    if (!html) {
      html = '<div class="card" style="text-align:center"><p style="color:var(--text-secondary)">No detailed information available for this address.</p></div>';
    }

    container.innerHTML = html;
  }

  /** Handles search */
  async function search() {
    const address = DOM.id('voter-address').value.trim();
    if (!address) return;

    DOM.html('voter-result', '<div class="loader"></div>');

    try {
      const res = await BallotAPI.getVoterInfo(address);
      renderResult(res.data);
    } catch (err) {
      DOM.html('voter-result', `<div class="card" style="text-align:center"><p style="color:var(--danger)">❌ ${err.message || 'Failed to fetch voter information. Ensure GOOGLE_CIVIC_API_KEY is configured.'}</p></div>`);
    }
  }

  /** Init */
  function init() {
    DOM.id('voter-search-btn').addEventListener('click', search);
    DOM.id('voter-address').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search();
    });
  }

  return { init };
})();
