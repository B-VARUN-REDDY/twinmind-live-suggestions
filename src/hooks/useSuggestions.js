import { useState, useCallback, useRef } from 'react';
import { chatCompletion, APIError } from '../services/api';
import {
  getRecentContext,
  getFullTranscript,
  fillPromptTemplate,
  formatPreviousSuggestions,
} from '../utils/contextWindow';
import { DEFAULT_SUMMARY_PROMPT } from '../prompts/defaults';

/**
 * Hook for generating live suggestions based on transcript context.
 *
 * @param {Object} options
 * @param {string} options.apiKey
 * @param {Object} options.settings
 * @param {Function} options.onError
 */
export function useSuggestions({ apiKey, settings, onError }) {
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationSummary, setConversationSummary] = useState('');
  const cycleCountRef = useRef(0);

  /**
   * Update conversation summary (called every 3 cycles).
   */
  const updateSummary = useCallback(async (transcriptChunks) => {
    if (transcriptChunks.length === 0) return;

    const fullText = getFullTranscript(transcriptChunks, 4000);
    const prompt = fillPromptTemplate(DEFAULT_SUMMARY_PROMPT, {
      fullTranscript: fullText,
    });

    try {
      const summary = await chatCompletion(
        [{ role: 'user', content: prompt }],
        apiKey,
        { model: settings.model, temperature: 0.3, maxTokens: 150 }
      );
      setConversationSummary(summary);
    } catch {
      // Non-critical — keep old summary
    }
  }, [apiKey, settings.model]);

  /**
   * Generate a new batch of 3 suggestions.
   */
  const generateSuggestions = useCallback(async (transcriptChunks) => {
    if (!apiKey || transcriptChunks.length === 0) return;

    setIsGenerating(true);
    cycleCountRef.current++;

    try {
      // Update summary every 3 cycles
      if (cycleCountRef.current % 3 === 1) {
        await updateSummary(transcriptChunks);
      }

      const recentContext = getRecentContext(
        transcriptChunks,
        settings.contextWindowSuggestions
      );

      const previousSuggestions = formatPreviousSuggestions(suggestionBatches, 2);

      const prompt = fillPromptTemplate(settings.suggestionPrompt, {
        conversationSummary: conversationSummary || 'Not yet determined.',
        recentContext,
        previousSuggestions,
      });

      const response = await chatCompletion(
        [{ role: 'user', content: prompt }],
        apiKey,
        { model: settings.model, temperature: 0.7, maxTokens: 1024 }
      );

      // Parse JSON from response (handle markdown code blocks and object-wrapped arrays)
      let suggestions = null;
      try {
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        
        let parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          suggestions = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // If the model returns {"suggestions": [...]} instead of just [...]
          const keys = Object.keys(parsed);
          for (const key of keys) {
            if (Array.isArray(parsed[key])) {
              suggestions = parsed[key];
              break;
            }
          }
        }
      } catch (e1) {
        // Fallback: Use Regex to extract the first valid JSON Array
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            suggestions = JSON.parse(arrayMatch[0]);
          } catch (e2) {
            console.error('TwinMind Debug: Regex array parsing failed', e2);
          }
        }
      }

      if (!suggestions || !Array.isArray(suggestions)) {
        console.error('TwinMind Debug: Raw LLM Output:', response);
        throw new Error('LLM failed to return a valid JSON array format.');
      }

      // Validate and normalize
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Invalid suggestion format');
      }

      const validTypes = ['question', 'talking_point', 'answer', 'fact_check', 'insight'];
      const normalized = suggestions.slice(0, 3).map(s => ({
        type: validTypes.includes(s.type) ? s.type : 'insight',
        preview: s.preview || 'No preview available',
        detail: s.detail || s.preview || '',
        id: crypto.randomUUID(),
      }));

      const batch = {
        timestamp: new Date().toISOString(),
        suggestions: normalized,
        id: crypto.randomUUID(),
      };

      setSuggestionBatches(prev => [batch, ...prev]);
    } catch (err) {
      if (err instanceof APIError) {
        if (err.status === 429) {
          onError?.(new Error('Rate limit reached. Suggestions will resume next cycle.'));
        } else if (err.status === 401) {
          onError?.(new Error('Invalid API key. Check Settings.'));
        } else {
          onError?.(err);
        }
      } else {
        onError?.(new Error('Failed to generate suggestions: ' + err.message));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, settings, conversationSummary, suggestionBatches, updateSummary, onError]);

  const clearSuggestions = useCallback(() => {
    setSuggestionBatches([]);
    setConversationSummary('');
    cycleCountRef.current = 0;
  }, []);

  return {
    suggestionBatches,
    isGenerating,
    conversationSummary,
    generateSuggestions,
    clearSuggestions,
  };
}
