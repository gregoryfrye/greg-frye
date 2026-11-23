import type { ReactNode } from "react";
import { BeatHeader } from "@/app/components/ui/beat-header";

type ProjectSectionProps = {
  title: string;
  /** The chapter's number (01, 02 …) and anchor for the chapter index. */
  marker?: string;
  id?: string;
  summary?: string;
  children: ReactNode;
};

/**
 * Projects (the evidence): named, image-forward units. The same rule-and-label
 * row as a spine beat, numbered instead of lettered, with the project's title
 * as the label and its summary as a deck instead of a big statement: the mode
 * change from argument to evidence.
 */
export function ProjectSection({ title, marker, id, summary, children }: ProjectSectionProps) {
  return (
    <section id={id} className="mt-section scroll-mt-masthead first:mt-0">
      <BeatHeader marker={marker} label={title} />
      {summary && <p className="mt-block max-w-hero type-deck text-ink">{summary}</p>}
      <div className="mt-block">{children}</div>
    </section>
  );
}
