"use client";

import { useState } from "react";
import { Arrow } from "@/app/components/ui/arrow";
import { Tag } from "@/app/components/ui/tag";

/**
 * One large message box, outlined like a card, with Send as a boxed tag in its
 * lower right. Hands off to the visitor's email app: no form backend, nothing
 * stored here. Typing composes the note; Send opens a prefilled email.
 */
export function ContactField({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const href = `mailto:${email}?subject=${encodeURIComponent("Hello from gregfrye.us")}&body=${encodeURIComponent(message)}`;

  return (
    <form
      className="flex flex-col border border-border"
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
        rows={8}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Say hello: a project, a role, an idea…"
        className="block w-full resize-y bg-transparent p-gutter type-body text-ink placeholder:text-muted"
      />
      <div className="flex justify-end px-gutter pb-gutter">
        <Tag
          as="button"
          type="submit"
          className="transition-colors motion-fast ease-standard hover:bg-ink hover:text-canvas-home"
        >
          Send <Arrow external />
        </Tag>
      </div>
    </form>
  );
}
