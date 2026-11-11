# Color

**Why.** Color shows association: every color points at what it belongs to, and color never carries meaning alone (a label or letter always does too). The palette stays small: black ink on white, or on the homepage's brown field.

| Token | Value | Means | Where |
|---|---|---|---|
| `canvas` | white | The reading surface | Case studies and inner pages |
| `canvas-home` | field `#998060` | Home | Homepage background, nav included |
| `ink` | black | Primary | Text, rules, focus ring, line drawings |
| `muted` | black 60% | Secondary | Supporting text on canvas |
| `muted-home` | black 85% | Secondary on the field | Swapped in automatically on the homepage (60% is only 3.3:1 there) |
| `faint` | black 25% | Inactive | Inactive chapter-index items, as drawn in Figma |
| `border` | black | Structure | Rules and outlines |
| `placeholder` | black 6% | Not loaded yet | Image boxes while loading, placeholder slots |

**Open: `faint` fails contrast.** 25% black on white is about 1.9:1, under the 4.5:1 AA minimum for text. It matches Figma for now; the Visual Design Pass decides whether inactive items move up to `muted` or the index works another way.

**Primitives** (white, black, field, black at 85/60/25/6) live in `visual-system.json` and are never used directly by components.

**When the kit is silent.** Use ink. Add a color only when it marks a new kind of thing (a status, a world), name it by that job, and write its row here.
