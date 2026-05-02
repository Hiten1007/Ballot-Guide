/**
 * @file chatbot.js
 * @description AI chatbot component — handles chat UI, message sending,
 * conversation history, and suggestion chips.
 */

// @ts-nocheck
/* global BallotAPI, DOM */

const Chatbot = (() => {
  let conversationHistory = [];
  let isOpen = false;

  /** Adds a message bubble to the chat */
  function addMessage(text, isUser = false) {
    const container = DOM.id('chat-messages');
    const msg = DOM.create('div', `chat__msg chat__msg--${isUser ? 'user' : 'bot'}`);
    msg.innerHTML = isUser ? text : DOM.mdToHtml(text);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  /** Shows typing indicator */
  function showTyping() {
    const container = DOM.id('chat-messages');
    const indicator = DOM.create('div', 'typing-indicator');
    indicator.id = 'typing';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
  }

  /** Removes typing indicator */
  function hideTyping() {
    const el = DOM.id('typing');
    if (el) el.remove();
  }

  /** Sends a message to the AI */
  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, true);
    conversationHistory.push({ role: 'user', text });

    DOM.id('chat-input').value = '';
    DOM.id('chat-send').disabled = true;
    showTyping();

    try {
      const res = await BallotAPI.chat(text, conversationHistory.slice(-10));
      hideTyping();
      const reply = res.data.reply;
      addMessage(reply);
      conversationHistory.push({ role: 'model', text: reply });
    } catch (err) {
      hideTyping();
      addMessage('Sorry, I had trouble answering. Please try again.');
    }

    DOM.id('chat-send').disabled = false;
    DOM.id('chat-input').focus();
  }

  /** Loads suggestion chips */
  function loadSuggestions(suggestions) {
    const container = DOM.id('chat-suggestions');
    container.innerHTML = '';
    suggestions.forEach((s) => {
      const btn = DOM.create('button', 'chat__suggestion');
      btn.textContent = s;
      btn.setAttribute('aria-label', `Ask: ${s}`);
      btn.addEventListener('click', () => sendMessage(s));
      container.appendChild(btn);
    });
  }

  /** Initialises the chatbot */
  function init() {
    const fab = DOM.id('chat-fab');
    const panel = DOM.id('chat-panel');
    const closeBtn = DOM.id('chat-close');
    const input = DOM.id('chat-input');
    const sendBtn = DOM.id('chat-send');

    fab.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      fab.style.display = isOpen ? 'none' : '';
      if (isOpen && conversationHistory.length === 0) {
        addMessage("Hi! I'm BallotGuide, your election education assistant. Ask me anything about the US election process, voter registration, primaries, the Electoral College, or anything election-related! 🗳️");
        loadSuggestions([
          'How do I register to vote?',
          'What is the Electoral College?',
          'When is Election Day?',
          'Explain primaries vs caucuses',
        ]);
      }
      if (isOpen) input.focus();
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('open');
      fab.style.display = '';
    });

    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });
  }

  return { init, sendMessage };
})();
