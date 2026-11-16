# Type

**Why roles.** Each role bundles family, weight, style, size, line height and tracking, so one class (`type-body`) carries the whole decision and a change lands everywhere that role appears. Roles are named by tier and job, never by HTML heading level: which heading level an element is (`h1`, `h2`) is page structure and accessibility, decided in the markup; any heading can wear any role. The core set is shared across Greg's projects (site-design-pipeline); a project adds variants, not new roles.

**Typefaces.** Established before the scale:

- **Serif · Times New Roman** (`--font-serif`) — primary. Everything: titles, statements, reading text, labels, credits.
- **Alt header · ITC Clearface** (`--font-display-alt`) — kept as an alternate for titles and statements while the direction settles. Not applied; falls back to Times until it has a web licence.
- **Sans · Helvetica** (`--font-sans`) — dates only (`type-caption`).
- **Mono · GT America Mono** (`--font-mono`) — Greg's pick (11/11). Set up, not in use yet; falls back to the system mono until it has a web licence. Whether labels go mono is still open.

**Where.** Use `type-<role>` on any text. Sizes **step**: compact below `md` (960), expanded at `md` and up, exactly like Figma's Layout modes (Compact / Expanded). Stepped, not fluid, so breakpoints and grids stay in Greg's hands. The legacy `text-*` sizes are still fluid until they're deleted. Values come from the 2026 Figma, frame `01_Client_1280`.

| Role | Expanded / compact | Job |
|---|---|---|
| `type-display` | 108 / 54, serif, 0.9 | The biggest, about one per page: case study name, hero |
| `type-headline` | 72 / 36, serif, 0.9 | Big statements and section openers; stat figures |
| `type-title` | 45 / 27, serif, 1.05 | Card and block titles |
| `type-deck` | 36 / 21, serif, 1.2 | Summary line under a title |
| `type-body` | 27 / 18, serif, 1.15 | Reading text |
| `type-body-lede` | 36 / 21, serif, 1.2 | Variant: a larger first paragraph, when a piece opens without a deck |
| `type-label` | 21 / 15, serif, 1.15 | Nav, index, markers, buttons, stat captions |
| `type-caption` | 15, sans, 1.2 | Dates and small notes: the standard date treatment |
| `type-caption-credit` | 27 / 18, serif italic, 1.08 | Variant: photo and project credits |

**Deck vs. lede.** The deck is a summary line under a title, set larger than the body. The lede is the first paragraph of the body; it only gets the larger `body-lede` variant when there's no deck above it.

**Variants.** `type-<role>-<variant>` inherits its role and overrides only what differs (here: `body-lede`, `caption-credit`). Add a variant for a project-specific job before adding a role.

**Scale.** Sizes sit on Greg's scale: 6 9 12 15 18 21 27 36 45 54 72 90 108. (21 is the label step the Figma uses.) Compact sizes are provisional until the Visual Design Pass.

**Legacy.** `text-display`, `text-heading`, `text-body`, `text-caption` and `text-meta` are the pre-kit sizes still used by current components. The Visual Design Pass moves each component onto a role, then the legacy sizes are deleted. Don't use them in new work.

**When the kit is silent.** Pick the role whose job matches, not the one whose size looks right. If no job matches, propose a role (name it by job) rather than inlining a size.
