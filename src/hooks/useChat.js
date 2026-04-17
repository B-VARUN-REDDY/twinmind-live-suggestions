import { useState, useCallback, useRef } from 'react';
import { chatCompletionStream, chatCompletion, parseSSEStream, APIError } from '../services/api';
import {
  getFullTranscript,
  getRecentContext,
  fillPromptTemplate,
  formatChatHistory,
} from '../utils/contextWindow';

/**
 * Hook for managing the chat panel with streaming responses.
 *
 * @param {Object} options
 * @param {string} options.apiKey
 * @param {Object} options.settings
 * @param {Function} options.onError
 */
export function useChat({ apiKey, settings, onError }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Send a message and get a streaming response.
   */
  const sendMessage = useCallback(async (content, transcriptChunks, conversationSummary = '') => {
    if (!apiKey) {
      onError?.(new Error('No API key configured. Open Settings to add your Groq API key.'));
      return;
    }
    if (!content.trim()) return;

    // Add user message
    const userMsg = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Build assistant message placeholder
    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    setChatMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      const fullTranscript = getFullTranscript(transcriptChunks, settings.contextWindowChat);
      const chatHistory = formatChatHistory([...chatMessages, userMsg]);

      const prompt = fillPromptTemplate(settings.chatPrompt, {
        fullTranscript,
        chatHistory,
      });

      const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: content.trim() },
      ];

      const stream = await chatCompletionStream(messages, apiKey, {
        model: settings.model,
        temperature: 0.7,
        maxTokens: 2048,
      });

      let fullContent = '';
      for await (const chunk of parseSSEStream(stream)) {
        fullContent += chunk;
        const updatedContent = fullContent;
        setChatMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: updatedContent };
          }
          return updated;
        });
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.status === 401) {
          onError?.(new Error('Invalid API key. Check Settings.'));
        } else if (err.status === 429) {
          onError?.(new Error('Rate limit reached. Try again in a moment.'));
        } else {
          onError?.(err);
        }
      } else {
        onError?.(new Error('Chat error: ' + err.message));
      }

      // Remove the empty assistant message on error
      setChatMessages(prev => {
        if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [apiKey, settings, chatMessages, onError]);

  /**
   * Handle clicking a suggestion card — sends detail prompt + auto-sends to chat.
   */
  const sendSuggestionDetail = useCallback(async (suggestion, transcriptChunks, conversationSummary = '') => {
    if (!apiKey) {
      onError?.(new Error('No API key configured. Open Settings.'));
      return;
    }

    // Add the suggestion preview as a user message
    const userMsg = {
      role: 'user',
      content: suggestion.preview,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      isSuggestion: true,
      suggestionType: suggestion.type,
    };

    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      const recentContext = getRecentContext(transcriptChunks, settings.contextWindowSuggestions);

      const detailPrompt = fillPromptTemplate(settings.detailPrompt, {
        conversationSummary: conversationSummary || 'Meeting in progress.',
        recentContext,
        suggestionType: suggestion.type,
        suggestionPreview: suggestion.preview,
      });

      const messages = [
        { role: 'system', content: detailPrompt },
        { role: 'user', content: `Expand on this: ${suggestion.preview}` },
      ];

      const stream = await chatCompletionStream(messages, apiKey, {
        model: settings.model,
        temperature: 0.7,
        maxTokens: 2048,
      });

      let fullContent = '';
      for await (const chunk of parseSSEStream(stream)) {
        fullContent += chunk;
        const updatedContent = fullContent;
        setChatMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: updatedContent };
          }
          return updated;
        });
      }
    } catch (err) {
      onError?.(new Error('Detail fetch error: ' + err.message));
      setChatMessages(prev => {
        if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [apiKey, settings, onError]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  return {
    chatMessages,
    isStreaming,
    sendMessage,
    sendSuggestionDetail,
    clearChat,
  };
}
