import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../prompts/defaults';

/**
 * SettingsModal — Overlay for configuring API key, prompts, and parameters.
 */
export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleResetPrompt = (key) => {
    setLocalSettings(prev => ({ ...prev, [key]: DEFAULT_SETTINGS[key] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="
          w-full max-w-2xl max-h-[85vh] overflow-y-auto
          bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]
          rounded-2xl shadow-2xl animate-[slide-up_0.3s_ease-out]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] sticky top-0 bg-[var(--color-bg-secondary)] z-10">
          <h2 className="text-lg font-semibold gradient-text">Settings</h2>
          <button
            id="settings-close-button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Groq API Key
            </label>
            <input
              id="settings-api-key"
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="gsk_..."
              className="
                w-full px-4 py-2.5 rounded-xl text-sm font-mono
                bg-[var(--color-bg-input)] text-[var(--color-text-primary)]
                border border-[var(--color-border-subtle)]
                focus:outline-none focus:border-[var(--color-border-accent)]
                placeholder:text-[var(--color-text-muted)]
                transition-colors
              "
            />
            <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
              Get your key at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-violet)] hover:underline">
                console.groq.com/keys
              </a>
            </p>
          </div>

          <hr className="border-[var(--color-border-subtle)]" />

          {/* Suggestion Prompt */}
          <PromptField
            id="settings-suggestion-prompt"
            label="Live Suggestion Prompt"
            value={localSettings.suggestionPrompt}
            onChange={(v) => handleChange('suggestionPrompt', v)}
            onReset={() => handleResetPrompt('suggestionPrompt')}
          />

          {/* Chat Prompt */}
          <PromptField
            id="settings-chat-prompt"
            label="Chat Prompt"
            value={localSettings.chatPrompt}
            onChange={(v) => handleChange('chatPrompt', v)}
            onReset={() => handleResetPrompt('chatPrompt')}
          />

          {/* Detail Prompt */}
          <PromptField
            id="settings-detail-prompt"
            label="Detail Answer Prompt (on suggestion click)"
            value={localSettings.detailPrompt}
            onChange={(v) => handleChange('detailPrompt', v)}
            onReset={() => handleResetPrompt('detailPrompt')}
          />

          <hr className="border-[var(--color-border-subtle)]" />

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-6">
            <SliderField
              id="settings-context-suggestions"
              label="Context Window — Suggestions"
              value={localSettings.contextWindowSuggestions}
              onChange={(v) => handleChange('contextWindowSuggestions', v)}
              min={500}
              max={6000}
              step={250}
              unit="chars"
            />
            <SliderField
              id="settings-context-chat"
              label="Context Window — Chat"
              value={localSettings.contextWindowChat}
              onChange={(v) => handleChange('contextWindowChat', v)}
              min={1000}
              max={16000}
              step={500}
              unit="chars"
            />
            <SliderField
              id="settings-refresh-interval"
              label="Refresh Interval"
              value={localSettings.refreshInterval}
              onChange={(v) => handleChange('refreshInterval', v)}
              min={15}
              max={60}
              step={5}
              unit="sec"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-subtle)] sticky bottom-0 bg-[var(--color-bg-secondary)]">
          <button
            id="settings-cancel-button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="settings-save-button"
            onClick={handleSave}
            className="
              px-5 py-2 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-violet)]
              hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)]
              transition-all duration-200 cursor-pointer
            "
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptField({ id, label, value, onChange, onReset }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
        <button
          onClick={onReset}
          className="text-[10px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent-violet)] transition-colors cursor-pointer"
        >
          Reset to default
        </button>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="
          w-full px-4 py-3 rounded-xl text-xs font-mono leading-relaxed
          bg-[var(--color-bg-input)] text-[var(--color-text-primary)]
          border border-[var(--color-border-subtle)]
          focus:outline-none focus:border-[var(--color-border-accent)]
          resize-y min-h-24 transition-colors
        "
      />
    </div>
  );
}

function SliderField({ id, label, value, onChange, min, max, step, unit }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--color-accent-violet)]"
        />
        <span className="text-sm font-mono text-[var(--color-text-secondary)] min-w-16 text-right">
          {value} {unit}
        </span>
      </div>
    </div>
  );
}
