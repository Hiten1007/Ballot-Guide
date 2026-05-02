/**
 * @file quiz.js
 * @description Interactive quiz component with server-side answer validation.
 */

// @ts-nocheck
/* global BallotAPI, DOM */

const Quiz = (() => {
  let questions = [];
  let current = 0;
  let score = 0;
  let answered = false;

  /** Renders the current question */
  function renderQuestion() {
    const q = questions[current];
    const letters = ['A', 'B', 'C', 'D'];

    DOM.html('quiz-active', `
      <div class="quiz__counter">Question ${current + 1} of ${questions.length}</div>
      <div class="quiz__progress"><div class="quiz__progress-bar" style="width:${((current) / questions.length) * 100}%"></div></div>
      <div class="quiz__question" id="quiz-q-text">${q.question}</div>
      <div class="quiz__options" role="radiogroup" aria-label="Answer options">
        ${q.options.map((opt, i) => `
          <button class="quiz__option" data-index="${i}" role="radio" aria-checked="false"
                  aria-label="Option ${letters[i]}: ${opt}" id="quiz-opt-${i}">
            <span class="quiz__option-letter">${letters[i]}</span>
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="quiz-explanation"></div>
      <div id="quiz-next" style="display:none;margin-top:16px;text-align:center">
        <button class="btn btn--primary btn--sm" id="next-question-btn">
          ${current < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      </div>
    `);

    answered = false;
    DOM.qsa('.quiz__option').forEach((btn) => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.index)));
    });
  }

  /** Validates answer against server */
  async function handleAnswer(index) {
    if (answered) return;
    answered = true;

    DOM.qsa('.quiz__option').forEach((b) => { b.disabled = true; });

    try {
      const res = await BallotAPI.validateAnswer(questions[current].id, index);
      const result = res.data;

      if (result.correct) score++;

      DOM.qsa('.quiz__option').forEach((b) => {
        const i = parseInt(b.dataset.index);
        if (i === result.correctIndex) b.classList.add('correct');
        else if (i === index && !result.correct) b.classList.add('wrong');
      });

      DOM.html('quiz-explanation', `
        <div class="quiz__explanation">
          ${result.correct ? '✅ Correct!' : '❌ Incorrect.'} ${result.explanation}
        </div>
      `);

      DOM.show('quiz-next');
      DOM.id('next-question-btn').addEventListener('click', () => {
        current++;
        if (current < questions.length) renderQuestion();
        else showResults();
      });
    } catch {
      DOM.html('quiz-explanation', '<div class="quiz__explanation" style="border-color:var(--danger);color:var(--danger)">Error validating answer.</div>');
    }
  }

  /** Shows final results */
  function showResults() {
    const pct = Math.round((score / questions.length) * 100);
    let message = 'Keep learning — you\'ll get there! 📚';
    if (pct >= 80) message = 'Excellent! You\'re an election expert! 🏆';
    else if (pct >= 60) message = 'Great job! You know your stuff! 🎉';
    else if (pct >= 40) message = 'Good start! Review the process guide for more. 💪';

    DOM.hide('quiz-active');
    DOM.html('quiz-result', `
      <div class="quiz__result">
        <div class="quiz__score">${score}/${questions.length}</div>
        <div style="font-size:1.2rem;margin-bottom:4px">${pct}%</div>
        <div class="quiz__result-text">${message}</div>
        <button class="btn btn--primary" id="retry-quiz-btn">🔄 Try Again</button>
      </div>
    `);
    DOM.show('quiz-result');
    DOM.id('retry-quiz-btn').addEventListener('click', startQuiz);
  }

  /** Starts the quiz */
  async function startQuiz() {
    current = 0;
    score = 0;
    DOM.hide('quiz-start');
    DOM.hide('quiz-result');

    try {
      const res = await BallotAPI.getQuiz(12, true);
      questions = res.data.questions;
      DOM.show('quiz-active');
      renderQuestion();
    } catch {
      DOM.html('quiz-active', '<p style="color:var(--danger)">Failed to load quiz.</p>');
      DOM.show('quiz-active');
    }
  }

  /** Init */
  function init() {
    DOM.id('start-quiz-btn').addEventListener('click', startQuiz);
  }

  return { init };
})();
