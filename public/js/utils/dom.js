/**
 * @file dom.js
 * @description DOM utility helpers for the frontend.
 */

/* eslint-disable no-unused-vars */
// @ts-nocheck

const DOM = {
  /** Shortcut for getElementById */
  id: (id) => document.getElementById(id),

  /** Shortcut for querySelector */
  qs: (sel, ctx = document) => ctx.querySelector(sel),

  /** Shortcut for querySelectorAll */
  qsa: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],

  /** Create an element with optional classes and attributes */
  create: (tag, className = '', attrs = {}) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  },

  /** Set innerHTML safely (for trusted server content) */
  html: (el, content) => {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.innerHTML = content;
  },

  /** Show/hide element */
  show: (el) => { if (typeof el === 'string') el = document.getElementById(el); if (el) el.style.display = ''; },
  hide: (el) => { if (typeof el === 'string') el = document.getElementById(el); if (el) el.style.display = 'none'; },

  /** Simple markdown to HTML converter for chat messages */
  mdToHtml: (md) => {
    if (!md) return '';
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)/, '<p>$1')
      .replace(/(.+)$/, '$1</p>');
  },

  /** Debounce function */
  debounce: (fn, ms = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },
};
