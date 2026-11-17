"use client";

import { useEffect, useState } from "react";

export type Chapter = { id: string; label: string };

/**
 * The case study's numbered chapter list (00 Narrative Strategy …), sticky
 * beside the story on wide screens. The chapter in view is ink; the rest are
 * faint (see kit/color.md: faint fails AA for text, open for the Visual
 * Design Pass). Works without JS: plain anchor links, first chapter current.
 */
export function ChapterIndex({ chapters }: { chapters: Chapter[] }) {
  const [current, setCurrent] = useState(chapters[0]?.id);

  useEffect(() => {
    const targets = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav aria-label="Chapters" className="md:sticky md:top-masthead">
      <ol>
        {chapters.map((chapter, i) => {
          const isCurrent = chapter.id === current;
          return (
            <li key={chapter.id} className="border-b border-border first:border-t">
              <a
                href={`#${chapter.id}`}
                aria-current={isCurrent ? "location" : undefined}
                className={`flex py-item type-label no-underline transition-colors motion-normal ease-standard hover:text-ink ${
                  isCurrent ? "text-ink" : "text-faint"
                }`}
              >
                <span className="w-marker shrink-0">{String(i).padStart(2, "0")}</span>
                <span>{chapter.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
