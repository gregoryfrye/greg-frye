import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ROLES_DIR = path.join(CONTENT_DIR, "roles");
const CLIENTS_DIR = path.join(CONTENT_DIR, "clients");
const SKILLS_DIR = path.join(CONTENT_DIR, "skills");
const STUDIES_DIR = path.join(CONTENT_DIR, "studies");

/**
 * Drafts (`draft: true` on a client or project) render on every review build —
 * wip.gregfrye.us, *.vercel.app previews, local dev — and are hidden on the
 * Production build, which only main produces. A hidden draft reads as if it
 * isn't on disk. `npm run qa:public` also errors on any draft before a merge.
 */
export const SHOW_DRAFTS = process.env.VERCEL_ENV !== "production";

export type Stat = {
  value: string;
  label: string;
};

export type Role = {
  slug: string;
  company: string;
  title: string;
  years: string;
  location: string;
  /** Slugs into /content/clients, where an entity exists. */
  clients: string[];
  /** Plain-text clients with no entity. */
  names: string[];
  description: string;
  /** Slugs into /content/skills. */
  skills: string[];
  /** Marks the role that drives the homepage hero. At most one. */
  current?: boolean;
};

/** A client is the case study entity — the narrative spine lives here. */
export type Client = {
  slug: string;
  name: string;
  /** Not every client has a defined era (e.g. an ongoing independent project). */
  years?: string;
  /** Slugs into /content/roles. */
  roles: string[];
  summary: string;
  /** Three max, by design. */
  stats?: Stat[];
  content: string;
  /**
   * `true` features the client on the homepage; a number also sets its place
   * in the strip (1 first). Unnumbered clients follow the numbered ones.
   */
  featuredOnHome?: boolean | number;
  /**
   * Short-form project slugs, in authored display order. A project on disk
   * but missing here (or vice versa) is a validateContentGraph warning.
   */
  projects?: string[];
  /** Visible on review builds only. See SHOW_DRAFTS. */
  draft?: boolean;
};

/** A project is a chapter within a client's story — no beats, nested under its client. */
export type Project = {
  /** Short form, unique within the owning client only. */
  slug: string;
  /** `${client}/${slug}` — globally unique, required for cross-client references. */
  fullSlug: string;
  /** Owning client slug, derived from directory nesting. */
  client: string;
  title: string;
  /** Slug into /content/roles. */
  role: string;
  /** Not every project has a defined era. */
  year?: string;
  /** Slugs into /content/skills. */
  skills: string[];
  summary: string;
  content: string;
  /** Filename within this project's /images folder. */
  featuredImage?: string;
  featuredOnHome?: boolean;
  /** Visible on review builds only. See SHOW_DRAFTS. */
  draft?: boolean;
};

export type Skill = {
  slug: string;
  name: string;
  summary: string;
  /** The one question this offering answers. Mirrors the matching Garden seat. */
  question?: string;
  /** Filename within this skill's /images folder. */
  featuredImage?: string;
  featuredOnHome?: boolean;
};

/** Inputs. Peers to clients, not children. */
export type Study = {
  slug: string;
  title: string;
  summary: string;
  /** Full-form (`client/project`) references — required, since a study has no containing client. */
  projects?: string[];
  clients?: string[];
  featuredOnHome?: boolean;
};

/** Outputs, nested under their owning project. */
export type Artifact = {
  /** Short form, unique within the owning project only. */
  slug: string;
  /** `${client}/${project}/${slug}` — globally unique. */
  fullSlug: string;
  /** Owning client slug, derived from directory nesting. */
  client: string;
  /** Owning project slug (short form), derived from directory nesting. */
  project: string;
  title: string;
  type: string;
  summary: string;
  /** Filename within this artifact's /images folder. */
  featuredImage?: string;
  featuredOnHome?: boolean;
};

/** One entry in the homepage's featuredOnHome strip, normalized across types. */
export type FeaturedEntity =
  | { kind: "client"; client: Client }
  | { kind: "project"; project: Project; client: Client | null }
  | { kind: "skill"; skill: Skill }
  | { kind: "artifact"; artifact: Artifact; project: Project | null; client: Client | null }
  | { kind: "study"; study: Study; client: Client | null };

function readMdx(filePath: string): { data: Record<string, unknown>; content: string } | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return matter(raw);
}

/** Slugs of flat .mdx files directly inside a collection folder (roles, skills). */
function listFlatSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/** Slugs of <slug>/index.mdx folders inside a collection folder. */
function listFolderSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const full = path.join(dir, name);
      return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "index.mdx"));
    });
}

function listImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => /\.(png|jpe?g|webp|gif|avif)$/i.test(file))
    .sort();
}

// --- roles ---

/** Reverse-chronological: most recent era first, parsed from the years range. */
export function getAllRoles(): Role[] {
  return listFlatSlugs(ROLES_DIR)
    .map((slug) => getRoleBySlug(slug))
    .filter((role): role is Role => role !== null)
    .sort((a, b) => startYear(b.years) - startYear(a.years));
}

function startYear(years: string): number {
  return Number(years.match(/\d{4}/)?.[0] ?? 0);
}

export function getRoleBySlug(slug: string): Role | null {
  const parsed = readMdx(path.join(ROLES_DIR, `${slug}.mdx`));
  if (!parsed) return null;
  const { data } = parsed;
  return {
    slug,
    company: data.company as string,
    title: data.title as string,
    years: data.years as string,
    location: data.location as string,
    clients: (data.clients as string[] | undefined) ?? [],
    names: (data.names as string[] | undefined) ?? [],
    description: data.description as string,
    skills: (data.skills as string[] | undefined) ?? [],
    current: data.current as boolean | undefined,
  };
}

/** The role marked current: true, if any — drives the homepage hero. */
export function getCurrentRole(): Role | null {
  return getAllRoles().find((role) => role.current) ?? null;
}

// --- clients (case studies) ---

export function getAllClients(): Client[] {
  return listFolderSlugs(CLIENTS_DIR)
    .map((slug) => getClientBySlug(slug))
    .filter((client): client is Client => client !== null);
}

export function getClientBySlug(slug: string): Client | null {
  const parsed = readMdx(path.join(CLIENTS_DIR, slug, "index.mdx"));
  if (!parsed) return null;
  const { data, content } = parsed;
  if (data.draft && !SHOW_DRAFTS) return null;
  return {
    slug,
    name: data.name as string,
    years: data.years as string | undefined,
    roles: (data.roles as string[] | undefined) ?? [],
    summary: data.summary as string,
    stats: data.stats as Stat[] | undefined,
    content,
    featuredOnHome: data.featuredOnHome as boolean | number | undefined,
    projects: data.projects as string[] | undefined,
    draft: data.draft === true,
  };
}

export function getClientImages(slug: string): string[] {
  return listImageFiles(path.join(CLIENTS_DIR, slug, "images"));
}

/** Union of this client's projects' skills, resolved to Skill objects. Derived, never authored. */
export function getClientSkills(clientSlug: string): Skill[] {
  const slugs = new Set<string>();
  for (const project of getProjectsByClient(clientSlug)) {
    for (const skillSlug of project.skills) slugs.add(skillSlug);
  }
  return [...slugs]
    .map((slug) => getSkillBySlug(slug))
    .filter((skill): skill is Skill => skill !== null);
}

// --- projects (nested under their client) ---

function projectsDirFor(clientSlug: string): string {
  return path.join(CLIENTS_DIR, clientSlug, "projects");
}

function readProject(clientSlug: string, projectSlug: string): Project | null {
  const parsed = readMdx(path.join(projectsDirFor(clientSlug), projectSlug, "index.mdx"));
  if (!parsed) return null;
  const { data, content } = parsed;
  if (data.draft && !SHOW_DRAFTS) return null;
  return {
    slug: projectSlug,
    fullSlug: `${clientSlug}/${projectSlug}`,
    client: clientSlug,
    title: data.title as string,
    role: data.role as string,
    year: data.year as string | undefined,
    skills: (data.skills as string[] | undefined) ?? [],
    summary: data.summary as string,
    content,
    featuredImage: data.featuredImage as string | undefined,
    featuredOnHome: data.featuredOnHome as boolean | undefined,
    draft: data.draft === true,
  };
}

export function getAllProjects(): Project[] {
  const projects: Project[] = [];
  for (const clientSlug of listFolderSlugs(CLIENTS_DIR)) {
    for (const projectSlug of listFolderSlugs(projectsDirFor(clientSlug))) {
      const project = readProject(clientSlug, projectSlug);
      if (project) projects.push(project);
    }
  }
  return projects;
}

/**
 * Resolves a project reference in either form:
 * - full form (`client/project`) — always unambiguous, works anywhere
 * - short form (`project`) — only valid relative to a containing client;
 *   without contextClientSlug it's ambiguous and resolves to null
 */
export function getProjectBySlug(slug: string, contextClientSlug?: string): Project | null {
  if (slug.includes("/")) {
    const [clientSlug, projectSlug] = slug.split("/");
    return readProject(clientSlug, projectSlug);
  }
  if (contextClientSlug) {
    return readProject(contextClientSlug, slug);
  }
  return null;
}

export function getProjectImages(clientSlug: string, projectSlug: string): string[] {
  return listImageFiles(path.join(projectsDirFor(clientSlug), projectSlug, "images"));
}

/** featuredImage → first image by filename order → undefined (text-only card). */
export function getProjectCardImage(project: Project): string | undefined {
  return project.featuredImage ?? getProjectImages(project.client, project.slug)[0];
}

/**
 * A client's projects in authored display order (client.projects[]), falling
 * back to directory order for anything on disk but not listed.
 */
export function getProjectsByClient(clientSlug: string): Project[] {
  const client = getClientBySlug(clientSlug);
  const onDisk = listFolderSlugs(projectsDirFor(clientSlug));
  const order = client?.projects?.filter((slug) => onDisk.includes(slug)) ?? [];
  const unlisted = onDisk.filter((slug) => !order.includes(slug));
  return [...order, ...unlisted]
    .map((slug) => readProject(clientSlug, slug))
    .filter((project): project is Project => project !== null);
}

export function getProjectsByRole(roleSlug: string): Project[] {
  return getAllProjects().filter((project) => project.role === roleSlug);
}

export function getProjectsBySkill(skillSlug: string): Project[] {
  return getAllProjects().filter((project) => project.skills.includes(skillSlug));
}

// --- artifacts (nested under their project) ---

function artifactsDirFor(clientSlug: string, projectSlug: string): string {
  return path.join(projectsDirFor(clientSlug), projectSlug, "artifacts");
}

function readArtifact(clientSlug: string, projectSlug: string, artifactSlug: string): Artifact | null {
  const parsed = readMdx(path.join(artifactsDirFor(clientSlug, projectSlug), artifactSlug, "index.mdx"));
  if (!parsed) return null;
  const { data } = parsed;
  return {
    slug: artifactSlug,
    fullSlug: `${clientSlug}/${projectSlug}/${artifactSlug}`,
    client: clientSlug,
    project: projectSlug,
    title: data.title as string,
    type: data.type as string,
    summary: data.summary as string,
    featuredImage: data.featuredImage as string | undefined,
    featuredOnHome: data.featuredOnHome as boolean | undefined,
  };
}

export function getAllArtifacts(): Artifact[] {
  const artifacts: Artifact[] = [];
  for (const project of getAllProjects()) {
    for (const artifactSlug of listFolderSlugs(artifactsDirFor(project.client, project.slug))) {
      const artifact = readArtifact(project.client, project.slug, artifactSlug);
      if (artifact) artifacts.push(artifact);
    }
  }
  return artifacts;
}

export function getArtifactsByProject(clientSlug: string, projectSlug: string): Artifact[] {
  return listFolderSlugs(artifactsDirFor(clientSlug, projectSlug))
    .map((slug) => readArtifact(clientSlug, projectSlug, slug))
    .filter((artifact): artifact is Artifact => artifact !== null);
}

export function getArtifactImages(artifact: Artifact): string[] {
  return listImageFiles(path.join(artifactsDirFor(artifact.client, artifact.project), artifact.slug, "images"));
}

/** featuredImage → first image by filename order → undefined (text-only card). */
export function getArtifactCardImage(artifact: Artifact): string | undefined {
  return artifact.featuredImage ?? getArtifactImages(artifact)[0];
}

// --- skills ---

export function getAllSkills(): Skill[] {
  return listFolderSlugs(SKILLS_DIR)
    .map((slug) => getSkillBySlug(slug))
    .filter((skill): skill is Skill => skill !== null);
}

export function getSkillBySlug(slug: string): Skill | null {
  const parsed = readMdx(path.join(SKILLS_DIR, slug, "index.mdx"));
  if (!parsed) return null;
  const { data } = parsed;
  return {
    slug,
    name: data.name as string,
    summary: data.summary as string,
    question: data.question as string | undefined,
    featuredImage: data.featuredImage as string | undefined,
    featuredOnHome: data.featuredOnHome as boolean | undefined,
  };
}

export function getSkillImages(slug: string): string[] {
  return listImageFiles(path.join(SKILLS_DIR, slug, "images"));
}

/** featuredImage → first image by filename order → undefined (text-only card). */
export function getSkillCardImage(skill: Skill): string | undefined {
  return skill.featuredImage ?? getSkillImages(skill.slug)[0];
}

// --- studies (inputs, peers to clients) ---

export function getAllStudies(): Study[] {
  return listFolderSlugs(STUDIES_DIR)
    .map((slug) => getStudyBySlug(slug))
    .filter((study): study is Study => study !== null);
}

export function getStudyBySlug(slug: string): Study | null {
  const parsed = readMdx(path.join(STUDIES_DIR, slug, "index.mdx"));
  if (!parsed) return null;
  const { data } = parsed;
  return {
    slug,
    title: data.title as string,
    summary: data.summary as string,
    projects: data.projects as string[] | undefined,
    clients: data.clients as string[] | undefined,
    featuredOnHome: data.featuredOnHome as boolean | undefined,
  };
}

// --- reverse joins ---

export function getClientsByRole(roleSlug: string): Client[] {
  const role = getRoleBySlug(roleSlug);
  if (!role) return [];
  return role.clients
    .map((slug) => getClientBySlug(slug))
    .filter((client): client is Client => client !== null);
}

export function getRolesByClient(clientSlug: string): Role[] {
  return getAllRoles().filter((role) => role.clients.includes(clientSlug));
}

// --- homepage featured strip ---

/**
 * Every entity across all six collections flagged featuredOnHome: true,
 * normalized with enough context (parent project/client) to build a card.
 * Collection order (client, project, skill, artifact, study) is the
 * display order; clients sort by a numeric featuredOnHome (1 first) — set featuredOnHome on exactly the entities meant to
 * appear, don't hardcode the picks here.
 */
export function getFeaturedOnHome(): FeaturedEntity[] {
  const items: FeaturedEntity[] = [];

  const homeOrder = (client: Client) =>
    typeof client.featuredOnHome === "number" ? client.featuredOnHome : Infinity;
  const featuredClients = getAllClients()
    .filter((client) => client.featuredOnHome)
    .sort((a, b) => homeOrder(a) - homeOrder(b));
  for (const client of featuredClients) items.push({ kind: "client", client });

  for (const project of getAllProjects()) {
    if (project.featuredOnHome) {
      items.push({ kind: "project", project, client: getClientBySlug(project.client) });
    }
  }

  for (const skill of getAllSkills()) {
    if (skill.featuredOnHome) items.push({ kind: "skill", skill });
  }

  for (const artifact of getAllArtifacts()) {
    if (artifact.featuredOnHome) {
      items.push({
        kind: "artifact",
        artifact,
        project: getProjectBySlug(`${artifact.client}/${artifact.project}`),
        client: getClientBySlug(artifact.client),
      });
    }
  }

  for (const study of getAllStudies()) {
    if (study.featuredOnHome) {
      const clientSlug = study.clients?.[0];
      const client = clientSlug ? getClientBySlug(clientSlug) : null;
      items.push({ kind: "study", study, client });
    }
  }

  return items;
}

// --- build-time validation ---

/** Warns (does not throw) on any slug reference across collections that doesn't resolve. */
export function validateContentGraph(): string[] {
  const warnings: string[] = [];
  const roleSlugs = new Set(getAllRoles().map((role) => role.slug));
  // On-disk slugs, not getAllClients(): a draft hidden on Production isn't a broken reference.
  const clientSlugs = new Set(listFolderSlugs(CLIENTS_DIR));
  const skillSlugs = new Set(getAllSkills().map((skill) => skill.slug));
  const allProjects = getAllProjects();
  const projectFullSlugs = new Set(allProjects.map((project) => project.fullSlug));

  for (const role of getAllRoles()) {
    for (const slug of role.clients) {
      if (!clientSlugs.has(slug)) {
        warnings.push(`role "${role.slug}" references missing client "${slug}"`);
      }
    }
    for (const slug of role.skills) {
      if (!skillSlugs.has(slug)) {
        warnings.push(`role "${role.slug}" references missing skill "${slug}"`);
      }
    }
  }

  for (const client of getAllClients()) {
    for (const slug of client.roles) {
      if (!roleSlugs.has(slug)) {
        warnings.push(`client "${client.slug}" references missing role "${slug}"`);
      }
    }

    const onDisk = listFolderSlugs(projectsDirFor(client.slug));
    for (const slug of client.projects ?? []) {
      if (!onDisk.includes(slug)) {
        warnings.push(`client "${client.slug}" lists project "${slug}" that doesn't exist on disk`);
      }
    }
    for (const slug of onDisk) {
      if (!(client.projects ?? []).includes(slug)) {
        warnings.push(
          `client "${client.slug}" has project "${slug}" on disk but not in its projects[] order`,
        );
      }
    }
  }

  for (const project of allProjects) {
    if (!roleSlugs.has(project.role)) {
      warnings.push(`project "${project.fullSlug}" references missing role "${project.role}"`);
    }
    for (const slug of project.skills) {
      if (!skillSlugs.has(slug)) {
        warnings.push(`project "${project.fullSlug}" references missing skill "${slug}"`);
      }
    }
  }

  for (const study of getAllStudies()) {
    for (const ref of study.projects ?? []) {
      if (!ref.includes("/")) {
        warnings.push(
          `study "${study.slug}" references project "${ref}" in short form — studies are peers to clients, so this is ambiguous; use "client/project"`,
        );
      } else if (!projectFullSlugs.has(ref)) {
        warnings.push(`study "${study.slug}" references missing project "${ref}"`);
      }
    }
    for (const slug of study.clients ?? []) {
      if (!clientSlugs.has(slug)) {
        warnings.push(`study "${study.slug}" references missing client "${slug}"`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[content] ${warnings.length} broken reference(s):\n${warnings.map((w) => `  - ${w}`).join("\n")}`,
    );
  }

  return warnings;
}
