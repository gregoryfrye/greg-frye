import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSkills, getClientBySlug, getProjectsBySkill, getSkillBySlug } from "@/lib/content";

export function generateStaticParams() {
  return getAllSkills().map((skill) => ({ slug: skill.slug }));
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) notFound();

  const projects = getProjectsBySkill(slug);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-gutter pt-40 pb-20">
      <h1 className="font-serif text-heading text-ink">{skill.name}</h1>
      <p className="mt-6 text-body text-muted">{skill.summary}</p>

      {projects.length > 0 && (
        <ul className="mt-12 flex flex-col gap-6">
          {projects.map((project) => {
            const client = getClientBySlug(project.client);
            return (
              <li key={project.slug}>
                <p className="text-body text-ink">{project.title}</p>
                <p className="mt-1 text-body text-muted">{project.summary}</p>
                {client && (
                  <Link
                    href={`/work/${client.slug}`}
                    className="mt-1 inline-block text-caption text-muted underline decoration-border underline-offset-4 hover:decoration-ink"
                  >
                    {client.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
