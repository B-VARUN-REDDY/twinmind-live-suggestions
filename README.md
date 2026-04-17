# TwinMind — Live Meeting Suggestions

A real-time AI meeting copilot that listens to live audio, transcribes it, and surfaces contextually intelligent suggestions — all in your browser.

**Built for the TwinMind AI Engineering Assignment.**

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Stack](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Stack](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss) ![Stack](https://img.shields.io/badge/Groq-API-orange)

---

## Quick Start

```bash
git clone <repo-url>
cd TwinMind
npm install
npm run dev
```

Open `http://localhost:5173`. Paste your [Groq API key](https://console.groq.com/keys) in Settings. Click the mic. Start talking.

---

## Architecture

### Why Pure Frontend?

The user supplies their own Groq API key at runtime. There's no auth, no database, no persistence across reloads. A backend adds deployment complexity for zero benefit. All API calls go directly from the browser to Groq's endpoints.

### Stack Choices

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | React 18 + Vite 5 | Fast dev server, clean build, proven ecosystem |
| **Styling** | Tailwind CSS 3 + CSS custom properties | Rapid layout iteration, design token system |
| **Transcription** | Groq Whisper Large V3 | Assignment requirement, fast inference |
| **LLM** | Groq GPT-OSS 120B (`openai/gpt-oss-120b`) | Assignment requirement, same model for all candidates |
| **State** | `useState` + `useRef` | Enough for this — the state graph is simple |
| **Deploy** | Vercel | One-command deploy, no env vars needed |

### File Structure

```
src/
├── App.jsx                      # Root — three-column layout, state orchestration
├── index.css                    # Design system tokens + Tailwind base
├── components/
│   ├── TranscriptPanel.jsx      # Left column: mic + live transcript
│   ├── SuggestionsPanel.jsx     # Center column: suggestion batches
│   ├── SuggestionCard.jsx       # Individual suggestion card
│   ├── ChatPanel.jsx            # Right column: streaming chat
│   ├── SettingsModal.jsx        # Configurable prompts + API key
│   ├── ExportButton.jsx         # Session export trigger
│   └── Toast.jsx                # Notification system
├── hooks/
│   ├── useAudioRecorder.js      # MediaRecorder + 30s chunking
│   ├── useTranscription.js      # Blob → Groq Whisper → text
│   ├── useSuggestions.js        # Context assembly + suggestion generation
│   └── useChat.js               # Streaming chat with SSE parsing
├── services/
│   └── api.js                   # Groq API client (transcription, chat, streaming)
├── prompts/
│   └── defaults.js              # All prompt templates + default settings
└── utils/
    ├── contextWindow.js         # Rolling context window helpers
    └── export.js                # Session JSON export
```

---

## Prompt Strategy

### The Core Problem

Every candidate uses the same models. Transcription quality is identical. Inference speed is identical. **The only differentiator is what context you pass, how you structure the prompt, and whether the suggestions feel useful in the moment.**

### Suggestion Taxonomy

The prompt instructs the LLM to first **analyze what just happened** in the conversation, then pick the right mix of suggestion types:

| Type | When to surface | Example |
|------|----------------|---------|
| **question** | Monologue mode, topic stalling | "What's the expected timeline for the migration?" |
| **talking_point** | New topic introduced, needs development | "Their API rate limit could bottleneck the real-time pipeline you described" |
| **answer** | Someone just asked a question | "Based on the 2024 pricing data, the per-token cost dropped 50% in March" |
| **fact_check** | A debatable claim was made | "OpenAI's context window is actually 128K, not 64K as mentioned" |
| **insight** | Specific noun mentioned (company, tool, concept) | "Anthropic announced constitutional AI updates last week — relevant to the safety point" |

The key design decision: the prompt includes a **reasoning step** ("first, silently analyze what just happened") before generating suggestions. This prevents the model from defaulting to generic suggestions.

### Context Window Strategy

**Suggestions** use a **rolling window** of the last ~2000 characters (~3 minutes of speech). Why: older context pollutes signal. The model starts surfacing suggestions about things said 20 minutes ago.

**Chat** uses the **full transcript** (up to ~8000 chars). Why: chat is deliberate. The user chose to ask. They need comprehensive context.

Both limits are configurable in Settings.

### Conversation Summary

A 1-2 sentence summary of the full conversation is generated **lazily** (every 3 suggestion cycles, not every cycle). This gives the model the overall topic when reading only recent transcript, without wasting an API call every 30 seconds.

### Anti-Repetition

The previous batch's suggestion previews are passed to the prompt with explicit instructions: "do not repeat these." Without this, the model frequently regenerates variations of the same insight.

### Prompt Editability

All three prompts (suggestions, chat, detail-on-click) are editable in Settings with "Reset to default" buttons. This signals that prompts are tunable product parameters, not hardcoded behavior.

---

## How It Works

### Audio Pipeline

1. **MediaRecorder** captures mic audio as `audio/webm;codecs=opus` (best compression Whisper accepts)
2. **Every 30 seconds** (configurable), `ondataavailable` fires with a playable blob
3. Blobs < 5KB are skipped (silence / too short for useful transcription)
4. Each blob → `POST /audio/transcriptions` → Groq Whisper Large V3 → appended to transcript

### Suggestion Cycle

Each transcription completion triggers:
1. Assemble **recent context** (rolling window) + **conversation summary** + **previous suggestions**
2. Fill the suggestion prompt template
3. `POST /chat/completions` → GPT-OSS 120B → parse JSON response
4. Validate & normalize → prepend batch to suggestions list

### Chat Flow

**On suggestion click:** Preview text becomes user message → detail prompt fires with streaming → tokens appear in real-time  
**On direct question:** Full transcript context → chat prompt → streaming response

Streaming uses raw SSE parsing of `ReadableStream` — first token appears within ~500ms.

### Error Handling

| Error | Handling |
|-------|----------|
| Mic denied | Toast with clear instructions |
| No API key | Settings opens automatically on first load |
| Invalid key (401) | Toast: "Invalid API key — check Settings" |
| Rate limit (429) | Toast with info, skip cycle, continue next |
| Blob too small | Skip silently |
| Network timeout | Retry once, then toast |
| JSON parse failure | Try regex extraction, then skip batch |

---

## Tradeoffs & Future Improvements

### What I'd Do With More Time

1. **Speaker diarization** — Whisper returns one text stream. Knowing who said what would improve suggestion relevance dramatically (e.g., "your colleague just asked X — here's a response")

2. **Real-time streaming transcription** — The 30-second chunking means suggestions lag by up to 30 seconds. Groq's ASR doesn't support streaming input today, but a WebSocket-based approach with partial results would improve latency

3. **Smart topic boundary detection** — Instead of a fixed character window, detect when the conversation shifts topic and adjust context accordingly

4. **Suggestion ranking** — Instead of showing all 3 suggestions equally, rank them by predicted usefulness and visually emphasize the top one

5. **Backend proxy** — For production, the API key should never be in the browser. A thin Vercel Edge Function proxy (~50 lines) would fix this while keeping the architecture simple

6. **Persistent sessions** — IndexedDB storage for multi-session history and cross-session context

### Known Limitations

- **CORS**: Groq's API may block browser-origin requests in some configurations. If this happens during demo, a Vercel Edge Function proxy is a 10-minute fix
- **Whisper chunk boundaries**: 30-second cuts sometimes land mid-sentence. The LLM handles this gracefully
- **First suggestion latency**: ~2-3 seconds after first transcript chunk (Whisper + GPT-OSS round trip)

---

## Deploy

```bash
npm run build        # Produces dist/
npx vercel --prod    # Deploy to Vercel
```

No environment variables needed — the API key is supplied by the user at runtime.

---

## Export Format

The export button generates a JSON file with the complete session:

```json
{
  "session_start": "2026-04-17T...",
  "session_end": "2026-04-17T...",
  "settings": { "suggestion_prompt": "...", "context_window_suggestions": 2000, ... },
  "transcript": [{ "timestamp": "...", "text": "..." }],
  "suggestion_batches": [{
    "timestamp": "...",
    "suggestions": [{ "type": "question", "preview": "...", "detail": "..." }]
  }],
  "chat": [{ "timestamp": "...", "role": "user", "content": "..." }]
}
```
