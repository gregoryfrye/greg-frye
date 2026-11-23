import type { ReactNode } from "react";
import { BeatHeader } from "@/app/components/ui/beat-header";

type SpineSectionProps = {
  label: string;
  subhead: string;
  /** Set by the case study page: the beat's letter (A, B, C …) and anchor for the chapter index. */
  marker?: string;
  id?: string;
  children: ReactNode;
};

/**
 * Narrative (the argument): the rule-and-label row (marker + functional
 * label), then the subhead as a big statement. Text-led: children render at
 * prose width except for ImageBlock variants that explicitly break the column.
 */
export function SpineSection({ label, subhead, marker, id, children }: SpineSectionProps) {
  return (
    <section id={id} className="mt-section scroll-mt-masthead first:mt-0">
      <BeatHeader marker={marker} label={label} />
      <h2 className="mt-block max-w-hero type-headline text-ink">{subhead}</h2>
      <div className="mt-block">{children}</div>
    </section>
  );
}
