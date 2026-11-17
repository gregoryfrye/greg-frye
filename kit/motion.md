# Motion

**Why.** Motion is small and purposeful: it shows something arriving, leaving or changing state. Four easings and three durations cover the site; add more only when a new purpose appears.

| Easing | Class | Job |
|---|---|---|
| standard | `ease-standard` | Default for state changes |
| enter | `ease-enter` | Things arriving |
| exit | `ease-exit` | Things leaving |
| editorial | `ease-editorial` | Image and text reveals |

| Duration | Class | Job |
|---|---|---|
| fast · 120ms | `motion-fast` | Hover, focus, small UI |
| normal · 240ms | `motion-normal` | Menus, index highlight, leaving |
| slow · 800ms | `motion-slow` | Reveals |

**How.** Name the property, then pair a duration with an easing: `transition-colors motion-fast ease-standard`. Never `transition-all` (QA flags it).

**Reduced motion.** `app/globals.css` cuts every animation and transition to near zero when the reader asks for reduced motion. Nothing may depend on motion to be understood.

**When the kit is silent.** Use `motion-fast ease-standard`. If it needs to be noticed, it's probably a reveal: `motion-slow ease-editorial`.
