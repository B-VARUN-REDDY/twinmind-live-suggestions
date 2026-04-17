import { useRef, useEffect } from 'react';

/**
 * TranscriptPanel — Left column.
 * Shows mic button + scrolling transcript.
 */
export default function TranscriptPanel({
  isRecording,
  isTranscribing,
  transcript,
  onToggleRecording,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Transcript
        </h2>
        {isTranscribing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-violet)] animate-pulse" />
            <span className="text-xs text-[var(--color-text-muted)]">Transcribing...</span>
          </div>
        )}
      </div>

      {/* Transcript content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
      >
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <div className="text-4xl">🎙️</div>
            <p className="text-sm text-[var(--color-text-muted)] max-w-48">
              {isRecording
                ? 'Listening... speak and your words will appear here'
                : 'Tap the mic button below to start recording'}
            </p>
          </div>
        ) : (
          transcript.map((chunk, index) => (
            <div
              key={index}
              className="animate-[slide-up_0.3s_ease-out]"
            >
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] block mb-1">
                {new Date(chunk.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                {chunk.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Mic button */}
      <div className="flex justify-center py-5 border-t border-[var(--color-border-subtle)]">
        <button
          id="mic-toggle-button"
          onClick={onToggleRecording}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-300 cursor-pointer
            ${isRecording
              ? 'bg-[var(--color-recording-red)] text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'
            }
          `}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-[pulse-ring_2s_ease-in-out_infinite]" />
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isRecording ? (
              /* Stop icon */
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            ) : (
              /* Mic icon */
              <>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
