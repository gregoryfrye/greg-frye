import type { ReactNode } from "react";

type SpineSectionProps = {
  label: string;
  subhead: string;
  /** Set by the case study page: the anchor the chapter index jumps to. */
  id?: string;
  marker?: string;
  children: ReactNode;
};

/**
 * Narrative (the argument): the functional label, then the subhead as the
 * section's opening line, then the text. One reading column; ImageBlocks sit
 * in the same column.
 */
export function SpineSection({ label, subhead, id, children }: SpineSectionProps) {
  return (
    <section id={id} className="mt-section scroll-mt-masthead first:mt-0">
      <p className="type-label text-ink">{label}</p>
      <h2 className="mt-block type-body-lede text-ink">{subhead}</h2>
      <div className="mt-block">{children}</div>
    </section>
  );
}
