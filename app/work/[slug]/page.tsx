import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ImageBlock } from "@/app/components/image-block";
import { ProjectSection } from "@/app/components/project-section";
import { SpineSection } from "@/app/components/spine-section";
import { preprocessFenceBlocks, splitClientContent } from "@/lib/content-blocks";
import { BeatHeader } from "@/app/components/ui/beat-header";
import { CollectionCard } from "@/app/components/ui/collection-card";
import { Stat } from "@/app/components/ui/stat";
import { ChapterIndex, type Chapter } from "@/app/components/modules/chapter-index";
import { caseStudiesLive } from "@/lib/site";
import {
  getAllClients,
  getClientLeadImageUrl,
  getFeaturedOnHome,
  getClientBySlug,
  getClientImages,
  COLLECTION_LABEL,
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
  const { slug } = await params;
  const client = getClientBySlug(slug);
  if (!client) return {};
  const title = `${client.name} — Greg Frye`;
  // Falls back to the site's placeholder share image when a client has none.
  const image = getClientLeadImageUrl(slug) ?? getClientLeadImageUrl("hudson-cannabis");
  return {
    title,
    description: client.summary,
    openGraph: { title, description: client.summary, ...(image ? { images: [image] } : {}) },
  };
}

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-section max-w-prose type-title text-ink first:mt-0" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-block max-w-prose type-body text-ink first:mt-0" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-block flex max-w-prose list-disc flex-col gap-item pl-inline type-body text-ink first:mt-0" {...props} />
  ),
  SpineSection,
  ImageBlock,
};

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Letters each spine beat (A, B, C …) and gives it an anchor, so the chapter
 * index can list and track it. Authors write plain <SpineSection label subhead>.
 */
function markSpine(source: string): { source: string; beats: Chapter[] } {
  const beats: Chapter[] = [];
  const marked = source.replace(/<SpineSection\s+label="([^"]+)"/g, (_, label: string) => {
    const id = slugify(label);
    const marker = String.fromCharCode(65 + beats.length);
    beats.push({ id, label, marker });
    return `<SpineSection marker="${marker}" id="${id}" label="${label}"`;
  });
  return { source: marked, beats };
}

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
  const eyebrow = [client.draft ? "Draft" : null, roleTitles, client.years].filter(Boolean).join(" · ");
  const { narrative, closing } = splitClientContent(client.content);
  const spine = markSpine(narrative);
  const clientImages = `/content-images/clients/${slug}/images`;
  const projectId = (projectSlug: string) => `project-${projectSlug}`;
  // The chapter index: the spine's beats, then the projects, then the close.
  const chapters: Chapter[] = [
    ...spine.beats,
    ...projects.map((project, i) => ({ id: projectId(project.slug), label: project.title, marker: String(i + 1).padStart(2, "0") })),
    ...(closing ? [{ id: "results", label: "Results", marker: "" }] : []),
  ];
  // Recirculation: the homepage's featured case studies, minus this one.
  const moreWork = getFeaturedOnHome()
    .flatMap((item) => (item.kind === "client" ? [item.client] : []))
    .filter((other) => other.slug !== slug);

  return (
    <main className="mx-auto flex w-full max-w-wide flex-1 flex-col gap-20 px-gutter pt-40 pb-20">
      {/* Index · story on the same 4-column grid as the case hero: the chapter index sits in the first
          column (sticky from md), the case study in the other three. On phones the index follows the header. */}
      <div className="grid grid-cols-1 items-start gap-x-gutter gap-y-section md:grid-cols-4">
        <header className="md:col-span-3 md:col-start-2">
          {eyebrow && <p className="type-label text-muted">{eyebrow}</p>}
          <h1 className="mt-item type-display text-ink">{client.name}</h1>
          <p className="mt-block max-w-hero type-body-lede text-ink">{client.summary}</p>
          {client.stats && client.stats.length > 0 && (
            <dl aria-label="Stats" className="mt-section grid grid-cols-1 gap-gutter sm:grid-cols-3">
              {client.stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <Stat value={stat.value} label={stat.label} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        {chapters.length > 1 && (
          <aside className="self-stretch md:col-start-1 md:row-span-2 md:row-start-1">
            <ChapterIndex chapters={chapters} />
          </aside>
        )}

        <div className="md:col-span-3 md:col-start-2">
          <article>
            <MDXRemote source={preprocessFenceBlocks(spine.source, clientImages)} components={mdxComponents} />
          </article>

          {projects.map((project, i) => (
            <ProjectSection
              key={project.fullSlug}
              id={projectId(project.slug)}
              marker={String(i + 1).padStart(2, "0")}
              title={project.draft ? `${project.title} (draft)` : project.title}
              summary={project.summary}
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

          {closing && (
            <section id="results" className="mt-section scroll-mt-masthead">
              <BeatHeader label="Results" />
              <div className="mt-block">
                <MDXRemote source={preprocessFenceBlocks(closing.replace(/^##\s+Results\s*\n/, ""), clientImages)} components={mdxComponents} />
              </div>
            </section>
          )}
        </div>
      </div>

      {moreWork.length > 0 && (
        <section aria-labelledby="more-work">
          <h2 id="more-work" className="sr-only">More work</h2>
          <BeatHeader label="More work" />
          <div className="mt-block grid grid-cols-2 items-start gap-gutter sm:grid-cols-4 md:grid-cols-6">
            {moreWork.map((other) => {
              const image = getClientImages(other.slug)[0];
              const link = caseStudiesLive
                ? { href: `/work/${other.slug}`, external: false }
                : other.url
                  ? { href: other.url, external: true }
                  : { href: undefined, external: false };
              return (
                <CollectionCard
                  key={other.slug}
                  label={COLLECTION_LABEL.client}
                  years={other.years}
                  title={other.name}
                  summary={other.summary}
                  size="large"
                  {...link}
                  imageSrc={image ? `/content-images/clients/${other.slug}/images/${image}` : undefined}
                />
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
