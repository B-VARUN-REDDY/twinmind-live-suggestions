/**
 * Context window utilities for managing transcript context
 * sent to the LLM for suggestions vs. chat.
 */

/**
 * Get the most recent portion of the transcript as a single string,
 * limited by character count.
 */
export function getRecentContext(transcriptChunks, maxChars = 2000) {
  const fullText = transcriptChunks.map(c => c.text).join(' ');
  if (fullText.length <= maxChars) return fullText;
  return '...' + fullText.slice(-maxChars);
}

/**
 * Get the full transcript as a single string, optionally limited.
 */
export function getFullTranscript(transcriptChunks, maxChars = 8000) {
  const fullText = transcriptChunks.map(c => c.text).join(' ');
  if (fullText.length <= maxChars) return fullText;
  return '...' + fullText.slice(-maxChars);
}

/**
 * Format chat history for inclusion in prompts.
 */
export function formatChatHistory(messages) {
  return messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
}

/**
 * Fill template placeholders in a prompt string.
 * Replaces {key} with values from the data object.
 */
export function fillPromptTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

/**
 * Format previous suggestions to avoid repetition in next batch.
 */
export function formatPreviousSuggestions(batches, count = 1) {
  const recent = batches.slice(0, count);
  const suggestions = recent.flatMap(b => b.suggestions);
  if (suggestions.length === 0) return 'None yet.';
  return suggestions.map(s => `- [${s.type}] ${s.preview}`).join('\n');
}
