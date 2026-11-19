# little-dialkit

Additions to [DialKit](https://github.com/joshpuckett/dialkit) panels in plain TypeScript:

- Mapping curves: a slider whose position maps to its value through a selectable easing curve
- Undo / redo of value changes and version switches, with buttons in the panel
- Folders that stay open or closed across reloads
- A docked or floating panel built from DialKit's own controls, store, versions and persistence
- A versions menu: select, rename, delete, drag to sort, save as new; edits are marked and become part of a version only when saved
- A reset button on every control, enabled while it differs from the selected version
- An apply-to-all-versions button on every control: after a confirm in the versions menu, writes its live value (a curve slider: value and curve) into every version, whatever they hold. Other edits on the selected version stay edits. Not an undo step. `panel.spread.ask(path)` does the same from code, `apply(path)` without asking; `panel.spread.onApply` is called with the versions after it (for example to write them to a file)
- `--little-accent`: color of what is changed (enabled reset buttons, curves other than linear); set it on `.little-dialkit` to change it
- `actionRow([{ label, icon, run }])`: a row of icon buttons for `panel.slot`
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
- `panel.history.undo()` and `panel.history.redo()`; `canUndo` and `canRedo` tell whether a step is left, `subscribe(listener)` reports changes. A step holds the values and the selected version: undo after a version switch selects the version left.
- A row of buttons under the toolbar: save, save as new version, reset (as the keys below) and export (downloads all versions as `<id>-versions.json`). `actions: { export: false }` in the options leaves a button out. `panel.actions.save()`, `saveAs()`, `reset()` and `export()` do the same from code.
- Keys (Cmd for Ctrl on macOS; not while a text field has the focus):

  | Key | Action |
  |---|---|
  | `Ctrl+S` | Save the edits into the selected version, then call `panel.actions.onSave` (for example to write the versions to a file) |
  | `Ctrl+Shift+S` | Save as a new version (calls `panel.versions.onAdd`) |
  | `[` / `]` | Select the previous / next version; wraps at the ends |
  | `Escape` | Reset: discard the edits on the selected version, after a confirm dialog. `panel.actions.onReset` takes its place when set |
  | `Ctrl+Z` / `Ctrl+Shift+Z` or `Ctrl+Y` | Undo / redo |

- The button next to undo / redo names the selected version, with `*` while it has edits, and opens the versions menu. Folders with edited controls carry the same mark.
- Edits stay apart from the version until saved (check mark in the menu) or discarded. Selecting another version asks to save or discard them first.
- `panel.versions`: `entries`, `active`, `edited`, `select(entry)` (asks like the menu), `save()`, `discard()`, `add()` (saves a new version named after the selected one, `name` -> `name-v02` -> `name-v03`, and opens the menu on its name field), `rename(entry, name)`, `remove(entry)`, `onAdd` (set it to be called when a new version was saved, by `add()` or the menu, and again when its name is changed in the field that opens; for example to write the versions to a file), `move(id, target, after)` (puts a saved version before or after another one; the menu does it on drag and drop).
- Saved versions are dragged in the menu to sort them; the base version stays first. A reorder gives the saved versions new ids.
- `labels: { 'blur.radius': 'Radius (px)' }` sets labels by control path; DialKit derives the others from the keys.
- `panel.slot` is an element above the controls for rows of your own (for example DialKit's `mountSlider`); they are not part of values, versions or undo.
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
- Export saves pending edits into the selected version.
- An import is one undo step for the visible values. The versions themselves are not undone.

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
| `npm run dev` | Demo page: floating; `?docked` docks it, `?position=<corner>` picks the corner |
| `npm run check` | Type check |
| `npm test` | Unit tests |
| `npm run build` | `dist/` with JS, types and `styles.css` |
| `npm run release` | Prompt for the version, then commit, tag, push, publish to npm and create the GitHub release |

## Troubleshooting

- **Panel renders twice:** do not call DialKit's `createDialRoot` on the same page. `Panel` is the root.
- **Controls do not appear after `kit.updateConfig`:** the panel builds its controls once. Create a new `Panel` for a different structure.
- **`position` has no effect:** a stored position wins. Delete `little-dialkit:<id>:shell` from localStorage.
- **Release stops at npm:** run `npm login` first.
- **Release fails with `Invalid configuration file at .release-it`:** run `gh auth login`, or set `GITHUB_TOKEN`.
- **Unstyled panel:** import both stylesheets, DialKit's first.

See [AGENTS.md](AGENTS.md) for architecture and conventions.
