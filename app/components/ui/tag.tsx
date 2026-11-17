import type { ElementType, ReactNode } from "react";

/**
 * Boxed collection tag: the one treatment for naming a collection
 * (Roles, Clients, Artifacts …), on cards and as a section heading.
 * `as` sets the element so a heading stays a heading.
 */
export function Tag({
  as: Element = "span",
  id,
  className = "",
  children,
}: {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Element id={id} className={`w-fit border border-border px-inline py-item type-label text-ink ${className}`}>
      {children}
    </Element>
  );
}
