import Link from "next/link";

/**
 * The index list: links in ruled rows, type-body-small (18, like the rest of
 * the Times text), 9px rhythm. One style for
 * every list of services or skills. `numbered` adds the 00, 01 … marker
 * column (Figma 00_Index_1280, 99px), used where order means something.
 */
export function NumberedList({
  items,
  label,
  numbered = true,
  className = "",
}: {
  items: { label: string; href: string }[];
  label: string;
  numbered?: boolean;
  className?: string;
}) {
  return (
    <ol aria-label={label} className={`flex flex-col border-b border-border ${className}`}>
      {items.map((item, i) => (
        <li key={item.href} className="rule break-inside-avoid py-item">
          <Link
            href={item.href}
            className="flex type-body-small text-ink no-underline transition-colors motion-fast ease-standard hover:text-muted"
          >
            {numbered && <span className="w-index shrink-0">{String(i).padStart(2, "0")}</span>}
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
