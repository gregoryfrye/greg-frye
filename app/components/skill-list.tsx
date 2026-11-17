import Link from "next/link";
import { Fragment } from "react";
import { getCurrentRole, getSkillBySlug } from "@/lib/content";
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
  // Services always read in the house order: the current role's list is the
  // canonical process order (leadership → story → build → launch → scale).
  const order = getCurrentRole()?.skills ?? [];
  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
  const items = [...skills]
    .sort((a, b) => rank(a) - rank(b))
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
