# little-dialkit

Library that adds mapping curves, undo, persisted folder state and a floating shell to DialKit (`dialkit/vanilla`). Setup and commands: [README.md](README.md).

## Rules

- Use only what `dialkit/vanilla` exports and types. No private members, no DialKit DOM structure or class names.
- Lean on DialKit's features (store, versions, persistence, shortcuts, controls) instead of rebuilding them.
- DialKit's `--dial-*` CSS variables are undocumented. Read them only in the `.little-dialkit` block of `src/styles.css`, each with a fallback.
- Own classes and storage keys are prefixed `little-`.

## Concepts

- **Custom layout:** `Panel` does not use DialKit's `createDialRoot`. It mounts DialKit's exported controls into its own `.dialkit-root` element. DialKit's generated panel has no slot for extra elements on a control row.
- **Curve parameter:** `curve([default, min, max, step], name)` returns a DialKit folder `{ value: slider, curve: select }`. Values and versions therefore hold `{ value, curve }` with the value in value units. `isCurve` recognises that pair in the control tree and `ControlTree` mounts a `CurveRow` in place of the folder.
- **Position vs value:** `value = min + curve(position) * (max - min)`. The store clamps and snaps the value to the step. `CurveModel` keeps a dragged position while the store still holds the value it produced, and inverts the curve otherwise (version load, typed value, curve change, undo).
- **Curves:** all rise from 0 to 1, so `invert` is a bisection. Adding a curve that is not monotonic needs a different inverse.
- **Undo:** `Undo` records the store's flat values (actions removed) on every store change into `EditHistory` (zustand + zundo). Changes within 400 ms form one step. Restoring writes through `DialStore.updateValues`. A version switch is recorded as a step like any other change.
- **Toolbar row:** the undo / redo buttons (and the versions menu, with `versions: 'menu'`) share an own `.little-toolbar` flex element inside DialKit's shell toolbar, so no DialKit class is restyled. The buttons follow `Undo.subscribe` (zundo's temporal store), which covers changes, undo, redo and steps restored from sessionStorage.
- **Floating shell:** `mode: 'popover'` (DialKit's name; docked is the default so existing `target` setups keep working). DialKit's non-inline root folder is the shell and provides size, look, scrolling (max height, `overflow-y`) and the collapse to an icon through `open`, `onOpenChange`. Open state lives in `DialStore` (`kit.getOpen` / `kit.setOpen`), so outside callers and the folder's own toggle meet there. Own code covers what DialKit does not export: corner placement and margin (`.little-floating`, `data-position`), the header drag, clamping, persistence.
- **Drag model (mirrors DialKit's panel):** a press travelling 8 px drags; the panel keeps the dropped position (no snap on release); collapsing keeps the position; opening from the icon snaps to the corner nearest the icon's center. DialKit's header class is not used: a press starts a drag when it lies on the folder's `element` but not in `body` or `toolbar` (any point when collapsed). Pointer capture starts only after the threshold, so a plain click still reaches the header. The click that ends a drag is blocked. Differences: the whole panel is kept inside the viewport with an 8 px edge (DialKit keeps 42 px grabbable), no Escape to cancel, no memory of the last dragged position for the icon.
- **Versions:** `Versions` mounts DialKit's own UI: `mountVersionGallery` (default; rename by double click) into a DialKit folder (`mountFolder`) at the top of the shell body, titled `Version: <selected name>` and closed until opened; its open state is stored with the folders under `:versions`. With `versions: 'menu'`: `mountPresetManager` into the toolbar row. Nothing of it is rebuilt.
- **Version data:** `exportVersions` / `importVersions` move versions as plain data through documented `DialStore` calls. The base version's values are readable only while it is selected, so export selects the base and reselects the version; that keeps pending edits in the version. Import deletes all versions, writes the base, then per version writes the values and calls `savePreset`. DialKit generates version ids, so `active` is a name. `Panel` wraps both in `Undo.suspend` so the switching is not recorded; an import is one undo step of the visible values. Transport (download, request, dev-server route) is the consumer's.
- **Labels:** DialKit has no label option for controls; it derives labels from keys. `labels` (by control path) replaces `ControlMeta.label` on the copy `ControlTree` hands to the folder, curve row or DialKit's renderer. Action labels are DialKit's own (`ActionConfig.label`).
- **Slot:** `Panel.slot` (`.little-slot`, `display: contents`) sits in the shell body between the versions gallery and the controls. Its children are the consumer's and lay out as panel rows.
- **Fixed structure:** controls are built once from the panel's control tree. `updateConfig` with a different structure is not reflected.

## Code map

| File | Role |
|---|---|
| `src/panel.ts` | `Panel`: kit, root element, shell folder (docked or `FloatingShell`), toolbar row, versions, tree, undo, version export / import |
| `src/panelOptions.ts` | `PanelOptions`: `DockedOptions` or `FloatingOptions`, typed from DialKit's `DialRootOptions` |
| `src/floatingShell.ts` | Floating shell: corner / dragged position, open sync with `DialStore`, persistence, keep inside viewport |
| `src/panelDrag.ts` | Pointer gesture: threshold, capture, click blocking after a drag |
| `src/placement.ts` | Pure clamping and nearest-corner maths |
| `src/shellState.ts` | Persisted open state, corner and offset |
| `src/controlTree.ts` | Walks DialKit's `ControlMeta` tree: folders, curve rows, native controls via `mountControlRenderer` |
| `src/curveConfig.ts` | `curve()` config helper, `isCurve` |
| `src/curveModel.ts` | Store access and position for one curve parameter |
| `src/curveSlider.ts` | Own slider: pointer, keyboard, typed value |
| `src/curvePicker.ts` | Curve button and popover grid (families across, variants down, linear in the corner) |
| `src/curves.ts` | Curve table, `evaluate`, `invert` |
| `src/folderState.ts` | Folder open state by control path |
| `src/undo.ts`, `src/history.ts` | Undo binding and history store; `canUndo`, `canRedo`, `subscribe` expose availability; `suspend` runs changes that are not steps |
| `src/versions.ts` | DialKit's versions gallery or menu |
| `src/versionData.ts` | `exportVersions`, `importVersions` on `DialStore` |
| `src/values.ts` | `Values` type, `withoutActions` |
| `src/historyButtons.ts` | Undo / redo icon buttons, disabled by availability |
| `src/styles.css` | Styles for own elements only |
| `demo/main.ts`, `index.html` | Demo page for `npm run dev` |

## Storage

| Key | Storage | Holds |
|---|---|---|
| `dialkit:<id>` | localStorage (DialKit, with `persist`) | Values and versions |
| `little-dialkit:<id>:folders` | localStorage | `{ [folderPath]: open }` |
| `little-dialkit:<id>:shell` | localStorage | Floating mode: `{ open, corner, offset }`; `offset` is null at the corner |
| `little-dialkit:<id>:history` | sessionStorage | Undo and redo steps |

## Build

- `vite build` in library mode writes `dist/index.js`; `tsc -p tsconfig.build.json` writes the types; `styles.css` is copied as is.
- zundo imports `createStore` from the zustand root, which loads the React bindings. The build aliases `zustand` to `zustand/vanilla` and bundles zundo, so consumers need no alias. zundo is a dev dependency for that reason.
- `dialkit` is a peer dependency. `zustand` and `es-toolkit` are dependencies and stay external.

## Release

- `npm run release` runs release-it with `.release-it.json`: type check and tests, version prompt, build, commit `chore: release v<version>`, tag `v<version>`, push, `npm publish`, GitHub release with the commit list as notes.
- Requires branch `main`, a clean working tree, an upstream and `npm login`. Without `GITHUB_TOKEN` the GitHub release is a prefilled browser form.
- `npm run release -- --no-increment` releases the version in `package.json` as is (first release: 0.1.0). `--dry-run` shows the steps without changes.

## Verification

- Unit tests cover `curves.ts`, `history.ts` (including availability and subscriptions) `placement.ts` and `versionData.ts` (against DialKit's real store). There are no DOM tests.
- Check UI changes on the demo page (`?docked`, `?menu`, `?position=<corner>`). Automated drag-and-drop helpers do not send `pointermove` / `pointerup` to the slider or the shell; dispatch pointer events or drag by hand.

## Not built yet

- A dev-server helper for writing versions to a file. The README shows a Vite middleware instead.
- Version thumbnails are not part of exported data.
