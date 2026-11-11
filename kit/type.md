# Type

**Why roles.** Each role bundles family, weight, style, size, line height and tracking, so one class (`type-body`) carries the whole decision and a change lands everywhere that role appears. Roles are named by job, not size.

**Where.** Use `type-<role>` on any text. Sizes scale fluidly from the compact viewport (375) to the expanded one (1280). Values come from the 2026 Figma, frame `01_Client_1280`.

| Role | Expanded / compact | Job |
|---|---|---|
| `type-title` | 108 / 54, serif, 0.9 | Case study name |
| `type-display` | 72 / 36, serif, 0.9 | Big statements in the spine |
| `type-stat` | 72 / 45, serif, 0.95 | Stat figures |
| `type-body` | 27 / 18, serif, 1.15 | Reading text and ledes |
| `type-label` | 21 / 15, serif, 1.15 | Nav, chapter index, beat labels, stat captions |
| `type-credit` | 27 / 18, serif italic, 1.08 | Photo and project credits |
| `type-meta` | 15, sans, 1.2 | Dates (cards, roles): the standard date treatment |

**Scale.** Sizes sit on Greg's scale: 6 9 12 15 18 21 27 36 45 54 72 90 108. (21 is the label step the Figma uses.) Compact sizes are provisional until the Visual Design Pass.

**Families.** Serif (Times until ITC Clearface has a web licence) carries everything. Sans is for dates only. Mono is defined but unused: the Figma labels are serif, so whether labels go mono is a look decision for Greg.

**Legacy.** `text-display`, `text-heading`, `text-body`, `text-caption` and `text-meta` are the pre-kit sizes still used by current components. The Visual Design Pass moves each component onto a role, then the legacy sizes are deleted. Don't use them in new work.

**When the kit is silent.** Pick the role whose job matches, not the one whose size looks right. If no job matches, propose a role (name it by job) rather than inlining a size.
