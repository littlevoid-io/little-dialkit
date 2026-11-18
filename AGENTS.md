# little-dialkit

Library that adds mapping curves, undo and persisted folder state to DialKit (`dialkit/vanilla`). Setup and commands: [README.md](README.md).

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
- **Fixed structure:** controls are built once from the panel's control tree. `updateConfig` with a different structure is not reflected.

## Code map

| File | Role |
|---|---|
| `src/panel.ts` | `Panel`: kit, root element, shell folder, versions menu, tree, undo |
| `src/controlTree.ts` | Walks DialKit's `ControlMeta` tree: folders, curve rows, native controls via `mountControlRenderer` |
| `src/curveConfig.ts` | `curve()` config helper, `isCurve` |
| `src/curveModel.ts` | Store access and position for one curve parameter |
| `src/curveSlider.ts` | Own slider: pointer, keyboard, typed value |
| `src/curvePicker.ts` | Curve button and popover grid (families across, variants down, linear in the corner) |
| `src/curves.ts` | Curve table, `evaluate`, `invert` |
| `src/folderState.ts` | Folder open state by control path |
| `src/undo.ts`, `src/history.ts` | Undo binding and history store |
| `src/styles.css` | Styles for own elements only |
| `demo/main.ts`, `index.html` | Demo page for `npm run dev` |

## Storage

| Key | Storage | Holds |
|---|---|---|
| `dialkit:<id>` | localStorage (DialKit, with `persist`) | Values and versions |
| `little-dialkit:<id>:folders` | localStorage | `{ [folderPath]: open }` |
| `little-dialkit:<id>:history` | sessionStorage | Undo and redo steps |

## Build

- `vite build` in library mode writes `dist/index.js`; `tsc -p tsconfig.build.json` writes the types; `styles.css` is copied as is.
- zundo imports `createStore` from the zustand root, which loads the React bindings. The build aliases `zustand` to `zustand/vanilla` and bundles zundo, so consumers need no alias. zundo is a dev dependency for that reason.
- `dialkit` is a peer dependency. `zustand` and `es-toolkit` are dependencies and stay external.

## Verification

- Unit tests cover `curves.ts` and `history.ts`. There are no DOM tests.
- Check UI changes on the demo page. Automated drag-and-drop helpers do not send `pointermove` / `pointerup` to the slider; dispatch pointer events or drag by hand.

## Not built yet

- Preset stores beyond DialKit's own storage: file export / import, writing defaults through a dev-server helper
- Floating, draggable panel shell (the panel is docked into `target`)
- Undo / redo buttons in the panel
