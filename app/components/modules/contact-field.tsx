"use client";

import { useState } from "react";
import { Arrow } from "@/app/components/ui/arrow";
import { Tag } from "@/app/components/ui/tag";

/**
 * The contact field: a full-width band below the footer, tinted 10% black so it
 * reads as an oversized input. Send is a boxed tag in its lower right. Hands off
 * to the visitor's email app: no form backend, nothing stored here.
 */
export function ContactField({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const href = `mailto:${email}?subject=${encodeURIComponent("Hello from gregfrye.us")}&body=${encodeURIComponent(message)}`;

  return (
    <section id="contact" aria-label="Contact" className="scroll-mt-40 bg-input">
      <form
        className="mx-auto flex max-w-wide flex-col px-gutter pt-section pb-gutter"
        onSubmit={(event) => {
          event.preventDefault();
          window.location.href = href;
        }}
      >
        <label htmlFor="contact-message" className="sr-only">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Say hello: a project, a role, an idea…"
          className="block w-full resize-none bg-transparent type-headline text-ink placeholder:text-muted"
        />
        <div className="flex justify-end">
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
