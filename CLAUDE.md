# CLAUDE.md

Conventions for this repo. Read before touching content or styling.

## Content

All content lives in `/content`, organized into six typed collections. It is
the source of truth — nothing gets duplicated into `/public`; images are
served at request time by `app/content-images/[...segments]/route.ts` reading
straight from `/content`.

The model: **roles → clients → projects → artifacts**, with **skills**
attached to projects (client-level skills derive as the union — never
authored directly), and **studies** (inputs) as peers to clients, not
children. Every cross-entity reference is a slug in frontmatter — never
copy-pasted text. `lib/content.ts` is the only code that reads `/content`;
it exposes a getter and `getAllX` for each collection, plus the join
functions (`getProjectsByClient`, `getProjectsByRole`, `getProjectsBySkill`,
`getClientsByRole`, `getRolesByClient`, `getClientSkills`,
`getFeaturedOnHome`) and `validateContentGraph()`, which warns at build time
on any slug reference that doesn't resolve. Call it, don't silently ignore
broken refs.

**Projects and artifacts nest inside their owning client** — you work one
case study at a time, and flat top-level `projects/`/`artifacts/`
directories force jumping between trees to edit one story:

```
content/
  clients/
    hudson-cannabis/
      index.mdx
      images/
      projects/
        brand-identity-narrative/
          index.mdx
          images/
          artifacts/
```

A project's `client`/`slug` and an artifact's `client`/`project`/`slug` are
all derived from the path at read time — never authored in frontmatter.

**Slug resolution — short form vs. full form.** A project's short slug
(`brand-identity-narrative`) is valid only *within* its own client; multiple
clients can and will have projects with the same short slug. Its full slug
(`hudson-cannabis/brand-identity-narrative`) is globally unique and required
for any reference from outside that client's directory — most importantly
**studies**, which are peers to clients and have no containing client to
resolve a short slug against. `getProjectBySlug(slug, contextClientSlug?)`
implements this: full form always resolves; short form only resolves with a
context client. `validateContentGraph()` flags a short-form project
reference from a study as ambiguous.

- **Roles** — `/content/roles/<slug>.mdx`, flat files, one per era.
  Frontmatter: `company`, `title`, `years`, `location`, `clients` (slugs
  into `/content/clients`, where an entity exists), `names` (plain text for
  clients with no entity), `description`, `skills` (slugs into
  `/content/skills`), optional `current`. At most one role is `current:
  true` — it drives the homepage hero (about copy + skills column). Role ↔
  client is declared on both sides (role's `clients[]` and client's
  `roles[]`) — keep them in sync or joins silently return nothing.
- **Clients** — `/content/clients/<slug>/index.mdx` + `/images`. **Clients
  are case studies** — the narrative spine (see Copy tone) lives here, at
  the client level, nowhere else. Frontmatter: `name`, optional `years` (not
  every client has a defined era), `roles` (slugs), `summary`, `stats`,
  optional `featuredOnHome`, optional `projects` (short-form slugs, in
  **authored display order** — a project on disk but missing here, or vice
  versa, is a `validateContentGraph` warning).
- **Projects** — `/content/clients/<client>/projects/<slug>/index.mdx` +
  `/images` + `/artifacts`. **Projects are chapters**, not case studies: no
  spine, no duplicating the client's story — and since projects don't have
  their own route, each must also work read inline on the client page.
  Frontmatter: `title`, `role` (slug), optional `year`, `skills` (slugs),
  `summary`, optional `featuredImage`, optional `featuredOnHome`. Body:
  scope and process notes, using the fence-block image primitives below.
- **Skills** — `/content/skills/<slug>/index.mdx` + `/images`. Frontmatter:
  `name`, `summary`, optional `featuredImage`, optional `featuredOnHome`. No
  body. Skills are Greg's public services, one per Garden seat (the seat's
  Offering in Notion's Agents database).
- **Studies** (inputs) — `/content/studies/<slug>/index.mdx`. **Peers to
  clients, not children.** Frontmatter: `title`, `summary`, optional
  `clients` (slugs), optional `projects` (full-form slugs — required, see
  slug resolution above), optional `featuredOnHome`.
- **Artifacts** (outputs) —
  `/content/clients/<client>/projects/<project>/artifacts/<slug>/index.mdx`
  + `/images`. Frontmatter: `title`, `type`, `summary`, optional
  `featuredImage`, optional `featuredOnHome`.

Image filenames are prefixed `01-`, `02-`, etc. — prefix order is display
order; `lib/content.ts` sorts each `/images` folder by filename. Clients,
projects, skills, and artifacts all follow the same image fallback chain:
`featuredImage` (a filename in that entity's `/images`) → first image by
filename order → no image, text-only card. Never an error, never broken
layout space.

**Fence-block image primitives.** Inside a client's or project's MDX body,
mark image placement with a `::: type` fence:

```
::: pair
1. Cannabis plant against open sky
2. Greenhouse canopy, overhead
Caption: Sun-grown, living soil, hand-trimmed.
:::
```

`lib/content-blocks.ts`'s `preprocessFenceBlocks()` rewrites these into
`<ImageBlock>` tags before the source reaches `MDXRemote` — always run it on
`client.content` and each `project.content`. Props travel as a single
URL-encoded JSON string attribute, not expression-valued props
(`images={[...]}`) — MDX's expression parser doesn't reliably round-trip
array literals injected this way when nested inside another custom
component's children. Six types are recognized:

| Type | Behavior |
|---|---|
| `full` | Full-bleed single image, breaks the text column (wide container) |
| `pair` | Two side by side, equal width, stack on mobile (wide container) |
| `inset` | Single image inline in the text column, no break (prose container) |
| `stagger` | v1: grid, up to 3 across. Later: 2–3 offset images at different scales |
| `scroll` | v1: grid, up to 3 across. Later: horizontal scroll-snap strip |
| `motion` | v1: grid (poster frame). Later: silent autoplay loop |

Every block takes an optional caption, styled as content, not metadata.

A line that starts with a filename points at a real image in the owning
entity's `/images` folder; text after ` | ` is the alt text:

```
::: pair
1. 03-plant-sky.jpg | Cannabis plant against open sky
2. Greenhouse canopy, overhead
:::
```

A line without a filename stays a placeholder showing the description text,
so a block can be wired one image at a time. Real images render at their
natural aspect ratio; placeholders keep a fixed aspect box. The page template
passes each entity's image URL base into `preprocessFenceBlocks()`.
Images land web-ready: JPEG, long edge ≤ 2400px.
Upgrading a stubbed type (`stagger`/`scroll`/`motion`) to its real behavior
is a component swap in `app/components/image-block.tsx`, not a content
migration — the fence syntax and props don't change.

**Homepage featured strip.** Set `featuredOnHome: true` on any client,
project, skill, artifact, or study to put it in the homepage strip —
`getFeaturedOnHome()` scans all five collections and returns them in that
order (client, project, skill, artifact, study). Don't hardcode the picks in
a page component; add the flag to the content instead.

**Entities are earned by content.** Create an entity file only when there's a
real case study, project, study, or artifact behind it. A name with nothing
behind it is plain text (a role's `names[]`, unlinked text elsewhere) — never
a stub entity, and never a link to a route that doesn't exist.

## Copy tone

Declarative and short. No soft narrative paragraphs. State what happened.

Declarative doesn't mean flat: a named tension or a stated bet is strategic
content. The rule targets mood-language (shepherding, resonance, journey),
not thesis statements.

**Case studies (clients) have two content tiers, and the reader must feel
the mode change between them.**

*Narrative (the spine)* — the argument. Text-led, fast, short sections,
authored via `<SpineSection label="..." subhead="...">` directly in the
client's MDX body. `label` is a reusable functional marker (Context,
Complication, The Turn, Approach, Positioning, Market Thesis, Entry, or
whatever a future case study needs) — keep the label vocabulary consistent
across case studies. `subhead` is project-specific prose, one line.

*Projects (the evidence)* — image-forward, named units, nested under their
client (see Content). Rendered inline via `<ProjectSection title="...">` —
assume nobody clicks through to a project's own page; each must work
standalone in the flow. No spine labels here, just a title and body.

`Results` (typographic, no images) and `Credits` close the page as plain
`##` sections in the client's MDX body, after the spine and separate from
the interleaved projects. Projects render between the spine and Results —
`lib/content-blocks.ts`'s `splitClientContent()` splits the client's body at
the `## Results` heading so the page template can insert the projects loop
between the two halves. A client with no `## Results` heading just renders
its whole body as spine, no closing section.

## Styling

Tailwind design tokens only — type scale, spacing, color roles — defined in
the `@theme` block in `app/globals.css`. Never hardcode a color, font size, or
spacing value in a component. If a value doesn't have a token yet, add the
token, don't inline the value.

Current tokens (seeded from Greg's 2026 Figma, file `19deN2JJWs7hvt12Z0neT4`,
newest frames on the right; nothing there is final):

- Colors: `canvas` (white, inner pages), `canvas-home` (the homepage's brown
  field, applied when the page's `<main data-canvas="home">`), `ink`, `muted`,
  `border`
- Fonts: `font-serif` (primary), `font-sans` (secondary)
- Type scale: `text-display`, `text-heading`, `text-body`, `text-caption`
- Spacing: `spacing-nav`, `spacing-gutter`
- Containers: `container-wide` (`max-w-wide`, 1280px), `container-prose`
  (`max-w-prose`, 672px)

**Two-container rule.** `max-w-wide` is for layout — anything with real
horizontal structure: the hero, the featured strip, the roles index (its
multi-column rows need the room), nav, footer. `max-w-prose` is for
continuous text — the case study header, the spine's prose, and any future
MDX content. A page can nest both: on `/work/[slug]`, the outer container is
wide, but the header and every text-bearing MDX element (`p`, `h2`, `ul`)
self-center to `max-w-prose`, while stats and the `full`/`pair`/`stagger`/
`scroll`/`motion` image blocks use the full wide container (`inset` stays at
`max-w-prose`, matching the surrounding text — see the fence-block table in
Content). Don't put multi-column or grid content inside `max-w-prose` —
that's exactly the illegibility this rule exists to prevent.

## Branches and review

- `claude/preview` is the working branch. Claude pushes here; Vercel builds
  it as Preview and serves it at **wip.gregfrye.us** (Preview domain, Git
  branch `claude/preview`).
- `main` is Production — gregfrye.us and www. Changes reach it only when Greg
  merges a `claude/preview` → `main` pull request.
- `lib/site.ts` lists the public hosts. Every other host renders the same
  build with `robots: noindex` (set in `app/layout.tsx`).
- DNS for gregfrye.us is managed at the registrar (Google Domains
  nameservers). MX and SPF records carry email — add records, never change
  nameservers.

## Checks

- `npm run qa` — content QA (broken refs, fence images, image size, drafting
  notes). Reports only; fine to push to `claude/preview` with warnings.
- `npm run qa:public` — the gate before merging to `main`: brackets, stub
  lines, placeholder images, and design-system findings become errors.
- Design-system findings (both modes) scan `app/`: raw hex or color
  functions outside the `@theme` block, arbitrary Tailwind values
  (`text-[13px]`; aspect ratios are allowed), inline style objects, and
  craft antipatterns (`transition-all`, gradients, decorative shadows). Fix
  by adding or using a token, never by inlining. No dependencies, so it runs
  anywhere Node runs, including the cloud workspace.

## Drafts and the Notion tracker

- `draft: true` on a client or project shows it on review builds (wip,
  previews, local) and hides it on Production (`SHOW_DRAFTS` in
  `lib/content.ts`, keyed on `VERCEL_ENV`). Drafts render with a "Draft"
  marker. Drafts can merge to `main`: `qa:public` keeps drafting notes and
  placeholders inside a draft as warnings, and stays strict on everything
  visible.
- Notion's **Case Studies** database (Community Garden / Projects / Frye
  Creative) tracks each case study: Status (Draft = draft on wip, In Review
  = on wip awaiting merge, Live = on gregfrye.us), Offerings (union of the
  projects' skills), Preview (wip link), Repo Path. The page body is an
  outline from `python3 scripts/notion-outline.py <slug>`. Copy stays in
  the repo; after a content change, regenerate the outline and update the
  row's properties to match.

## Working with Greg

- New or heavy phases (a new case study, positioning, a homepage rewrite)
  start with a voice interview: Claude asks short questions, Greg talks it
  through, then Claude drafts. Don't open with a document or a design file.
- What he shares about why he works the way he does is context for tone, not
  copy to quote.

## Scope discipline

This is a small, git-native site. Don't add content types, components, or
systems (captions, tagging, search, CMS UI) beyond what a task explicitly
asks for.

## Phase 1.5

Resolved by the case-study rebuild (nested projects, `client.projects[]`,
`<SpineSection>`/`<ProjectSection>`, fence-block images): project/chapter
ordering, beat-anchored image placement, and how the spine and projects
interleave on the client page.

Still open:

- Upgrade `stagger`/`scroll`/`motion` image blocks from their v1
  grid stub to real behavior (offset stack, horizontal
  scroll-snap, silent autoplay loop) — do this once there's real content to
  evaluate them against, not before.
- Homepage featured-strip ordering for non-client cards. Clients take an
  authored order (`featuredOnHome: 1`, `2`, …; `true` sorts after numbered);
  projects, skills, artifacts, and studies still follow collection order.
- Hudson, HealHaus, Beni, Sustain Natural, and Lalo fence blocks are wired
  to images pulled from the 2026 folio PDF and the `_/` batch. App and
  ecommerce images are full folio slides (device comps on a colored field),
  not individual screens — swap in cleaner exports when they exist. Hudson's
  operating-model `motion` block was pulled for 1.0 (see the MDX comment
  in that project) and comes back with footage.
