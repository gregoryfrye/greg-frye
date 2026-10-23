import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRoles, getClientsByRole, getRoleBySlug } from "@/lib/content";

export function generateStaticParams() {
  return getAllRoles().map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const role = getRoleBySlug((await params).slug);
  return role
    ? { title: `${role.title}, ${role.company} — Greg Frye`, description: role.description }
    : {};
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);
  if (!role) notFound();

  const clients = getClientsByRole(slug);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-gutter pt-40 pb-20">
      <p className="text-caption tracking-tight text-muted uppercase">
        {role.title} · {role.years} · {role.location}
      </p>
      <h1 className="mt-2 font-serif text-heading text-ink">{role.company}</h1>
      <p className="mt-6 text-body text-muted">{role.description}</p>

      {(clients.length > 0 || role.names.length > 0) && (
        <ul className="mt-12 flex flex-col gap-2">
          {clients.map((client) => (
            <li key={client.slug} className="text-body">
              <Link
                href={`/work/${client.slug}`}
                className="text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
              >
                {client.name}
              </Link>
            </li>
          ))}
          {role.names.map((name) => (
            <li key={name} className="text-body text-muted">
              {name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
