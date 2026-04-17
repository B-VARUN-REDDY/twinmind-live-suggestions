import SuggestionCard from './SuggestionCard';

/**
 * SuggestionsPanel — Middle column.
 * Displays suggestion batches with newest at top.
 */
export default function SuggestionsPanel({
  suggestionBatches,
  isGenerating,
  isRecording,
  onRefresh,
  onSuggestionClick,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Live Suggestions
        </h2>
        <button
          id="refresh-suggestions-button"
          onClick={onRefresh}
          disabled={isGenerating || !isRecording}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]
            hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 cursor-pointer
          "
          title="Manually refresh suggestions"
        >
          <svg
            className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {suggestionBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            {isGenerating ? (
              <>
                {/* Skeleton loading cards */}
                <div className="w-full space-y-3">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="shimmer-bg rounded-[var(--radius-lg)] h-24"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl">💡</div>
                <p className="text-sm text-[var(--color-text-muted)] max-w-48">
                  {isRecording
                    ? 'Generating suggestions from your conversation...'
                    : 'Start recording to get live AI suggestions'}
                </p>
              </>
            )}
          </div>
        ) : (
          suggestionBatches.map((batch) => (
            <div key={batch.id} className="space-y-2">
              {/* Batch timestamp */}
              <div className="flex items-center gap-3 px-1">
                <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                  {new Date(batch.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
              </div>

              {/* Suggestion cards */}
              <div className="space-y-2">
                {batch.suggestions.map((suggestion, i) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={onSuggestionClick}
                    index={i}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
