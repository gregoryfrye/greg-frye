import { CollectionCard, type CollectionCardData } from "@/app/components/ui/collection-card";
import { NumberedList } from "@/app/components/ui/numbered-list";
import { TextLink } from "@/app/components/ui/text-link";
import { INLINE_LINK } from "@/app/components/ui/inline-link";
import { Arrow } from "@/app/components/ui/arrow";
import { Globe } from "@/app/components/ui/globe";
import { caseStudiesLive } from "@/lib/site";
import { getMoonPhaseName } from "@/lib/moon";
import { getKingstonWeather } from "@/lib/weather";
import {
  COLLECTION_LABEL,
  getActiveItems,
  getAllRoles,
  getArtifactCardImage,
  getClientImages,
  getClientsByRole,
  getCurrentRole,
  getFeaturedOnHome,
  getProjectCardImage,
  getSkillBySlug,
  getSkillCardImage,
  type FeaturedEntity,
} from "@/lib/content";

/** Alphabetize names the way a shelf does: a leading "The" doesn't count. */
const sortName = (name: string) => name.replace(/^the\s+/i, "");

/** Where a client's work links: its case study, or its own site while case studies are in revision. */
function clientLink(client: { slug: string; url?: string }): { href?: string; external: boolean } {
  if (caseStudiesLive || !client.url) return { href: caseStudiesLive ? `/work/${client.slug}` : undefined, external: false };
  return { href: client.url, external: true };
}

function toCardData(item: FeaturedEntity): CollectionCardData | null {
  switch (item.kind) {
    case "client": {
      const image = getClientImages(item.client.slug)[0];
      return {
        key: `client:${item.client.slug}`,
        label: COLLECTION_LABEL.client,
        years: item.client.years,
        title: item.client.name,
        summary: item.client.summary,
        ...clientLink(item.client),
        imageSrc: image ? `/content-images/clients/${item.client.slug}/images/${image}` : undefined,
      };
    }
    case "project": {
      if (!item.client) return null;
      const image = getProjectCardImage(item.project);
      return {
        key: `project:${item.client.slug}/${item.project.slug}`,
        label: COLLECTION_LABEL.project,
        years: item.project.year ?? item.client.years,
        title: `${item.client.name} ${item.project.title}`,
        summary: item.project.summary,
        ...clientLink(item.client),
        imageSrc: image
          ? `/content-images/clients/${item.client.slug}/projects/${item.project.slug}/images/${image}`
          : undefined,
      };
    }
    case "skill": {
      const image = getSkillCardImage(item.skill);
      return {
        key: `skill:${item.skill.slug}`,
        label: COLLECTION_LABEL.skill,
        title: item.skill.name,
        summary: item.skill.summary,
        href: `/skills/${item.skill.slug}`,
        imageSrc: image ? `/content-images/skills/${item.skill.slug}/images/${image}` : undefined,
      };
    }
    case "artifact": {
      if (!item.client) return null;
      const image = getArtifactCardImage(item.artifact);
      return {
        key: `artifact:${item.artifact.fullSlug}`,
        label: COLLECTION_LABEL.artifact,
        years: item.artifact.year,
        title: item.artifact.title,
        summary: item.artifact.summary,
        ...(item.artifact.url ? { href: item.artifact.url, external: true } : clientLink(item.client)),
        imageSrc: image
          ? `/content-images/clients/${item.artifact.client}/projects/${item.artifact.project}/artifacts/${item.artifact.slug}/images/${image}`
          : undefined,
      };
    }
    case "study": {
      if (!item.client) return null;
      return {
        key: `study:${item.study.slug}`,
        label: COLLECTION_LABEL.study,
        title: item.study.title,
        summary: item.study.summary,
        ...clientLink(item.client),
      };
    }
  }
}

const withoutKey = ({ key: _key, ...card }: CollectionCardData) => card;

// Hourly, so the weather and moon in the hero stay current.
export const revalidate = 3600;

export default async function Home() {
  const weather = await getKingstonWeather();
  const currentRole = getCurrentRole();
  const roles = getAllRoles();

  // One row of work: the latest (Active) first, then the featured picks.
  const latest: CollectionCardData[] = getActiveItems().map((item) => ({
    key: item.key,
    label: COLLECTION_LABEL[item.kind],
    years: item.years,
    title: item.title,
    summary: item.summary,
    imageSrc: item.imageSrc,
    href: item.href,
    external: item.external,
  }));
  const featured = getFeaturedOnHome()
    .map(toCardData)
    .filter((card): card is CollectionCardData => card !== null);
  const seen = new Set<string>();
  const cards = [...latest, ...featured].filter((card) => !seen.has(card.key) && seen.add(card.key));

  const services = (currentRole?.skills ?? [])
    .map((slug) => getSkillBySlug(slug))
    .filter((skill): skill is NonNullable<typeof skill> => skill !== null)
    .map((skill) => ({ label: skill.name, href: `/skills/${skill.slug}` }));

  return (
    <main data-canvas="home" className="mx-auto flex w-full max-w-wide flex-1 flex-col gap-20 px-gutter pt-40 pb-20">
      <section className="grid grid-cols-1 items-start gap-gutter sm:grid-cols-12">
        <div className="sm:col-span-6 md:col-span-8">
          <h1 className="type-headline-alt text-ink">
            A world-building creative director with 20 years channeling resonance through brand experiences,
            product ecosystems, and marketing functions.
          </h1>
          <div className="mt-block">
            <TextLink href="/#info">More Information</TextLink>
          </div>
        </div>
        {/* Column 5 at lg: where and when (the globe turning with the day, today's conditions in Kingston).
            Below lg (fewer than six columns of content) it moves under the headline and services: globe and
            conditions are one unit filling one column of the card grid (the whole width on phones, a half from
            sm, a third from md), the globe stretching over the left and the conditions on the right at their
            natural width. The film frame lives in the About block that opens Info. */}
        <div className="order-last col-span-full grid grid-cols-1 gap-gutter sm:grid-cols-12 lg:order-none lg:col-span-2 lg:col-start-9 lg:flex lg:flex-col">
          <div className="flex items-center gap-gutter sm:col-span-6 md:col-span-4 lg:flex-col lg:items-start">
            <Globe className="aspect-[2/1] w-full min-w-0 flex-1 lg:flex-none" />
            <p className="shrink-0 whitespace-nowrap type-caption text-ink">
              Kingston, NY
              {weather && (
                <>
                  <br />
                  ☼ {weather.temperature}°F, {weather.conditions}
                </>
              )}
              <br />☾ {getMoonPhaseName()}
            </p>
          </div>
        </div>
        {services.length > 0 && (
          // Beside the headline from sm up, 50/50 over the 2-up cards, 8/4 over the 3-up; column 6 at lg; the globe takes column 5
          <NumberedList items={services} label="Services" numbered={false} className="sm:col-span-6 md:col-span-4 lg:col-span-2 lg:col-start-11" />
        )}
      </section>

      {cards.length > 0 && (
        <section id="work" aria-labelledby="work-heading" className="scroll-mt-40">
          <h2 id="work-heading" className="sr-only">
            Work
          </h2>
          <div className="grid grid-cols-1 items-start gap-gutter sm:grid-cols-2 md:grid-cols-3">
            {cards.map((card) => (
              <CollectionCard key={card.key} {...withoutKey(card)} />
            ))}
          </div>
        </section>
      )}

      <section id="info" aria-labelledby="info-heading" className="scroll-mt-40">
        <h2 id="info-heading" className="sr-only">
          Info
        </h2>
        {/* Info is a spread, half and half: a tight timeline on the left, the bio large on the right with film
            frames set into its lines. On phones the bio comes first. */}
        <div className="grid grid-cols-1 items-start gap-x-gutter gap-y-section md:grid-cols-2">
          {/* Draft bio: Greg to rewrite in his own words. Key phrases at full ink, the rest a step softer. */}
          <p className="type-deck text-muted-home md:order-last">
            <span className="text-ink">A creative director who builds worlds</span> for brands, products, and the
            teams behind them. I grew up in the woods of New Hampshire building forts{" "}
            <img src="/images/film/sm/000622630031.jpg" alt="Neon sneakers on moss" className="inline-photo" />, learned
            design at a local print shop, and came up in New York making{" "}
            <span className="text-ink">some of the first consumer internet brands</span>. Most recently I led creative at{" "}
            <span className="text-ink">Hudson Cannabis</span>{" "}
            <img src="/images/film/sm/29510010.jpg" alt="Olive trees from above, long shadows on dirt" className="inline-photo" />,
            from the farm to the shelf. Now in <span className="text-ink">Kingston, NY</span>, I work fractionally with
            founders and small teams, and shoot film, tend a garden{" "}
            <img src="/images/film/sm/000622630002.jpg" alt="Hen and chicks in the weeds by a wall" className="inline-photo" />,
            and play pickup soccer.
          </p>
          {/* The timeline: one entry per role. Years, then title and company with clients beneath in a softer
              line, then where. */}
          <ol aria-label="Roles" className="flex flex-col border-t border-border">
            {roles.map((role) => {
              const clients = [
                ...getClientsByRole(role.slug).map((client) => ({ key: client.slug, name: client.name, url: client.url })),
                ...role.names.map((name) => ({ key: name, name, url: role.nameUrls[name] })),
              ].sort((a, b) => sortName(a.name).localeCompare(sortName(b.name), "en", { sensitivity: "base" }));
              return (
                <li key={role.slug} className="grid grid-cols-4 gap-x-gutter border-b border-border py-item">
                  <span className="type-caption text-ink">{role.years}</span>
                  <div className="col-span-2 type-caption">
                    <p className="text-ink">
                      {role.title},{" "}
                      {role.companyUrl ? (
                        <a href={role.companyUrl} className={INLINE_LINK}>
                          {role.company}
                        </a>
                      ) : (
                        role.company
                      )}
                    </p>
                    {clients.length > 0 && (
                      <p className="text-muted-home">
                        {clients.map((item, i) => (
                          <span key={item.key}>
                            {item.url ? (
                              <a href={item.url} className={INLINE_LINK}>
                                {item.name}&nbsp;<Arrow external />
                              </a>
                            ) : (
                              item.name
                            )}
                            {i < clients.length - 1 && ", "}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <span className="type-caption italic text-muted-home">{role.location}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

    </main>
  );
}
