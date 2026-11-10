import Link from "next/link";
import { getSkillBySlug } from "@/lib/content";

/** Skill tags — one style everywhere skills are listed (Services, roles). */
export function SkillList({
  skills,
  label,
  className = "",
}: {
  skills: string[];
  label: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={`flex flex-col gap-2 ${className}`}>
      {skills.map((skillSlug) => {
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
  );
}
