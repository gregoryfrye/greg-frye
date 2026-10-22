import Link from "next/link";
import { FeaturedCard } from "@/app/components/featured-card";
import {
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

const POV = [
  "Good work solves the real problem, inside real limits: budget, timeline, technology.",
  "Agencies shield creatives from those limits. Clients end up paying for work that never meets the real world.",
  "I've worked inside agencies, studios, small teams, and on my own. The useful part is the gap between them.",
  "I hold the vision, then rally the people, budget, and process to ship it.",
  "Every person on the team gets a real part in the win.",
];

export default function Home() {
  const currentRole = getCurrentRole();
  const roles = getAllRoles();
  const featuredCards = getFeaturedOnHome()
    .map(toCardData)
    .filter((card): card is FeaturedCardData => card !== null);

  return (
    <main className="mx-auto flex w-full max-w-wide flex-1 flex-col gap-20 px-gutter pt-40 pb-20">
      <section className="flex flex-col gap-gutter sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-prose sm:flex-1">
          <h1 className="text-left font-serif text-heading tracking-tight text-ink">
            I help things grow into clearer form.
          </h1>
          <p className="mt-6 text-body text-ink">
            Integrated creative director. Twenty years across brand, product,
            marketing, and production, starting at a print shop in southern New
            Hampshire, printing banners, cutting vinyl for shop windows, and
            learning to code.
          </p>
          {currentRole && (
            <p className="mt-4 text-body text-muted">{currentRole.description}</p>
          )}
        </div>

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

      <section aria-label="How I work" className="max-w-prose">
        <h2 className="font-serif text-heading text-ink">How I work</h2>
        <ul className="mt-6 flex flex-col gap-3 text-body text-muted">
          {POV.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
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

      <section aria-label="Roles">
        <ul className="flex flex-col">
          {roles.map((role) => {
            const clients = getClientsByRole(role.slug);
            return (
              <li
                key={role.slug}
                className="flex flex-col gap-1 border-b border-border py-4 first:pt-0 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="text-caption text-muted sm:w-28 sm:shrink-0">{role.years}</span>
                <span className="text-body text-ink sm:flex-1">
                  {role.title}, <em className="italic">{role.company}</em>
                </span>
                <span className="text-body text-muted sm:flex-1">
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
                  {role.names.join(", ")}
                </span>
                <span className="text-body text-muted sm:flex-1">
                  {role.skills.map((skillSlug, i) => {
                    const skill = getSkillBySlug(skillSlug);
                    if (!skill) return null;
                    return (
                      <span key={skillSlug}>
                        <Link
                          href={`/skills/${skillSlug}`}
                          className="text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
                        >
                          {skill.name}
                        </Link>
                        {i < role.skills.length - 1 && ", "}
                      </span>
                    );
                  })}
                </span>
                <span className="text-body text-muted sm:flex-1">{role.description}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
