/**
 * Link arrow, set in the sans (Helvetica): Times' arrows are too thin at text
 * size. ↗ leaves the site, → goes to another page here. Decorative only.
 */
export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="font-sans">
      {external ? "↗" : "→"}
    </span>
  );
}
