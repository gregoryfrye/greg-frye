import { Tag } from "./tag";
import Link from "next/link";
import { Arrow } from "./arrow";

export type CollectionCardData = {
  key: string;
  /** Collection label, e.g. "Client", "Artifact" (COLLECTION_LABEL). */
  label: string;
  years?: string;
  title: string;
  summary: string;
  imageSrc?: string;
  href?: string;
  external?: boolean;
  /**
   * Set by the card's type: "small" for artifacts (one column), medium (the
   * default) for projects, "large" for clients (half the row from md).
   */
  size?: "small" | "large";
};

/**
 * A card for anything pulled onto the homepage, from any level of the
 * content model: boxed collection label, date top right (recency), image at
 * its natural height, title with an arrow. Hugs its content. A small card (an artifact) is half as wide;
 * the tag is tight enough that its date still fits beside the label, and wraps under it if not.
 */
export function CollectionCard({ label, years, title, summary, imageSrc, href, external, size }: Omit<CollectionCardData, "key">) {
  const small = size === "small";
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-inline gap-y-item">
        <Tag>{label}</Tag>
        {years && (
          // A range breaks before the dash: start year, then "–end" below it.
          <span className="text-right type-caption text-ink">
            {years.split("–").map((part, i) => (
              <span key={part} className="block">
                {i > 0 && "–"}
                {part}
              </span>
            ))}
          </span>
        )}
      </div>
      {imageSrc ? (
        // Plain <img>: natural aspect ratio, served at size by the content-images route.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" loading="lazy" decoding="async" className="h-auto w-full bg-placeholder" />
      ) : (
        <p className="type-body text-muted">{summary}</p>
      )}
      <span className="type-label text-ink underline decoration-transparent underline-offset-4 transition-colors motion-fast ease-standard group-hover:decoration-ink">
        {title} <Arrow external={external} />
      </span>
    </>
  );
  // On the homepage's doubled grid (2 / 4 / 6): small spans one column, medium two, large the full row
  // on tablets (4) and half the row (3) from md.
  const span = small ? "col-span-1" : size === "large" ? "col-span-2 sm:col-span-4 md:col-span-3" : "col-span-2";
  const className = `group flex flex-col gap-inline border border-border p-inline no-underline ${span}`;
  if (href && external) return <a href={href} className={className}>{body}</a>;
  if (href) return <Link href={href} className={className}>{body}</Link>;
  return <div className={className}>{body}</div>;
}
