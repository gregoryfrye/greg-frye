import type { ReactNode } from "react";

type ProjectSectionProps = {
  title: string;
  id?: string;
  marker?: string;
  summary?: string;
  children: ReactNode;
};

/**
 * Projects (the evidence): the chapter's number and title as the label (the
 * same pair the chapter index shows), the summary as its opening line, then
 * the project's text and images in the reading column.
 */
export function ProjectSection({ title, id, marker, summary, children }: ProjectSectionProps) {
  return (
    <section id={id} className="mt-section scroll-mt-masthead first:mt-0">
      <p className="flex type-label text-ink">
        {marker && <span className="w-marker shrink-0">{marker}</span>}
        <span>{title}</span>
      </p>
      {summary && <p className="mt-block type-body-lede text-ink">{summary}</p>}
      <div className="mt-block">{children}</div>
    </section>
  );
}
