import Link from "next/link";
import { FeaturedCard } from "@/app/components/featured-card";
import {
  getActiveClients,
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

type FeaturedCardData = {
  key: string;
  kind: FeaturedEntity["kind"];
  type: string;
  title: string;
  summary: string;
  href: string;
  imageSrc?: string;
};

function toCardData(item: FeaturedEntity): FeaturedCardData | null {
  switch (item.kind) {
    case "client":
      return {
        key: `client-${item.client.slug}`,
        kind: item.kind,
        type: "Client",
        title: item.client.name,
        summary: item.client.summary,
        href: `/work/${item.client.slug}`,
        imageSrc: (() => {
          const image = getClientImages(item.client.slug)[0];
          return image ? `/content-images/clients/${item.client.slug}/images/${image}` : undefined;
        })(),
      };
    case "project": {
      if (!item.client) return null;
      const image = getProjectCardImage(item.project);
      return {
        key: `project-${item.project.slug}`,
        kind: item.kind,
        type: "Project",
        title: item.project.title,
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
        key: `skill-${item.skill.slug}`,
        kind: item.kind,
        type: "Skill",
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
        key: `artifact-${item.artifact.slug}`,
        kind: item.kind,
        type: "Artifact",
        title: item.artifact.title,
        summary: item.artifact.summary,
        href: `/work/${item.client.slug}`,
        imageSrc: image
          ? `/content-images/clients/${item.artifact.client}/projects/${item.artifact.project}/artifacts/${item.artifact.slug}/images/${image}`
          : undefined,
      };
    }
    case "study": {
      if (!item.client) return null;
      return {
        key: `study-${item.study.slug}`,
        kind: item.kind,
        type: "Study",
        title: item.study.title,
        summary: item.study.summary,
        href: `/work/${item.client.slug}`,
      };
    }
  }
}

export default function Home() {
  const currentRole = getCurrentRole();
  const roles = getAllRoles();
  const activeClients = getActiveClients();
  const featuredCards = getFeaturedOnHome()
    .map(toCardData)
    .filter((card): card is FeaturedCardData => card !== null);

  return (
    <main data-canvas="home" className="mx-auto flex w-full max-w-wide flex-1 flex-col gap-20 px-gutter pt-40 pb-20">
      <section className="flex flex-col gap-gutter lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-hero lg:flex-1">
          <h1 className="text-left font-serif text-display tracking-tight text-ink">
            A whole-system creative director with 20 years channeling founder vision into a focused brand, product, and marketing function.
          </h1>
          <p className="mt-6 max-w-prose text-body text-ink">
            Integrated creative director. Twenty years across brand, product,
            marketing, and production, starting at a print shop in southern New
            Hampshire, printing banners, cutting vinyl for shop windows, and
            learning to code.
          </p>
          {currentRole && (
            <p className="mt-4 max-w-prose text-body text-muted">{currentRole.description}</p>
          )}
        </div>

        {activeClients.length > 0 && (
          <section aria-labelledby="active-heading" className="lg:w-1/4 lg:shrink-0">
            <h2 id="active-heading" className="sr-only">
              Active projects
            </h2>
            <ul className="flex flex-col gap-gutter">
              {activeClients.map((client) => {
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <span className="border border-border px-4 py-1 text-body text-ink">Active</span>
                      {client.years && (
                        <span className="font-sans text-caption text-ink">{client.years}</span>
                      )}
                    </div>
                    {client.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={client.imageSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-contain"
                      />
                    ) : (
                      <p className="text-caption text-muted">{client.summary}</p>
                    )}
                    <span className="text-body text-ink underline decoration-transparent underline-offset-4 group-hover:decoration-ink">
                      {client.name} →
                    </span>
                  </>
                );
                const cardClass = "group flex flex-col gap-4.5 border border-border p-4.5";
                return (
                  <li key={client.slug}>
                    {client.hasPage ? (
                      <Link href={`/work/${client.slug}`} className={cardClass}>
                        {body}
                      </Link>
                    ) : client.url ? (
                      <a href={client.url} className={cardClass}>
                        {body}
                      </a>
                    ) : (
                      <div className={cardClass}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {currentRole && currentRole.skills.length > 0 && (
          <nav aria-label="Services" className="shrink-0">
            <h2 className="text-caption tracking-tight text-muted uppercase">Services</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {currentRole.skills.map((skillSlug) => {
                const skill = getSkillBySlug(skillSlug);
                if (!skill) return null;
                return (
                  <li key={skillSlug}>
                    <Link
                      href={`/skills/${skillSlug}`}
                      className="text-body text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
                    >
                      {skill.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </section>

      {featuredCards.length > 0 && (
        <section
          aria-label="Featured work"
          className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featuredCards.map((card) =>
            card.kind === "client" ? (
              <div key={card.key}>
                <FeaturedCard
                  type={card.type}
                  title={card.title}
                  summary={card.summary}
                  href={card.href}
                  imageSrc={card.imageSrc}
                />
              </div>
            ) : (
              <div key={card.key}>
                <Link
                  href={card.href}
                  className="text-body text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
                >
                  {card.title}
                </Link>
              </div>
            ),
          )}
        </section>
      )}

      <section aria-labelledby="roles-heading">
        <h2
          id="roles-heading"
          className="mx-auto w-fit border border-border px-4 py-1 font-serif text-heading text-ink"
        >
          Roles
        </h2>
        <ul className="mt-6 flex flex-col border-t border-border">
          {roles.map((role) => {
            const clients = getClientsByRole(role.slug);
            const clientCount = clients.length + role.names.length;
            return (
              <li
                key={role.slug}
                className="grid grid-cols-1 gap-2 border-b border-border py-6 sm:grid-cols-12 sm:gap-6"
              >
                <span className="text-body text-ink sm:col-span-2">{role.years}</span>
                <span className="text-body text-ink sm:col-span-3">
                  {role.title}
                  {role.company !== role.title && (
                    <>
                      <br />
                      {role.company}
                    </>
                  )}
                  {role.location && (
                    <>
                      <br />
                      <em className="italic">{role.location}</em>
                    </>
                  )}
                </span>
                <p className="text-body text-ink sm:col-span-4">
                  {role.description}
                  {clientCount > 0 && (
                    <span className="text-muted">
                      {" "}Select clients:{" "}
                      {clients.map((client, i) => (
                        <span key={client.slug}>
                          <Link
                            href={`/work/${client.slug}`}
                            className="text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
                          >
                            {client.name}
                          </Link>
                          {(i < clients.length - 1 || role.names.length > 0) && ", "}
                        </span>
                      ))}
                      {role.names.join(", ")}.
                    </span>
                  )}
                </p>
                {role.skills.length > 0 && (
                  <ul aria-label="Skills" className="flex flex-col gap-1 sm:col-span-3">
                    {role.skills.map((skillSlug) => {
                      const skill = getSkillBySlug(skillSlug);
                      if (!skill) return null;
                      return (
                        <li key={skillSlug} className="text-caption">
                          <Link
                            href={`/skills/${skillSlug}`}
                            className="text-muted underline decoration-border underline-offset-4 hover:text-ink"
                          >
                            {skill.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
