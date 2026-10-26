import { getMoonPhaseLabel } from "@/lib/moon";

export function Footer() {
  return (
    <footer className="px-gutter py-gutter">
      <div className="mx-auto grid max-w-wide grid-cols-1 gap-2 text-center text-body text-muted sm:grid-cols-3 sm:items-center sm:text-left">
        <p className="sm:justify-self-start">☼ Kingston, NY, USA</p>
        <p className="sm:justify-self-center">© 2006–{new Date().getFullYear()}</p>
        <p className="sm:justify-self-end">{getMoonPhaseLabel()}</p>
      </div>
    </footer>
  );
}
