import Image from "next/image";
import Link from "next/link";

type FeaturedCardProps = {
  type: string;
  title: string;
  summary: string;
  href: string;
  imageSrc?: string;
};

export function FeaturedCard({ type, title, summary, href, imageSrc }: FeaturedCardProps) {
  return (
    <Link
      href={href}
      className="block border border-border no-underline transition-colors hover:border-ink"
    >
      {imageSrc && (
        <div className="relative aspect-[4/3] overflow-hidden bg-border">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-gutter text-center">
        <p className="text-caption tracking-tight text-muted uppercase">{type}</p>
        <h3 className="mt-2 font-serif text-heading text-ink">{title}</h3>
        <p className="mt-4 text-body text-muted">{summary}</p>
      </div>
    </Link>
  );
}
