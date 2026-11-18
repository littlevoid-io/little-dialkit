# little-dialkit

Additions to [DialKit](https://github.com/joshpuckett/dialkit) panels in plain TypeScript:

- Mapping curves: a slider whose position maps to its value through a selectable easing curve
- Undo / redo of value changes
- Folders that stay open or closed across reloads
- A docked panel built from DialKit's own controls, store, versions and persistence

## Setup

```sh
npm install little-dialkit dialkit
```

```ts
import 'dialkit/vanilla/styles.css';
import 'little-dialkit/styles.css';
import { curve, Panel } from 'little-dialkit';

const panel = new Panel('Scene', {
  blur: {
    radius: curve([12, 0, 100, 0.01], 'cubicIn'),
    samples: [16, 1, 64, 1],
  },
  tint: '#ff8800',
}, { id: 'scene', target: document.querySelector('#panel'), persist: true });

panel.kit.subscribe((values) => {
  values.blur.radius.value; // 12, in value units
  values.blur.radius.curve; // 'cubicIn'
});
```

- The config is a DialKit config. `curve([default, min, max, step?], name?)` stands in for a slider.
- `panel.kit` is DialKit's controller: `getValues`, `setValues`, `subscribe`, `resetValues`.
- `panel.history.undo()` and `panel.history.redo()`; Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y (Cmd on macOS).
- `panel.destroy()` removes the panel and its listeners.
- Curves: `linear`, and `quad`, `cubic`, `quart`, `quint` as `In`, `Out`, `InOut`, `OutIn` (for example `quartOutIn`).

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Demo page |
| `npm run check` | Type check |
| `npm test` | Unit tests |
| `npm run build` | `dist/` with JS, types and `styles.css` |

## Troubleshooting

- **Panel renders twice:** do not call DialKit's `createDialRoot` on the same page. `Panel` is the root.
- **Controls do not appear after `kit.updateConfig`:** the panel builds its controls once. Create a new `Panel` for a different structure.
- **Unstyled panel:** import both stylesheets, DialKit's first.

See [AGENTS.md](AGENTS.md) for architecture and conventions.
