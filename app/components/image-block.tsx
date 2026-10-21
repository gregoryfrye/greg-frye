import type { ImageBlockImage, ImageBlockType } from "@/lib/content-blocks";

type ImageBlockProps = {
  type: ImageBlockType;
  /** URL-encoded JSON: { images: ImageBlockImage[], caption?: string }. See content-blocks.ts. */
  payload: string;
};

/**
 * One slot. A real image renders at its natural aspect ratio; a slot with no
 * file yet keeps the placeholder box (fixed aspect, description text) so the
 * layout can still be judged before every asset lands.
 */
function Media({ image, aspect }: { image: ImageBlockImage; aspect: string }) {
  if (image.src) {
    return (
      // Plain <img>: content images are served by the content-images route at
      // their real size, and natural aspect ratio matters more here than
      // next/image's fixed-box sizing.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="block h-auto w-full bg-border" />
    );
  }
  return (
    <div className={`relative ${aspect} overflow-hidden bg-border`}>
      <div className="flex h-full w-full items-center justify-center p-4 text-center">
        <p className="text-caption text-muted">{image.alt}</p>
      </div>
    </div>
  );
}

function Caption({ children }: { children: string }) {
  return <p className="mx-auto mt-3 max-w-prose text-body text-muted">{children}</p>;
}

/** full: full-bleed single image, breaks the text column. */
function FullBlock({ images, caption }: { images: ImageBlockImage[]; caption?: string }) {
  return (
    <figure className="my-16">
      {images[0] && <Media image={images[0]} aspect="aspect-[16/9]" />}
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
}

/** pair: two side by side, equal width, stack on mobile. */
function PairBlock({ images, caption }: { images: ImageBlockImage[]; caption?: string }) {
  return (
    <figure className="my-16">
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
        {images.map((image, i) => (
          <Media key={i} image={image} aspect="aspect-[4/3]" />
        ))}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
}

/** inset: single image inline in the text column, no break. */
function InsetBlock({ images, caption }: { images: ImageBlockImage[]; caption?: string }) {
  return (
    <figure className="mx-auto my-10 max-w-prose">
      {images[0] && <Media image={images[0]} aspect="aspect-[4/3]" />}
      {caption && <figcaption className="mt-3 text-body text-muted">{caption}</figcaption>}
    </figure>
  );
}

/**
 * v1 stub for stagger, scroll, and motion: a simple grid (one column on
 * mobile, up to three wide). Upgrading each to its real behavior later is a
 * component swap here, not a content migration — the fence syntax and props
 * don't change.
 */
function StackBlock({ images, caption }: { images: ImageBlockImage[]; caption?: string }) {
  const columns =
    images.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : images.length === 2 ? "sm:grid-cols-2" : "";
  return (
    <figure className="my-16">
      <div className={`grid grid-cols-1 items-start gap-6 ${columns}`}>
        {images.map((image, i) => (
          <Media key={i} image={image} aspect="aspect-[4/3]" />
        ))}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
}

export function ImageBlock({ type, payload }: ImageBlockProps) {
  const parsed = JSON.parse(decodeURIComponent(payload)) as {
    images: (ImageBlockImage | string)[];
    caption?: string;
  };
  const images = parsed.images.map((image) => (typeof image === "string" ? { alt: image } : image));
  const { caption } = parsed;

  switch (type) {
    case "full":
      return <FullBlock images={images} caption={caption} />;
    case "pair":
      return <PairBlock images={images} caption={caption} />;
    case "inset":
      return <InsetBlock images={images} caption={caption} />;
    case "stagger":
    case "scroll":
    case "motion":
      return <StackBlock images={images} caption={caption} />;
  }
}
