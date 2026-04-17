/**
 * SuggestionCard — Individual suggestion with type badge and click-to-chat.
 */

const TYPE_CONFIG = {
  question: {
    label: 'Question',
    color: 'var(--color-badge-question)',
    emoji: '❓',
  },
  talking_point: {
    label: 'Talking Point',
    color: 'var(--color-badge-talking)',
    emoji: '💬',
  },
  answer: {
    label: 'Answer',
    color: 'var(--color-badge-answer)',
    emoji: '💡',
  },
  fact_check: {
    label: 'Fact Check',
    color: 'var(--color-badge-factcheck)',
    emoji: '🔍',
  },
  insight: {
    label: 'Insight',
    color: 'var(--color-badge-insight)',
    emoji: '✨',
  },
};

export default function SuggestionCard({ suggestion, onClick, index = 0 }) {
  const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.insight;

  return (
    <button
      id={`suggestion-card-${suggestion.id}`}
      onClick={() => onClick(suggestion)}
      className="
        w-full text-left glass-card p-4 cursor-pointer
        group focus:outline-none focus:ring-1 focus:ring-[var(--color-border-accent)]
      "
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'backwards',
        animation: 'slide-up 0.35s ease-out',
      }}
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${config.color}20`,
            color: config.color,
          }}
        >
          <span>{config.emoji}</span>
          {config.label}
        </span>
      </div>

      {/* Preview text */}
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed group-hover:text-white transition-colors">
        {suggestion.preview}
      </p>

      {/* Click hint */}
      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-[10px] text-[var(--color-text-muted)]">Click for details</span>
      </div>
    </button>
  );
}
