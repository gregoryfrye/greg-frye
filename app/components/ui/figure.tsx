/**
 * One image with an optional photo credit underneath ("© Adam Whyte, 2023").
 * Natural aspect ratio when the image exists; a placeholder box with its
 * description when it doesn't, so a layout can be judged before assets land.
 */
export function Figure({
  src,
  alt,
  credit,
  className = "",
}: {
  src?: string;
  alt: string;
  credit?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      {src ? (
        // Plain <img>: content images are served at their real size by the
        // content-images route, and natural aspect ratio matters here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full bg-placeholder" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-placeholder p-block text-center">
          <p className="type-label text-muted">{alt}</p>
        </div>
      )}
      {credit && <figcaption className="mt-item type-credit text-ink">{credit}</figcaption>}
    </figure>
  );
}
