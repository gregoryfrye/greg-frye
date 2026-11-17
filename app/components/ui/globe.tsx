/**
 * The globe mark (the favicon, drawn at any size): placeholder for the animated
 * world-building moment. Ink lines at the line weight, however large it's drawn.
 */
export function Globe({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`fill-none stroke-current stroke-1 text-ink ${className}`}>
      <g vectorEffect="non-scaling-stroke" strokeLinecap="round">
        <circle cx="16" cy="16" r="15" vectorEffect="non-scaling-stroke" />
        <ellipse cx="16" cy="16" rx="7.5" ry="15" vectorEffect="non-scaling-stroke" />
        <line x1="16" y1="1" x2="16" y2="31" vectorEffect="non-scaling-stroke" />
        <line x1="1" y1="16" x2="31" y2="16" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
