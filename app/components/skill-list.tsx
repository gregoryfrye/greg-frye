import Link from "next/link";
import { Fragment } from "react";
import { getSkillBySlug } from "@/lib/content";

/** Skills by slug as one comma-separated line of links (role rows). */
export function SkillList({
  skills,
  label,
  className = "",
}: {
  skills: string[];
  label: string;
  className?: string;
}) {
  const items = skills
    .map((slug) => getSkillBySlug(slug))
    .filter((skill): skill is NonNullable<typeof skill> => skill !== null);
  return (
    <p aria-label={label} className={`type-label text-ink ${className}`}>
      {items.map((skill, i) => (
        <Fragment key={skill.slug}>
          <Link
            href={`/skills/${skill.slug}`}
            className="text-ink underline decoration-transparent underline-offset-4 transition-colors motion-fast ease-standard hover:decoration-ink"
          >
            {skill.name}
          </Link>
          {i < items.length - 1 && ", "}
        </Fragment>
      ))}
    </p>
  );
}
