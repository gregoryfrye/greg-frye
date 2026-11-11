import type { ReactNode } from "react";
import { BeatHeader } from "@/app/components/ui/beat-header";

type Layout = "stack" | "thirds" | "halves";

/**
 * One beat of the case study: header row, a big statement, optional body and
 * media. The same module serves story beats (marker A, B, C …), chapters
 * (00, 01 …) and Results. Three layouts from Figma 01_Client_1280:
 *
 * - stack:  statement full width, media full width below          (A Situation)
 * - thirds: statement · body · media in three columns;
 *           mediaFirst puts media in the first column             (B Complication, Results)
 * - halves: media on one half, header + statement on the other    (04 Approach)
 *
 * Source order is always header, statement, body, media, so compact screens
 * and screen readers get the argument first; wide screens reorder visually.
 */
export function Beat({
  id,
  marker,
  label,
  statement,
  children,
  media,
  layout = "stack",
  mediaFirst = false,
}: {
  id?: string;
  marker?: string;
  label: string;
  statement: string;
  children?: ReactNode;
  media?: ReactNode;
  layout?: Layout;
  mediaFirst?: boolean;
}) {
  const heading = (
    <>
      <BeatHeader marker={marker} label={label} />
      <h2 className="mt-block type-display text-ink">{statement}</h2>
    </>
  );
  const body = children ? <div className="type-body text-ink [&>*+*]:mt-block">{children}</div> : null;

  if (layout === "stack") {
    return (
      <section id={id} className="scroll-mt-masthead">
        {heading}
        {body && <div className="mt-block max-w-prose">{body}</div>}
        {media && <div className="mt-block">{media}</div>}
      </section>
    );
  }

  if (layout === "halves") {
    return (
      <section id={id} className="grid scroll-mt-masthead grid-cols-1 gap-x-gutter gap-y-block md:grid-cols-2">
        <div className={mediaFirst ? "md:order-2" : ""}>
          {heading}
          {body && <div className="mt-block">{body}</div>}
        </div>
        {media && <div className={mediaFirst ? "md:order-1" : ""}>{media}</div>}
      </section>
    );
  }

  return (
    <section id={id} className="grid scroll-mt-masthead grid-cols-1 items-start gap-x-gutter gap-y-block md:grid-cols-3">
      <div className={mediaFirst ? "md:order-2" : ""}>{heading}</div>
      <div className={mediaFirst ? "md:order-3" : ""}>{body}</div>
      {media && <div className={mediaFirst ? "md:order-1" : ""}>{media}</div>}
    </section>
  );
}
