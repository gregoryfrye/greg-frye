import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ImageBlock } from "@/app/components/image-block";
import { ProjectSection } from "@/app/components/project-section";
import { SpineSection } from "@/app/components/spine-section";
import { preprocessFenceBlocks, splitClientContent } from "@/lib/content-blocks";
import {
  getAllClients,
  getClientBySlug,
  getProjectsByClient,
  getRolesByClient,
} from "@/lib/content";

export function generateStaticParams() {
  return getAllClients().map((client) => ({ slug: client.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const client = getClientBySlug((await params).slug);
  return client ? { title: `${client.name} — Greg Frye`, description: client.summary } : {};
}

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mx-auto mt-16 max-w-prose font-serif text-heading text-ink first:mt-0" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mx-auto mt-6 max-w-prose text-body text-muted first:mt-0" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul
      className="mx-auto mt-6 max-w-prose list-disc space-y-2 pl-5 text-body text-muted first:mt-0"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="text-ink" {...props} />
  ),
  SpineSection,
  ImageBlock,
};

export default async function ClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getClientBySlug(slug);
  if (!client) notFound();

  const projects = getProjectsByClient(slug);
  const roleTitles = getRolesByClient(slug)
    .map((role) => role.title)
    .join(", ");
  const eyebrow = [roleTitles, client.years].filter(Boolean).join(" · ");
  const { narrative, closing } = splitClientContent(client.content);
  const clientImages = `/content-images/clients/${slug}/images`;

  return (
    <main className="mx-auto w-full max-w-wide flex-1 px-gutter pt-40 pb-20">
      <div className="mx-auto max-w-prose">
        <header className="mb-16">
          {(eyebrow || client.draft) && (
            <p className="text-caption tracking-tight text-muted uppercase">
              {[client.draft ? "Draft" : null, eyebrow].filter(Boolean).join(" · ")}
            </p>
          )}
          <h1 className="mt-2 font-serif text-display tracking-tight text-ink">{client.name}</h1>
          <p className="mt-6 text-body text-muted">{client.summary}</p>
        </header>
      </div>

      {client.stats && client.stats.length > 0 && (
        <section aria-label="Stats" className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {client.stats.slice(0, 3).map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-heading text-ink">{stat.value}</p>
              <p className="mt-1 text-caption tracking-tight text-muted uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </section>
      )}

      <article>
        <MDXRemote source={preprocessFenceBlocks(narrative, clientImages)} components={mdxComponents} />
      </article>

      {projects.length > 0 && (
        <div aria-label="Projects">
          {projects.map((project) => (
            <ProjectSection
              key={project.fullSlug}
              title={project.draft ? `${project.title} (draft)` : project.title}
            >
              <MDXRemote
                source={preprocessFenceBlocks(
                  project.content,
                  `/content-images/clients/${slug}/projects/${project.slug}/images`,
                )}
                components={mdxComponents}
              />
            </ProjectSection>
          ))}
        </div>
      )}

      {closing && (
        <div className="mt-20">
          <MDXRemote source={preprocessFenceBlocks(closing, clientImages)} components={mdxComponents} />
        </div>
      )}
    </main>
  );
}
