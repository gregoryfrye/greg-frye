/** An ongoing range reads "2026–": the content keeps "Present" (it sorts the cards), the page drops it to save space. */
export const showYears = (years: string) => years.replace(/–\s*Present$/i, "–");

/**
 * A year range, broken before the dash: the start year, then "–end" below it. One date treatment for
 * the work cards and the timeline. An ongoing range ("2026–") stays on one line.
 */
export function Years({ years, className = "" }: { years: string; className?: string }) {
  const shown = showYears(years);
  const parts = shown.endsWith("–") ? [shown] : shown.split("–");
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <span key={part} className="block">
          {i > 0 && "–"}
          {part}
        </span>
      ))}
    </span>
  );
}
