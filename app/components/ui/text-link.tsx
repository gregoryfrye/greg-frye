import Link from "next/link";
import type { ReactNode } from "react";

/** A label-sized link with a trailing arrow ("More Information →"). */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  const className =
    "type-label text-ink underline decoration-transparent underline-offset-4 transition-colors motion-fast ease-standard hover:decoration-ink";
  const body = (
    <>
      {children} <span aria-hidden="true">→</span>
    </>
  );
  return external ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
