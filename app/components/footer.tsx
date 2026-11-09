import { getMoonPhaseName } from "@/lib/moon";

export function Footer() {
  return (
    <footer className="px-gutter py-gutter">
      <p className="mx-auto max-w-wide text-center text-body text-muted">
        {getMoonPhaseName()} ☾
      </p>
    </footer>
  );
}
