import { getSkillBySlug } from "@/lib/content";
import { NumberedList } from "@/app/components/ui/numbered-list";

/** Skills by slug, in the one index-list style (ruled rows, no numbers). */
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
    .filter((skill): skill is NonNullable<typeof skill> => skill !== null)
    .map((skill) => ({ label: skill.name, href: `/skills/${skill.slug}` }));
  return <NumberedList items={items} label={label} numbered={false} className={className} />;
}
