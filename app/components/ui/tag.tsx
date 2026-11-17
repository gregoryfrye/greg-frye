import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Boxed tag: the one outlined-label treatment. Names a collection on cards
 * (Client, Project, Artifact) and doubles as a button (the contact Send).
 * `as` sets the element; other props pass through (type, onClick …).
 */
export function Tag<T extends ElementType = "span">({
  as,
  className = "",
  children,
  ...rest
}: { as?: T; className?: string; children: ReactNode } & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">) {
  const Element = (as ?? "span") as ElementType;
  return (
    <Element className={`w-fit border border-border px-inline py-item type-label text-ink ${className}`} {...rest}>
      {children}
    </Element>
  );
}
