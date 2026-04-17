import { useState, useCallback, useRef, useEffect } from 'react';
import TranscriptPanel from './components/TranscriptPanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import ExportButton from './components/ExportButton';
import { ToastContainer, useToasts } from './components/Toast';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTranscription } from './hooks/useTranscription';
import { useSuggestions } from './hooks/useSuggestions';
import { useChat } from './hooks/useChat';
import { DEFAULT_SETTINGS } from './prompts/defaults';
import { exportSession } from './utils/export';
import './index.css';

const STORAGE_KEY = 'twinmind-settings';

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export default function App() {
  // ── State ──
  const [settings, setSettings] = useState(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sessionStart] = useState(new Date().toISOString());
  const { toasts, addToast, dismissToast } = useToasts();

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  // Auto-open settings if no API key
  useEffect(() => {
    if (!settings.apiKey) {
      setIsSettingsOpen(true);
    }
  }, []);

  // ── Error handler ──
  const handleError = useCallback((err) => {
    addToast(err.message || 'An unexpected error occurred.', 'error');
  }, [addToast]);

  // ── Suggestions hook ──
  const {
    suggestionBatches,
    isGenerating,
    conversationSummary,
    generateSuggestions,
  } = useSuggestions({
    apiKey: settings.apiKey,
    settings,
    onError: handleError,
  });

  // ── Chat hook ──
  const {
    chatMessages,
    isStreaming,
    sendMessage,
    sendSuggestionDetail,
  } = useChat({
    apiKey: settings.apiKey,
    settings,
    onError: handleError,
  });

  // ── Transcription hook ──
  const { isTranscribing, transcribe } = useTranscription({
    apiKey: settings.apiKey,
    model: settings.whisperModel,
    onTranscript: useCallback((chunk) => {
      setTranscript(prev => {
        const updated = [...prev, chunk];
        // Trigger suggestions after transcription
        generateSuggestions(updated);
        return updated;
      });
    }, [generateSuggestions]),
    onError: handleError,
  });

  // ── Audio recorder hook ──
  const { isRecording, toggleRecording } = useAudioRecorder({
    timeslice: settings.refreshInterval * 1000,
    onAudioChunk: useCallback((blob) => {
      transcribe(blob);
    }, [transcribe]),
    onError: handleError,
  });

  // ── Handlers ──
  const handleSettingsSave = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    addToast('Settings saved.', 'success', 3000);
  }, [addToast]);

  const handleRefresh = useCallback(() => {
    if (transcriptRef.current.length > 0) {
      generateSuggestions(transcriptRef.current);
      addToast('Refreshing suggestions...', 'info', 2000);
    }
  }, [generateSuggestions, addToast]);

  const handleSuggestionClick = useCallback((suggestion) => {
    sendSuggestionDetail(suggestion, transcriptRef.current, conversationSummary);
  }, [sendSuggestionDetail, conversationSummary]);

  const handleChatSend = useCallback((content) => {
    sendMessage(content, transcriptRef.current, conversationSummary);
  }, [sendMessage, conversationSummary]);

  const handleExport = useCallback(() => {
    exportSession({
      transcript,
      suggestionBatches,
      chatMessages,
      settings,
      sessionStart,
    });
    addToast('Session exported.', 'success', 3000);
  }, [transcript, suggestionBatches, chatMessages, settings, sessionStart, addToast]);

  const handleToggleRecording = useCallback(() => {
    if (!settings.apiKey && !isRecording) {
      addToast('Please add your Groq API key in Settings first.', 'error');
      setIsSettingsOpen(true);
      return;
    }
    toggleRecording();
  }, [settings.apiKey, isRecording, toggleRecording, addToast]);

  // ── Render ──
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-indigo)] to-[var(--color-accent-violet)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h1 className="text-base font-semibold gradient-text">TwinMind</h1>
          {isRecording && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/15 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            onClick={handleExport}
            disabled={transcript.length === 0 && chatMessages.length === 0}
          />
          <button
            id="settings-button"
            onClick={() => setIsSettingsOpen(true)}
            className="
              p-2 rounded-lg text-[var(--color-text-muted)]
              hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]
              transition-colors cursor-pointer
            "
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Three-Column Layout ── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Transcript (30%) */}
        <div className="w-[30%] min-w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)]">
          <TranscriptPanel
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            transcript={transcript}
            onToggleRecording={handleToggleRecording}
          />
        </div>

        {/* Center: Suggestions (35%) */}
        <div className="w-[35%] min-w-72 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)]">
          <SuggestionsPanel
            suggestionBatches={suggestionBatches}
            isGenerating={isGenerating}
            isRecording={isRecording}
            onRefresh={handleRefresh}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Right: Chat (35%) */}
        <div className="flex-1 min-w-72 bg-[var(--color-bg-panel)]">
          <ChatPanel
            chatMessages={chatMessages}
            isStreaming={isStreaming}
            onSendMessage={handleChatSend}
          />
        </div>
      </main>

      {/* ── Modals & Overlays ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
