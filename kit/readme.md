# gregfrye.us kit

The single source of truth for how the site looks and behaves. People browse it at `/kit` (hidden on production); agents read this folder before they build.

## Files

| File | What it holds |
|---|---|
| `visual-system.json` | Every token: primitives, semantic color, layout, type roles, motion, line. **Edit tokens here only.** |
| `../app/tokens.css` | Generated from the JSON by `npm run tokens:build` (also runs before `dev` and `build`). Never hand-edit. |
| `type.md` | Type roles and when to use each |
| `color.md` | Each color → what it means → where it applies |
| `layout.md` | Breakpoints, the 9px rhythm, containers |
| `motion.md` | Easing and duration, reduced motion |
| `../CLAUDE.md` | Repo conventions, content model, copy tone (the voice file) |

## Creative input

References live on Greg's private Are.na channel **Frye** (link on the Frye Creative™ page in Notion). Borrow systems from references, not looks: the first pin, Infinite Garden, informed the role-based type and the purpose-named motion here.

## Read first, by job

- **Copy or a new case study** → `../CLAUDE.md` (Content, Copy tone) → `type.md`
- **A layout or a new module** → `layout.md` → `type.md` → `color.md`, then reuse what's in `app/components/`
- **Anything that moves** → `motion.md`
- **Anything with the globe or a line drawing** → `color.md` (ink) + the `line` token in the JSON
- **A new token** → add it to `visual-system.json` with its `job`, regenerate, then say why in the matching `.md` file. Prefer a reusable treatment (one date style, one tag style) over a token for one element.

## Rules

- Components use tokens through Tailwind classes only (`type-body`, `text-ink`, `gap-block`, `ease-editorial motion-normal`). A raw hex, px or ms value in a component is a bug; `npm run qa` flags it.
- One component keeps its structure, behavior and look at every size. A breakpoint may simplify it when there's no room; say how in the component.
- Figma's **Components** page is the style guide in the making: one *Style Guide* frame (00 Read me · 01 Color · 02 Type · 03 Space & line · 04 Motion · 05 Components · 06 Modules · 07 Open questions) built from the kit's own variables, `Role/*` styles and components. Its notes mirror these why-files: when a rule changes here, change it there in the same session (or at the Friday sync). Answered open questions move into their section.
- Figma mirrors the JSON. `npm run tokens` prints tokens resolved for Figma; `npm run tokens:check` compares them with `design/figma-variables.json`. Code wins for anything shipped.
- Greg approves anything that changes the look. Agents may propose kit changes.
