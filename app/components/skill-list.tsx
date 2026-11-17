import Link from "next/link";
import { Fragment } from "react";
import { getSkillBySlug } from "@/lib/content";
import { INLINE_LINK } from "@/app/components/ui/inline-link";

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
    <p aria-label={label} className={`type-body-small text-ink ${className}`}>
      {items.map((skill, i) => (
        <Fragment key={skill.slug}>
          <Link
            href={`/skills/${skill.slug}`}
            className={INLINE_LINK}
          >
            {skill.name}
          </Link>
          {i < items.length - 1 && ", "}
        </Fragment>
      ))}
    </p>
  );
}
