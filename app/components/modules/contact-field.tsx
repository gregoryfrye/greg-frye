"use client";

import { useState } from "react";
import { Arrow } from "@/app/components/ui/arrow";
import { Tag } from "@/app/components/ui/tag";
import { INLINE_LINK } from "@/app/components/ui/inline-link";

/**
 * The contact field: a full-width band below the footer, tinted 10% black so it
 * reads as an oversized input. The text takes the hero headline's two columns. No prompt: an idle blinking caret until it's
 * used, then the real one. The email sits top right and Send, a boxed tag, bottom right, both on the
 * footer's right edge. Hands off to
 * the visitor's email app: no form backend, nothing stored here.
 */
export function ContactField({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);
  const href = `mailto:${email}?subject=${encodeURIComponent("Hello from gregfrye.us")}&body=${encodeURIComponent(message)}`;

  return (
    <section id="contact" aria-label="Contact" className="scroll-mt-40 bg-input">
      <form
        className="mx-auto grid max-w-wide grid-cols-1 gap-gutter px-gutter pt-section pb-gutter md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          window.location.href = href;
        }}
      >
        <label htmlFor="contact-message" className="sr-only">
          Message to Greg
        </label>
        <div className="relative md:col-span-2">
          {!focused && message === "" && (
            <span aria-hidden="true" className="caret-blink pointer-events-none absolute top-item left-0 type-headline-alt border-l border-ink">
              {"\u200b"}
            </span>
          )}
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="block w-full resize-none bg-transparent py-item type-headline-alt text-ink caret-ink"
          />
        </div>
        <div className="flex flex-col items-end justify-between gap-gutter">
          <a href={`mailto:${email}`} className={`type-label ${INLINE_LINK}`}>
            {email}
          </a>
          <Tag
            as="button"
            type="submit"
            className="transition-colors motion-fast ease-standard hover:bg-ink hover:text-canvas-home"
          >
            Send <Arrow external />
          </Tag>
        </div>
      </form>
    </section>
  );
}
