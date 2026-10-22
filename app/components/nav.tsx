import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 bg-canvas/85 px-gutter py-nav backdrop-blur-sm">
      <div className="mx-auto grid max-w-wide grid-cols-3 items-center gap-gutter">
        <Link
          href="/"
          className="col-start-1 justify-self-start font-serif text-body text-ink no-underline"
        >
          Greg Frye
        </Link>
        <span className="col-start-2 hidden justify-self-center text-body tracking-tight text-muted uppercase sm:block">
          Whole World Creative Direction
        </span>
        <a
          href="mailto:gregoryfrye@gmail.com"
          className="col-start-3 justify-self-end text-body text-muted no-underline hover:text-ink"
        >
          Contact
        </a>
      </div>
    </nav>
  );
}
