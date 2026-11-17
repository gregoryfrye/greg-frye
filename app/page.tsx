import Link from "next/link";
import { CollectionCard, type CollectionCardData } from "@/app/components/ui/collection-card";
import { NumberedList } from "@/app/components/ui/numbered-list";
import { TextLink } from "@/app/components/ui/text-link";
import { SkillList } from "@/app/components/skill-list";
import { INLINE_LINK } from "@/app/components/ui/inline-link";
import { ContactField } from "@/app/components/modules/contact-field";
import { contactEmail } from "@/lib/site";
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
        href: `/work/${item.client.slug}`,
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
        href: `/work/${item.client.slug}`,
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
        href: item.artifact.url ?? `/work/${item.client.slug}`,
        external: Boolean(item.artifact.url),
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
        href: `/work/${item.client.slug}`,
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
      <section className="grid grid-cols-1 items-start gap-gutter md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="font-display-alt text-display tracking-tight text-ink">
            A world-building creative director with 20 years channeling resonance through brand experiences,
            product ecosystems, and marketing functions.
          </h1>
          <div className="mt-block">
            <TextLink href="/#info">More Information</TextLink>
          </div>
        </div>
        {services.length > 0 && <NumberedList items={services} label="Services" />}
      </section>

      {cards.length > 0 && (
        <section id="work" aria-labelledby="work-heading" className="scroll-mt-40">
          <h2 id="work-heading" className="type-headline-alt text-ink">
            Work
          </h2>
          <div className="mt-block grid grid-cols-1 items-start gap-gutter sm:grid-cols-2 md:grid-cols-3">
            {cards.map((card) => (
              <CollectionCard key={card.key} {...withoutKey(card)} />
            ))}
          </div>
        </section>
      )}

      <section id="info" aria-labelledby="info-heading" className="scroll-mt-40">
        <h2 id="info-heading" className="type-headline-alt text-ink">
          Info
        </h2>
        <ul aria-label="Roles" className="mt-block flex flex-col border-t border-border">
          {roles.map((role) => {
            const clients = getClientsByRole(role.slug);
            const clientCount = clients.length + role.names.length;
            return (
              <li
                key={role.slug}
                className="grid grid-cols-1 gap-x-gutter gap-y-item border-b border-border py-block md:grid-cols-12"
              >
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
                <p className="type-body-small text-ink md:col-span-4">
                  {role.description}
                </p>
                <p className="type-body-small text-ink md:col-span-2">
                  {clientCount > 0 && (
                    <span className="text-muted">
                      Select Projects:{" "}
                      {clients.map((client, i) => {
                        // For now role rows link out to the client's own site, or stay plain
                        // text. Case studies take over these links as they're built out.
                        const href = client.url;
                        const linkClass = INLINE_LINK;
                        return (
                          <span key={client.slug}>
                            {href?.startsWith("http") ? (
                              <a href={href} className={linkClass}>
                                {client.name}
                              </a>
                            ) : href ? (
                              <Link href={href} className={linkClass}>
                                {client.name}
                              </Link>
                            ) : (
                              <span>{client.name}</span>
                            )}
                            {(i < clients.length - 1 || role.names.length > 0) && ", "}
                          </span>
                        );
                      })}
                      {role.names.map((name, i) => {
                        const url = role.nameUrls[name];
                        return (
                          <span key={name}>
                            {url ? (
                              <a
                                href={url}
                                className={INLINE_LINK}
                              >
                                {name}
                              </a>
                            ) : (
                              <span>{name}</span>
                            )}
                            {i < role.names.length - 1 && ", "}
                          </span>
                        );
                      })}
                      .
                    </span>
                  )}
                </p>
                {role.skills.length > 0 && (
                  <SkillList skills={role.skills} label="Skills" className="md:col-span-2 md:col-start-11" />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="contact" aria-label="Contact" className="scroll-mt-40">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <div className="flex flex-col gap-item">
            <p className="type-body-small text-ink">
              Founders, artists, and teams: say hello about a project, a role, or an idea.
            </p>
            <TextLink href={`mailto:${contactEmail}`}>{contactEmail}</TextLink>
          </div>
          <div className="md:col-span-2">
            <ContactField email={contactEmail} />
          </div>
        </div>
      </section>
    </main>
  );
}
