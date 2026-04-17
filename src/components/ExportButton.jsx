/**
 * ExportButton — Downloads the full session as JSON.
 */
export default function ExportButton({ onClick, disabled }) {
  return (
    <button
      id="export-session-button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]
        hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]
        disabled:opacity-30 disabled:cursor-not-allowed
        transition-all duration-200 cursor-pointer
      "
      title="Export session data as JSON"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export
    </button>
  );
}
