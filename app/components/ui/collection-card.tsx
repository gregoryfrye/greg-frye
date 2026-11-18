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
  /** "small" for single pieces (artifacts): half a column, date under the label. */
  size?: "small";
};

/**
 * A card for anything pulled onto the homepage, from any level of the
 * content model: boxed collection label, date top right (recency), image at
 * its natural height, title with an arrow. Hugs its content. A small card (an artifact) is half as wide,
 * so its date drops under the label.
 */
export function CollectionCard({ label, years, title, summary, imageSrc, href, external, size }: Omit<CollectionCardData, "key">) {
  const small = size === "small";
  const body = (
    <>
      <div className={small ? "flex flex-col items-start gap-item" : "flex items-start justify-between gap-inline"}>
        <Tag>{label}</Tag>
        {years && (
          // A range breaks before the dash: start year, then "–end" below it.
          <span className={`${small ? "" : "text-right "}type-caption text-ink`}>
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
  // On the homepage grid a card spans two of its columns; a small one spans one.
  const className = `group flex flex-col gap-inline border border-border p-inline no-underline ${small ? "col-span-1" : "col-span-2"}`;
  if (href && external) return <a href={href} className={className}>{body}</a>;
  if (href) return <Link href={href} className={className}>{body}</Link>;
  return <div className={className}>{body}</div>;
}
