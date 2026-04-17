/**
 * Export session data as a downloadable JSON file.
 */
export function exportSession({ transcript, suggestionBatches, chatMessages, settings, sessionStart }) {
  const data = {
    session_start: sessionStart,
    session_end: new Date().toISOString(),
    settings: {
      suggestion_prompt: settings.suggestionPrompt,
      chat_prompt: settings.chatPrompt,
      detail_prompt: settings.detailPrompt,
      context_window_suggestions: settings.contextWindowSuggestions,
      context_window_chat: settings.contextWindowChat,
      refresh_interval: settings.refreshInterval,
      model: settings.model,
      whisper_model: settings.whisperModel,
    },
    transcript: transcript.map(c => ({
      timestamp: c.timestamp,
      text: c.text,
    })),
    suggestion_batches: suggestionBatches.map(b => ({
      timestamp: b.timestamp,
      suggestions: b.suggestions.map(s => ({
        type: s.type,
        preview: s.preview,
        detail: s.detail,
      })),
    })),
    chat: chatMessages.map(m => ({
      timestamp: m.timestamp,
      role: m.role,
      content: m.content,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twinmind-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
