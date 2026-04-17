/**
 * API service layer — wraps fetch calls to Groq API.
 * All calls go direct to Groq with dangerouslyAllowBrowser via the SDK,
 * or via raw fetch for audio (FormData).
 */

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

/**
 * Transcribe audio blob via Groq Whisper API.
 */
export async function transcribeAudio(audioBlob, apiKey, model = 'whisper-large-v3') {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', model);
  formData.append('response_format', 'json');

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, error.error?.message || `Transcription failed (${response.status})`);
  }

  const data = await response.json();
  return data.text || '';
}

/**
 * Send chat completion request to Groq (non-streaming).
 * Used for suggestions (JSON output).
 */
export async function chatCompletion(messages, apiKey, options = {}) {
  const {
    model = 'openai/gpt-oss-120b',
    temperature = 0.7,
    maxTokens = 1024,
  } = options;

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, error.error?.message || `Chat completion failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Send streaming chat completion request to Groq.
 * Returns a ReadableStream that yields content chunks.
 */
export async function chatCompletionStream(messages, apiKey, options = {}) {
  const {
    model = 'openai/gpt-oss-120b',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, error.error?.message || `Streaming chat failed (${response.status})`);
  }

  return response.body;
}

/**
 * Parse SSE stream from Groq into content tokens.
 * Yields string chunks as they arrive.
 */
export async function* parseSSEStream(readableStream) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Custom API error class with status code.
 */
export class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}
