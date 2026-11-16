import Link from "next/link";

/**
 * A numbered index of links (00 Narrative Strategy …), each row opened by a
 * rule. Figma 00_Index_1280: 27px serif, 99px marker column, 9px rhythm.
 */
export function NumberedList({ items, label }: { items: { label: string; href: string }[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col gap-item border-b border-border pb-item">
      {items.map((item, i) => (
        <li key={item.href} className="rule pt-item">
          <Link
            href={item.href}
            className="flex type-body text-ink no-underline transition-colors motion-fast ease-standard hover:text-muted"
          >
            <span className="w-index shrink-0">{String(i).padStart(2, "0")}</span>
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
