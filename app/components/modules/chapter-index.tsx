"use client";

import { useEffect, useRef, useState } from "react";

/** `marker` overrides the position number (a case study letters its beats A, B, C and numbers its projects). */
export type Chapter = { id: string; label: string; marker?: string };

/**
 * The case study's numbered chapter list (00 Narrative Strategy …), sticky
 * beside the story on wide screens. The chapter in view is ink; the rest are
 * faint (see kit/color.md: faint fails AA for text, open for the Visual
 * Design Pass). Works without JS: plain anchor links, first chapter current.
 *
 * `collapsible` (the wide-screen copy): once the list sticks, it folds to the
 * chapter you're reading and opens again on hover or keyboard focus.
 */
export function ChapterIndex({ chapters, collapsible = false }: { chapters: Chapter[]; collapsible?: boolean }) {
  const [current, setCurrent] = useState(chapters[0]?.id);
  const [covered, setCovered] = useState(false);
  const [stuck, setStuck] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const start = useRef<HTMLSpanElement>(null);
  const folded = collapsible && stuck;

  // Full-width images ([data-breakout]) run under the sticky index; it steps aside while one passes.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const box = nav.current?.getBoundingClientRect();
      if (!box || box.height === 0) return;
      const hit = [...document.querySelectorAll("[data-breakout]")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < box.bottom && r.bottom > box.top && r.left < box.right && r.right > box.left;
      });
      setCovered(hit);
      // Stuck: the list has left its place in the flow (the marker just above it has scrolled past).
      const origin = start.current?.getBoundingClientRect().top;
      setStuck(origin !== undefined && origin < box.top - 1);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // Images loading above shift the page without a scroll event; re-check when the page grows.
    const grow = new ResizeObserver(onScroll);
    grow.observe(document.body);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); grow.disconnect(); cancelAnimationFrame(frame); };
  }, []);

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
    <>
    <span ref={start} aria-hidden="true" className="block" />
    <nav
      ref={nav}
      aria-label="Chapters"
      className={`group transition-opacity motion-normal ease-standard md:sticky md:top-masthead ${covered ? "pointer-events-none opacity-0" : ""}`}
    >
      <ol>
        {chapters.map((chapter, i) => {
          const isCurrent = chapter.id === current;
          // Folded: only the current chapter shows (with its own top rule); hover or focus opens the rest.
          const fold = !folded
            ? ""
            : isCurrent
              ? i > 0 ? "border-t group-hover:border-t-0 group-focus-within:border-t-0" : ""
              : "hidden group-hover:block group-focus-within:block";
          return (
            <li key={chapter.id} className={`border-b border-border first:border-t ${fold}`}>
              <a
                href={`#${chapter.id}`}
                aria-current={isCurrent ? "location" : undefined}
                className={`flex py-item type-label no-underline transition-colors motion-normal ease-standard hover:text-ink ${
                  isCurrent ? "text-ink" : "text-faint"
                }`}
              >
                <span className="w-marker shrink-0">{chapter.marker ?? String(i).padStart(2, "0")}</span>
                <span>{chapter.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
    </>
  );
}
