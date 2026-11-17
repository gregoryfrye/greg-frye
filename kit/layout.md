# Layout

**Breakpoints** (Greg's scale): `xs` 320 · `sm` 640 · `md` 960 · `lg` 1280 · `xl` 1600 · `2xl` 1920. Compact and expanded layouts switch at `md` (960). Tailwind's defaults are replaced, so `md:` means 960 here, not 768.

**Rhythm.** Everything spaces on 9px. Spacing is named by job:

| Token | px | Job |
|---|---|---|
| `item` | 9 | Between lines in a list or index |
| `inline` | 18 | Between items in a row |
| `block` | 27 | Between blocks inside a section |
| `section` | 45 | Section padding, top and bottom |
| `gutter` | 27 | Page gutter and column gap |
| `nav` | 27 | Nav padding |
| `marker` | 54 | Marker column in beat headers (the A / 04 before a label) |
| `index` | 99 | Marker column in numbered index lists (homepage services, Figma 00_Index) |
| `masthead` | 81 | Clearance under the fixed nav: sticky `top-masthead`, anchors `scroll-mt-masthead` |

Use them as Tailwind classes: `gap-item`, `mt-block`, `py-section`, `px-gutter`. Tailwind's numeric scale (`gap-2`, `mt-6`) is legacy and moves onto these in the Visual Design Pass.

**Page frame.** Every full-width band (nav, main, footer) is `mx-auto max-w-wide px-gutter` on one element: the gutter sits inside the 1280 container, so all content shares one left and right edge (1226 wide at most, 27 from the window edge below that). Never pad outside the container and cap inside it.

**Grids.** One column system across Greg's projects: layouts divide the wide container into **1, 2, 3, 4 or 6** equal columns, always with the `gutter` gap. Write them as spans of a 12-column grid when a row mixes widths, so every line falls on the same edges: a 3-column row's lines sit at 4 and 8 twelfths, so a row of 6 (years · title · description over two · services · clients) lines up under it (the homepage role rows under the work cards). Below `md`, rows stack to 1 column (the work cards go 2-up at `sm`).

Case study modules sit on the 3-column grid at `md` and up (`md:grid-cols-3 gap-x-gutter`), the Figma's 3 × 390. The case hero uses 4 columns with a 2-column center (index · title and image · stats).

**Containers.** `max-w-wide` (1280) for layout, anything with horizontal structure. `max-w-prose` (672) for continuous text. `max-w-hero` (768) for the homepage headline only. Grids never go inside `max-w-prose` (see CLAUDE.md, two-container rule).

**Line.** One line weight (`--line-weight`, 1px) in `border` for every rule, divider and outline, and for line drawings like the globe. The `rule` class draws the Figma divider.

**When the kit is silent.** Use the next step on the 9px rhythm and name the job. If two spaces feel different but share a job, they're the same token.
