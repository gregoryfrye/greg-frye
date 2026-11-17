export function Footer() {
  return (
    <footer className="py-gutter">
      <div className="mx-auto max-w-wide px-gutter text-center type-label text-muted">
        <p>© 2006–{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
