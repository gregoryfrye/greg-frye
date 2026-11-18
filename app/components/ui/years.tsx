/**
 * A year range, broken before the dash: the start year, then "–end" below it. One date treatment for
 * the work cards and the timeline.
 */
export function Years({ years, className = "" }: { years: string; className?: string }) {
  return (
    <span className={className}>
      {years.split("–").map((part, i) => (
        <span key={part} className="block">
          {i > 0 && "–"}
          {part}
        </span>
      ))}
    </span>
  );
}
