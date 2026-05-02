# 🗳️ BallotGuide — AI-Powered Election Process Education Assistant

> An interactive, nonpartisan assistant that helps users understand the US election process, timelines, and steps — powered by **Google Gemini AI**, **Google Civic Information API**, **Google Cloud Translate**, and **Google Cloud Text-to-Speech**.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![Google AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google)
![Tests](https://img.shields.io/badge/Tests-89%20Passed-10b981)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Table of Contents

- [Chosen Vertical](#-chosen-vertical)
- [Approach & Logic](#-approach--logic)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Google Services Integration](#-google-services-integration)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Security](#-security)
- [Accessibility](#-accessibility)
- [Code Quality](#-code-quality)
- [Assumptions](#-assumptions)

---

## 🎯 Chosen Vertical

**Election Process Education** — A smart, dynamic assistant that helps users understand every step of the US election process from voter registration through inauguration.

---

## 🧠 Approach & Logic

### Design Philosophy

BallotGuide was designed around three core principles:

1. **Education-First**: Every interaction teaches the user something about the election process. The AI assistant stays strictly nonpartisan and on-topic through a carefully crafted system prompt.

2. **Context-Aware Intelligence**: The assistant adapts its responses based on what the user is currently viewing. If a user is reading about the Electoral College and asks "how does this work?", the AI understands the context and provides relevant answers.

3. **Progressive Disclosure**: Information is layered — users start with a high-level timeline overview and can drill down into detailed step-by-step guides, glossary terms, or ask the AI for deeper explanations.

### Decision-Making Logic

The assistant employs several layers of intelligent decision-making:

```
User Input → Sanitisation → Context Analysis → AI Processing → Response Formatting
                                    ↓
                          [Current Page Context]
                          [Conversation History]
                          [System Prompt Guardrails]
```

- **Input Sanitisation**: All user input is sanitised through multiple layers (HTML stripping, parameter validation, length limits) before reaching the AI.
- **Contextual Awareness**: The system passes the user's current section (e.g., "Electoral College") to the AI so responses are contextually relevant.
- **Conversation Memory**: The last 10 conversation turns are maintained for multi-turn dialogue, enabling follow-up questions.
- **Guardrail System Prompt**: The AI is constrained to election/civic topics only and explicitly prohibited from expressing political opinions.
- **Server-Side Answer Validation**: Quiz answers are validated on the server to prevent client-side cheating, with explanations served only after an answer is submitted.

---

## ⚙️ How It Works

### User Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Landing    │────▶│  Process     │────▶│  Phase Detail    │
│   Page       │     │  Timeline    │     │  (Steps + Tips)  │
└─────┬───────┘     └──────────────┘     └─────────────────┘
      │                                          │
      │              ┌──────────────┐            │
      ├─────────────▶│  Knowledge   │            │
      │              │  Quiz        │            │
      │              └──────────────┘            │
      │              ┌──────────────┐            │
      ├─────────────▶│  Glossary    │            │
      │              │  (Search)    │            │
      │              └──────────────┘            │
      │              ┌──────────────┐            │
      └─────────────▶│  Voter Info  │            │
                     │  (Civic API) │            │
                     └──────────────┘            │
                                                 │
┌────────────────────────────────────────────────┘
│  AI Chatbot (Available on every page)
│  ├── Multi-turn conversation with Gemini
│  ├── Contextual suggestions based on current section
│  ├── Markdown-formatted responses
│  └── Rate-limited to prevent abuse
└────────────────────────────────────────────────
```

### Data Flow

1. **Static Data** (Election process, glossary, quiz) is served from JSON files via a caching data-access layer.
2. **AI Responses** are generated in real-time by Google Gemini with conversation context.
3. **Live Election Data** is fetched on-demand from the Google Civic Information API.
4. **Translations** are processed through Google Cloud Translate REST API.
5. **Audio Narration** is synthesised via Google Cloud Text-to-Speech REST API.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vanilla JS)                 │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐ │
│  │ Chat │ │Timeline│ │ Quiz │ │Glossary│ │VoterInfo │ │
│  └──┬───┘ └───┬────┘ └──┬───┘ └───┬────┘ └────┬─────┘ │
│     └─────────┴─────────┴─────────┴────────────┘       │
│                         │ API Client                     │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼───────────────────────────────┐
│                   Express.js Server                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Middleware Stack                                  │    │
│  │ Helmet → CORS → HPP → Compression → Rate Limit  │    │
│  │ → Body Parse → Validate → Sanitise               │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Routes                                           │    │
│  │ /api/assistant  → Gemini AI Chat + Suggestions   │    │
│  │ /api/election   → Process, Glossary, Quiz        │    │
│  │ /api/civic      → Elections, Voter Info           │    │
│  │ /api/accessibility → Translate, TTS              │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Services                                         │    │
│  │ geminiService │ civicService │ translateService   │    │
│  │ ttsService    │ electionDataService               │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Error Handler → Structured Logging (Winston)     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
          │              │              │
  ┌───────┴──┐   ┌──────┴───┐   ┌─────┴──────┐
  │ Gemini   │   │ Civic    │   │ Cloud      │
  │ 2.5 Flash│   │ Info API │   │ Translate  │
  └──────────┘   └──────────┘   │ + TTS      │
                                └────────────┘
```

### Design Patterns

| Pattern | Usage |
|---------|-------|
| **Service Layer** | Business logic isolated in `/src/services/` — routes are thin controllers |
| **Middleware Chain** | Security → Rate Limit → Validation → Handler → Error Handler |
| **Factory Pattern** | `createApp()` factory enables testing without starting a server |
| **Singleton** | Logger, AI client, and data caches are initialised once |
| **Envelope Pattern** | Every API response uses `{ success, data, meta }` or `{ success, error }` |
| **Graceful Degradation** | Translation/TTS return warnings instead of errors when unconfigured |

---

## 🔗 Google Services Integration

| Service | Purpose | Integration Detail |
|---------|---------|-------------------|
| **Google Gemini AI** (`@google/genai`) | AI chatbot for answering election questions | Multi-turn conversations with system prompt guardrails, contextual suggestions, temperature-controlled responses |
| **Google Civic Information API** | Real election data and voter information | REST API integration for `electionQuery`, `voterInfoQuery`, and `divisions/search` endpoints |
| **Google Cloud Translate** | Multi-language content support | REST API (v2) supporting 13+ languages for inclusive access |
| **Google Cloud Text-to-Speech** | Audio narration of content | REST API with MP3 output for screen-reader-independent audio |

### Why These Services?

- **Gemini AI**: Powers the core "smart assistant" requirement — dynamic, context-aware responses that adapt to user questions while maintaining strict nonpartisan guardrails.
- **Civic Information API**: Provides real-world, authoritative election data (polling locations, ballot contests, election officials) — not simulated data.
- **Translate + TTS**: Addresses the accessibility requirement — the US has 67M+ non-English speakers and millions of visually impaired citizens who need election information.

---

## ✨ Features

### Core Features
- **Interactive Election Process Timeline** — 7 detailed phases from registration to inauguration
- **AI-Powered Q&A Chatbot** — Ask any election question, get instant nonpartisan answers
- **Knowledge Quiz** — 12-question quiz with server-side validation and explanations
- **Searchable Glossary** — 33 key election terms with debounced search
- **Voter Information Lookup** — Real polling locations and ballot data via Civic API

### Accessibility Features
- **Multi-Language Support** — Content translation via Google Translate (13+ languages)
- **Text-to-Speech** — Audio narration via Google Cloud TTS
- **Skip Navigation Link** — Keyboard shortcut to skip to main content
- **ARIA Roles & Labels** — Full semantic markup for screen readers
- **Keyboard Navigation** — All interactive elements are keyboard-accessible
- **Focus Indicators** — Visible `:focus-visible` outlines on all interactive elements
- **Reduced Motion** — Respects `prefers-reduced-motion` media query
- **High Contrast** — Adapts to `prefers-contrast: high` preference
- **Responsive Design** — Mobile-first layout with hamburger navigation

### Security Features
- **Helmet** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **CORS** — Restricted to same-origin in production
- **HPP** — HTTP Parameter Pollution prevention
- **Rate Limiting** — Global (100 req/15min) + strict AI endpoint (10 req/min)
- **Input Sanitisation** — HTML stripping, address validation, length limits
- **Environment Variables** — No hardcoded secrets; `.env.example` template provided

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | Server-side JavaScript |
| **Framework** | Express 4.x | HTTP routing and middleware |
| **AI** | `@google/genai` | Gemini AI SDK |
| **Security** | Helmet, HPP, cors, express-rate-limit | Defence-in-depth |
| **Sanitisation** | sanitize-html | XSS prevention |
| **Logging** | Winston | Structured, env-aware logging |
| **Compression** | compression | Gzip response compression |
| **Testing** | Jest + Supertest | Unit + integration tests |
| **Linting** | ESLint + Prettier + eslint-plugin-jsdoc | Code quality |
| **Frontend** | Vanilla HTML/CSS/JS | Zero-dependency UI |

---

## 📁 Project Structure

```
BallotGuide/
├── server.js                         # Entry point with graceful shutdown
├── package.json                      # Dependencies and scripts
├── jest.config.js                    # Test configuration
├── .eslintrc.json                    # Linting rules
├── .prettierrc                       # Formatting rules
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
│
├── src/                              # Backend source code
│   ├── app.js                        # Express app factory
│   ├── config/
│   │   └── index.js                  # Centralised configuration
│   ├── middleware/
│   │   ├── errorHandler.js           # Global error handler + 404
│   │   ├── rateLimiter.js            # Dual-tier rate limiting
│   │   ├── security.js               # Helmet + CORS + HPP + compression
│   │   └── validator.js              # Request validation (chat, address, translate, TTS)
│   ├── routes/
│   │   ├── index.js                  # Route aggregator + health check
│   │   ├── assistantRoutes.js        # AI chat + suggestions
│   │   ├── electionRoutes.js         # Process, glossary, quiz
│   │   ├── civicRoutes.js            # Google Civic API proxy
│   │   └── accessibilityRoutes.js    # Translate + TTS
│   ├── services/
│   │   ├── geminiService.js          # Google Gemini AI integration
│   │   ├── civicService.js           # Google Civic Information API
│   │   ├── translateService.js       # Google Cloud Translate
│   │   ├── ttsService.js             # Google Cloud Text-to-Speech
│   │   └── electionDataService.js    # Data access layer with caching
│   ├── utils/
│   │   ├── logger.js                 # Winston structured logger
│   │   ├── sanitizer.js              # Input sanitisation utilities
│   │   └── responseFormatter.js      # Standardised API envelopes
│   └── data/
│       ├── electionProcess.json      # 7 phases, 30+ steps, tips, dates
│       ├── glossary.json             # 33 election terms
│       └── quizQuestions.json        # 12 quiz questions with explanations
│
├── public/                           # Frontend static assets
│   ├── index.html                    # Semantic HTML5 with ARIA
│   ├── css/
│   │   └── styles.css                # Design system (dark mode, glassmorphism)
│   └── js/
│       ├── app.js                    # SPA router and initialisation
│       ├── utils/
│       │   ├── api.js                # Centralised API client
│       │   └── dom.js                # DOM utilities + markdown parser
│       └── components/
│           ├── chatbot.js            # AI chat with conversation history
│           ├── timeline.js           # Interactive process timeline
│           ├── quiz.js               # Quiz with server-side validation
│           ├── glossary.js           # Searchable glossary
│           └── voterInfo.js          # Civic API voter lookup
│
└── tests/                            # Test suite (89 tests)
    ├── unit/
    │   ├── services/
    │   │   ├── electionDataService.test.js   # 15 tests
    │   │   ├── geminiService.test.js         # 9 tests
    │   │   ├── civicService.test.js          # 7 tests
    │   │   ├── translateService.test.js      # 4 tests
    │   │   └── ttsService.test.js            # 3 tests
    │   ├── middleware/
    │   │   └── validator.test.js             # 11 tests
    │   └── utils/
    │       ├── sanitizer.test.js             # 11 tests
    │       └── responseFormatter.test.js     # 5 tests
    └── integration/
        ├── election.test.js                  # 13 tests
        └── accessibility.test.js             # 11 tests
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 20.0.0 or higher
- **Google API Keys** (instructions below)

### 1. Clone the Repository

```bash
git clone https://github.com/Hiten1007/Ballot-Guide.git
cd Ballot-Guide
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

| Variable | Required | How to Get |
|----------|----------|-----------|
| `GEMINI_API_KEY` | ✅ Yes | [Google AI Studio](https://aistudio.google.com/) → Get API Key |
| `GOOGLE_CIVIC_API_KEY` | Optional | [Google Cloud Console](https://console.cloud.google.com/) → Enable Civic Information API |
| `GOOGLE_CLOUD_API_KEY` | Optional | [Google Cloud Console](https://console.cloud.google.com/) → Enable Translate & TTS APIs |

> **Note**: The app works with only `GEMINI_API_KEY`. Civic, Translate, and TTS features gracefully degrade with warnings when their keys are not configured.

### 4. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

### 5. Run Tests

```bash
# All tests
npm test

# With coverage report
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

---

## 📡 API Reference

All endpoints return a consistent envelope:

```json
// Success
{ "success": true, "data": { ... }, "meta": { "timestamp": "..." } }

// Error
{ "success": false, "error": { "code": 400, "message": "..." } }
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/assistant/chat` | AI chatbot conversation |
| `GET` | `/api/assistant/suggestions?section=` | Contextual question suggestions |
| `GET` | `/api/election/process` | All election process phases |
| `GET` | `/api/election/process/:phaseId` | Specific phase details |
| `GET` | `/api/election/glossary?q=` | Searchable glossary |
| `GET` | `/api/election/quiz?count=&shuffle=` | Quiz questions (answers stripped) |
| `POST` | `/api/election/quiz/validate` | Server-side answer validation |
| `GET` | `/api/civic/elections` | Live election data |
| `GET` | `/api/civic/voterinfo?address=` | Voter info for an address |
| `GET` | `/api/civic/divisions?q=` | Political division search |
| `POST` | `/api/accessibility/translate` | Text translation |
| `GET` | `/api/accessibility/languages` | Supported languages |
| `POST` | `/api/accessibility/tts` | Text-to-speech synthesis |

---

## 🧪 Testing

### Test Results: **89 Tests, 10 Suites, 100% Pass Rate**

| Suite | Tests | Coverage Area |
|-------|-------|--------------|
| `electionDataService.test.js` | 15 | Data access, caching, search, quiz validation |
| `geminiService.test.js` | 9 | AI chat, conversation history, suggestions, error handling |
| `civicService.test.js` | 7 | Elections, voter info, divisions, API error handling |
| `translateService.test.js` | 4 | Translation, supported languages, fallback |
| `ttsService.test.js` | 3 | Speech synthesis, request body, API errors |
| `validator.test.js` | 11 | Input validation, sanitisation, length limits |
| `sanitizer.test.js` | 11 | XSS prevention, HTML stripping, address cleaning |
| `responseFormatter.test.js` | 5 | API envelope formatting |
| `election.test.js` | 13 | Full API integration (process, glossary, quiz) |
| `accessibility.test.js` | 11 | ARIA, security headers, HTML structure, SEO |

### Test Strategy

- **Unit Tests**: Isolated tests for services, middleware, and utilities with mock dependencies
- **Integration Tests**: Full HTTP request/response cycle via Supertest against the Express app factory
- **Accessibility Tests**: Validate ARIA roles, skip links, semantic HTML, and single `<h1>` per page
- **Security Tests**: Verify Helmet headers, input rejection, and rate limiting behaviour

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **Content Security Policy** | Helmet CSP with whitelisted sources for Google services |
| **HSTS** | Strict Transport Security enabled |
| **X-Frame-Options** | Clickjacking prevention |
| **X-Content-Type-Options** | MIME sniffing prevention |
| **CORS** | Restricted to same-origin in production |
| **HPP** | HTTP Parameter Pollution prevention |
| **Rate Limiting** | Global (100/15min) + AI-specific (10/min) |
| **Input Sanitisation** | Multi-layer: HTML stripping, regex validation, length limits |
| **Environment Variables** | All secrets in `.env`, never committed |
| **Frozen Configuration** | `Object.freeze()` prevents runtime config mutation |

---

## ♿ Accessibility

| Feature | Implementation |
|---------|---------------|
| **Skip Navigation** | Hidden link appears on focus for keyboard users |
| **ARIA Roles** | `banner`, `main`, `contentinfo`, `navigation`, `dialog`, `list`, `log` |
| **ARIA Labels** | All buttons, inputs, and interactive elements labelled |
| **ARIA Live Regions** | Chat messages announced by screen readers |
| **Keyboard Navigation** | Full keyboard support, visible focus indicators |
| **Semantic HTML** | Proper heading hierarchy, landmarks, form labels |
| **Reduced Motion** | Disables animations when `prefers-reduced-motion` is set |
| **High Contrast** | Enhanced borders/text when `prefers-contrast: high` is set |
| **Multi-Language** | Google Translate for 13+ languages |
| **Audio Narration** | Google TTS for auditory content access |
| **Responsive Design** | Mobile-first with hamburger navigation |

---

## 📏 Code Quality

| Tool | Purpose | Configuration |
|------|---------|--------------|
| **ESLint** | Static analysis + JSDoc enforcement | `.eslintrc.json` |
| **Prettier** | Consistent formatting | `.prettierrc` |
| **JSDoc** | Documentation on all functions/classes/modules | `eslint-plugin-jsdoc` |
| **ESM** | Modern `import/export` throughout | `"type": "module"` |
| **Consistent API** | Standardised response envelopes | `responseFormatter.js` |
| **Structured Logging** | Winston with JSON (prod) / colourised (dev) | `logger.js` |
| **Error Handling** | Global error handler + unhandled rejection/exception catching | `errorHandler.js` + `server.js` |

---

## 📝 Assumptions

1. **US-Focused**: The election process content covers the United States presidential election. The architecture supports extending to other countries.
2. **API Key Availability**: The app requires at minimum a Google Gemini API key. Civic, Translate, and TTS features gracefully degrade without their respective keys.
3. **Modern Browser**: The frontend targets modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+).
4. **Educational Purpose**: All content is for educational purposes only. Users are reminded to verify information with their local election office.
5. **Nonpartisan**: The AI assistant is explicitly constrained to never express political opinions or endorse candidates.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for Google Virtual Prompt Wars</strong><br>
  <sub>Powered by Google Gemini AI • Google Civic Information API • Google Cloud Translate • Google Cloud TTS</sub>
</div>
