"use client";

import { useState } from "react";
import { Arrow } from "@/app/components/ui/arrow";

/**
 * A message field that hands off to the visitor's email app: no form backend,
 * no data held here. Typing composes the note; Send opens a prefilled email.
 */
export function ContactField({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const href = `mailto:${email}?subject=${encodeURIComponent("Hello from gregfrye.us")}&body=${encodeURIComponent(message)}`;

  return (
    <form
      className="flex flex-col gap-item"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = href;
      }}
    >
      <label htmlFor="contact-message" className="type-label text-muted">
        Start a conversation
      </label>
      <textarea
        id="contact-message"
        name="message"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What are you building?"
        className="rule w-full resize-y bg-transparent pt-item type-body text-ink placeholder:text-muted"
      />
      <div className="rule pt-item">
        <button
          type="submit"
          className="type-label text-ink underline decoration-transparent underline-offset-4 transition-colors motion-fast ease-standard hover:decoration-ink"
        >
          Send <Arrow external />
        </button>
      </div>
    </form>
  );
}
