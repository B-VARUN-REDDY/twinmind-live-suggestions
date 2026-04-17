import { useState, useCallback, useRef } from 'react';
import { transcribeAudio, APIError } from '../services/api';

/**
 * Hook for transcribing audio blobs via Groq Whisper API.
 *
 * @param {Object} options
 * @param {string} options.apiKey - Groq API key
 * @param {string} options.model - Whisper model name
 * @param {Function} options.onTranscript - Callback with new transcript text
 * @param {Function} options.onError - Error callback
 */
export function useTranscription({ apiKey, model = 'whisper-large-v3', onTranscript, onError }) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const retryCountRef = useRef(0);

  const transcribe = useCallback(async (audioBlob) => {
    if (!apiKey) {
      onError?.(new Error('No API key configured. Open Settings to add your Groq API key.'));
      return;
    }

    // Skip tiny blobs (silence detection)
    if (audioBlob.size < 5000) return;

    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(audioBlob, apiKey, model);

      if (text && text.trim()) {
        retryCountRef.current = 0;
        onTranscript?.({
          text: text.trim(),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.status === 401) {
          onError?.(new Error('Invalid API key. Check your Groq API key in Settings.'));
        } else if (err.status === 429) {
          onError?.(new Error('Rate limit reached. Suggestions will resume shortly.'));
        } else {
          // Retry once on server errors
          if (retryCountRef.current < 1) {
            retryCountRef.current++;
            setTimeout(() => transcribe(audioBlob), 2000);
            return;
          }
          onError?.(err);
        }
      } else {
        // Network error — retry once
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          setTimeout(() => transcribe(audioBlob), 2000);
          return;
        }
        onError?.(new Error('Network error during transcription. Check your connection.'));
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [apiKey, model, onTranscript, onError]);

  return {
    isTranscribing,
    transcribe,
  };
}
