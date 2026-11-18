# little-dialkit

Additions to [DialKit](https://github.com/joshpuckett/dialkit) panels in plain TypeScript:

- Mapping curves: a slider whose position maps to its value through a selectable easing curve
- Undo / redo of value changes, with buttons in the panel
- Folders that stay open or closed across reloads
- A docked or floating panel built from DialKit's own controls, store, versions and persistence
- Versions as plain data, to save to a file or send to a server

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

- Docked is the default: `target` is required and the panel is always open. `mode: 'popover'` floats the panel instead (see below).
- The config is a DialKit config. `curve([default, min, max, step?], name?)` stands in for a slider.
- `panel.kit` is DialKit's controller: `getValues`, `setValues`, `subscribe`, `resetValues`.
- `panel.history.undo()` and `panel.history.redo()`; `canUndo` and `canRedo` tell whether a step is left, `subscribe(listener)` reports changes; Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y (Cmd on macOS).
- `versions: 'menu'` shows the versions as a menu. The default is DialKit's thumbnail gallery: double-click a name to rename.
- `panel.destroy()` removes the panel and its listeners.
- Curves: `linear`, and `quad`, `cubic`, `quart`, `quint` as `In`, `Out`, `InOut`, `OutIn` (for example `quartOutIn`).

## Floating panel

```ts
new Panel('Scene', config, { id: 'scene', mode: 'popover', position: 'bottom-left', persist: true });
```

- Options follow DialKit's `createDialRoot`: `position` (corner, default `top-right`), `defaultOpen`, `onOpenChange`. `target` defaults to `document.body`.
- Drag the header to move the panel; a click on the header collapses it to an icon. Opening the icon snaps the panel to the nearest corner.
- Position and open state are stored in `little-dialkit:<id>:shell` and win over `position` and `defaultOpen`.
- `panel.kit.setOpen(open)` and `panel.kit.getOpen()` open and close it.

## Versions as data

```ts
const data = panel.exportVersions(); // { base, versions, active }
panel.importVersions(data);           // replaces all versions
```

- Values are keyed by control path. Values of controls the panel does not have are ignored on import.
- Export keeps pending edits in the selected version, as leaving it in the panel does.
- An import is one undo step for the visible values. The versions themselves are not undone.
- Thumbnails are not included.

Where the data goes is up to the project. A Vite dev-server route that writes it to a file:

```ts
// vite.config.ts
import { writeFileSync } from 'node:fs';
import { json } from 'node:stream/consumers';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'save-versions',
    configureServer(server) {
      server.middlewares.use('/api/versions', async (request, response) => {
        writeFileSync('src/versions.json', JSON.stringify(await json(request), null, 2));
        response.end();
      });
    },
  }],
});
```

```ts
import saved from './versions.json';

panel.importVersions(saved);
await fetch('/api/versions', { method: 'POST', body: JSON.stringify(panel.exportVersions()) });
```

The route accepts any request that reaches the dev server. Keep the server on localhost, or check the request before writing.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Demo page: floating; `?docked` docks it, `?menu` shows the versions menu, `?position=<corner>` picks the corner |
| `npm run check` | Type check |
| `npm test` | Unit tests |
| `npm run build` | `dist/` with JS, types and `styles.css` |
| `npm run release` | Prompt for the version, then commit, tag, push, publish to npm and create the GitHub release |

## Troubleshooting

- **Panel renders twice:** do not call DialKit's `createDialRoot` on the same page. `Panel` is the root.
- **Controls do not appear after `kit.updateConfig`:** the panel builds its controls once. Create a new `Panel` for a different structure.
- **`position` has no effect:** a stored position wins. Delete `little-dialkit:<id>:shell` from localStorage.
- **Release stops at npm:** run `npm login` first.
- **GitHub release opens in the browser:** set `GITHUB_TOKEN` (for example from `gh auth token`) to create it without the browser.
- **Unstyled panel:** import both stylesheets, DialKit's first.

See [AGENTS.md](AGENTS.md) for architecture and conventions.
