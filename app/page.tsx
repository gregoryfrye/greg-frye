import { CollectionCard, type CollectionCardData } from "@/app/components/ui/collection-card";
import { NumberedList } from "@/app/components/ui/numbered-list";
import { TextLink } from "@/app/components/ui/text-link";
import { SkillList } from "@/app/components/skill-list";
import { INLINE_LINK } from "@/app/components/ui/inline-link";
import { Arrow } from "@/app/components/ui/arrow";
import { FilmFrame } from "@/app/components/ui/film-frame";
import { Globe } from "@/app/components/ui/globe";
import { caseStudiesLive } from "@/lib/site";
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

export default function Home() {
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
        {/* Column 5: the globe placeholder over a random frame from the film roll, new on each load. */}
        <div className="hidden flex-col gap-gutter lg:col-span-2 lg:col-start-9 lg:flex">
          <Globe className="w-1/2" />
          <FilmFrame />
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
        <ul aria-label="Roles" className="flex flex-col border-t border-border">
          {roles.map((role) => {
            const clients = getClientsByRole(role.slug);
            const clientCount = clients.length + role.names.length;
            return (
              <li
                key={role.slug}
                className="grid grid-cols-1 gap-x-gutter gap-y-item border-b border-border py-block sm:grid-cols-2 md:grid-cols-12"
              >
                {/* Two columns from sm (matching the 2-up cards): who/when left, what right. At md the wrappers dissolve into the 12-column row. */}
                <div className="flex flex-col gap-item md:contents">
                <span className="type-caption text-ink md:col-span-2">{role.years}</span>
                <span className="type-body-small text-ink md:col-span-2">
                  {role.title}
                  {role.company !== role.title && (
                    <>
                      <br />
                      {role.companyUrl ? (
                        <a
                          href={role.companyUrl}
                          className={INLINE_LINK}
                        >
                          {role.company}
                        </a>
                      ) : (
                        role.company
                      )}
                    </>
                  )}
                  {role.location && (
                    <>
                      <br />
                      <em className="italic">{role.location}</em>
                    </>
                  )}
                </span>
                </div>
                <div className="flex flex-col gap-block md:contents">
                <p className="type-body-small text-ink md:col-span-4">
                  {role.description}
                </p>
                {role.skills.length > 0 && (
                  <SkillList skills={role.skills} label="Skills" className="md:col-span-2 md:col-start-9" />
                )}
                {clientCount > 0 && (
                  // One client per line, A to Z (ignoring a leading "The"). For now they link out to each client's own
                  // site, or stay plain text; case studies take over as they're built.
                  <ul aria-label="Clients" className="type-body-small text-ink md:col-span-2 md:col-start-11">
                    {[
                      ...clients.map((client) => ({ key: client.slug, name: client.name, url: client.url })),
                      ...role.names.map((name) => ({ key: name, name, url: role.nameUrls[name] })),
                    ]
                      .sort((a, b) => sortName(a.name).localeCompare(sortName(b.name), "en", { sensitivity: "base" }))
                      .map((item) => (
                      <li key={item.key}>
                        {item.url ? (
                          <a href={item.url} className={INLINE_LINK}>
                            {item.name}&nbsp;<Arrow external />
                          </a>
                        ) : (
                          item.name
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

    </main>
  );
}
