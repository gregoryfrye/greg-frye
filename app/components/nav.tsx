import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 bg-canvas/85 px-gutter py-nav backdrop-blur-sm">
      <div className="mx-auto grid max-w-wide grid-cols-3 items-center gap-gutter">
        <Link
          href="/#work"
          className="col-start-1 justify-self-start text-body text-muted no-underline hover:text-ink"
        >
          Work
        </Link>
        <Link
          href="/"
          className="col-start-2 justify-self-center font-serif text-body text-ink no-underline"
        >
          Greg Frye
        </Link>
        <Link
          href="/#info"
          className="col-start-3 justify-self-end text-body text-muted no-underline hover:text-ink"
        >
          Info
        </Link>
      </div>
    </nav>
  );
}
