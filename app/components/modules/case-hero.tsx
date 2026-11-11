import { Figure } from "@/app/components/ui/figure";
import { Stat } from "@/app/components/ui/stat";
import { ChapterIndex, type Chapter } from "@/app/components/modules/chapter-index";

/**
 * Case study opener (Figma 01_Client_1280, top): chapter index · title, hero
 * image and lede · stats. Four columns on wide screens with a two-column
 * center; on compact screens it stacks title, image, lede, stats, index.
 */
export function CaseHero({
  title,
  lede,
  image,
  stats = [],
  chapters = [],
}: {
  title: string;
  lede?: string;
  image?: { src?: string; alt: string; credit?: string };
  stats?: { value: string; label: string }[];
  chapters?: Chapter[];
}) {
  return (
    <header className="grid grid-cols-1 gap-x-gutter gap-y-section md:grid-cols-4">
      <div className="md:col-span-2 md:col-start-2">
        <h1 className="text-center type-title text-ink">{title}</h1>
        {image && <Figure {...image} className="mt-block" />}
        {lede && <p className="mx-auto mt-block max-w-prose text-center type-body text-ink">{lede}</p>}
      </div>
      {stats.length > 0 && (
        <dl className="flex flex-col gap-block md:col-start-4 md:row-start-1">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <Stat value={s.value} label={s.label} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {chapters.length > 0 && (
        <div className="md:col-start-1 md:row-start-1">
          <ChapterIndex chapters={chapters} />
        </div>
      )}
    </header>
  );
}
