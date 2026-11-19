# little-dialkit

Library that adds mapping curves, undo, a versions menu with edit tracking, persisted folder state and a floating shell to DialKit (`dialkit/vanilla`). Setup and commands: [README.md](README.md).

## Rules

- Use only what `dialkit/vanilla` exports and types. No private members, no DialKit DOM structure or class names.
- Lean on DialKit's features (store, versions, persistence, shortcuts, controls) instead of rebuilding them. Exception: the versions UI is own (`VersionMenu`), because DialKit's gallery and menu select versions themselves and so merge edits without asking.
- DialKit's `--dial-*` CSS variables are undocumented. Read them only in the `.little-dialkit` block of `src/styles.css`, each with a fallback.
- Own classes and storage keys are prefixed `little-`.

## Concepts

- **Custom layout:** `Panel` does not use DialKit's `createDialRoot`. It mounts DialKit's exported controls into its own `.dialkit-root` element. DialKit's generated panel has no slot for extra elements on a control row.
- **Curve parameter:** `curve([default, min, max, step], name)` returns a DialKit folder `{ value: slider, curve: select }`. Values and versions therefore hold `{ value, curve }` with the value in value units. `isCurve` recognises that pair in the control tree and `ControlTree` mounts a `CurveRow` in place of the folder.
- **Position vs value:** `value = min + curve(position) * (max - min)`. The store clamps and snaps the value to the step. `CurveModel` keeps a dragged position while the store still holds the value it produced, and inverts the curve otherwise (version load, typed value, curve change, undo).
- **Curves:** all rise from 0 to 1, so `invert` is a bisection. Adding a curve that is not monotonic needs a different inverse.
- **Undo:** `Undo` records the store's flat values (actions removed) on every store change into `EditHistory` (zustand + zundo). Changes within 400 ms form one step. Restoring writes through `DialStore.updateValues`. A version switch is recorded as a step like any other change.
- **Toolbar row:** the undo / redo buttons and the version button share an own `.little-toolbar` flex element inside DialKit's shell toolbar, so no DialKit class is restyled. The buttons follow `Undo.subscribe` (zundo's temporal store), which covers changes, undo, redo and steps restored from sessionStorage.
- **Floating shell:** `mode: 'popover'` (DialKit's name; docked is the default so existing `target` setups keep working). DialKit's non-inline root folder is the shell and provides size, look, scrolling (max height, `overflow-y`) and the collapse to an icon through `open`, `onOpenChange`. Open state lives in `DialStore` (`kit.getOpen` / `kit.setOpen`), so outside callers and the folder's own toggle meet there. Own code covers what DialKit does not export: corner placement and margin (`.little-floating`, `data-position`), the header drag, clamping, persistence.
- **Drag model (mirrors DialKit's panel):** a press travelling 8 px drags; the panel keeps the dropped position (no snap on release); collapsing keeps the position; opening from the icon snaps to the corner nearest the icon's center. DialKit's header class is not used: a press starts a drag when it lies on the folder's `element` but not in `body` or `toolbar` (any point when collapsed). Pointer capture starts only after the threshold, so a plain click still reaches the header. The click that ends a drag is blocked. Differences: the whole panel is kept inside the viewport with an 8 px edge (DialKit keeps 42 px grabbable), no Escape to cancel, no memory of the last dragged position for the icon.
- **Versions:** DialKit's store holds them; the UI is `VersionMenu`: a button in the toolbar row (selected name, `*` with edits) and a popover (`popover="auto"`, appended to the root so it can show while the shell is collapsed) with a row per version and **Save as new version** (`VersionMenu.add`: `saveNewVersion` names it after the selected version with the next free `-vNN`, `nextName` in `versions.ts`; then the name field, the menu opening for it when the call comes from outside). Rows are built on `beforetoggle` and removed on close; while open, the menu redraws only when what it shows changes (`shown`), so a name field survives store changes. The base version (`id` null) cannot be deleted. Delete needs a second click.
- **Edits:** DialKit keeps edits apart from the selected version (`DialStore.hasEdits`) and merges them when the version is left (`loadPreset`, `clearActivePreset`) or on `keepEdits`. `Edits` compares the visible values with what the version holds: `Preset.values` for a saved version, an own copy for the base (private in DialKit), taken whenever the base is selected without edits. A page that starts on an edited base reads it once through a temporary version (`heldBase`), before `Undo` exists. `Panel.render` calls `Edits.update` first; rows, folders and the menu read from it.
- **Explicit merge:** `VersionMenu.select` asks (Save / Discard / Cancel) before leaving an edited version; Discard writes the held values back, then selects, as one undo step. `DialStore.loadPreset` called directly still merges silently: hosts select through `panel.versions.select`. `exportVersions` merges too (a save).
- **Row buttons:** a control's row (`.little-row`) is the control, the curve button at full size (curve rows), then `RowButtons`: reset above apply to all versions (`.little-row-buttons`, a column as tall as the row, half a button wide). Both are always there; a disabled one is muted (`.little-button:disabled`). `NativeControl` wraps DialKit's renderer in such a row (actions hold no value: no buttons); `CurveRow` covers value and curve.
- **Reset buttons:** `ResetButton` is enabled while the control differs. `ControlFolder` marks its title with `*`.
- **Accent:** `--little-accent` (`.little-dialkit` in `styles.css`, own value, overridable by the host) colors what differs from the usual: an enabled reset button, the curve button of a curve other than linear. DialKit's own controls and folder titles are not restyled.
- **Action row:** `actionRow(actions)` returns a row of icon buttons sharing the panel's width (label as tooltip, icon as stroked paths in a 24 x 24 box), for `Panel.slot`.
- **Apply to all versions:** `ApplyButton` arms on the first click and applies on the second (leaving it disarms); disabled while the base is the only version. `Spread.apply` → `applyToVersions`: the visible values at the control's path and below go into every version (select, `updateValues`, `keepEdits` per version), the selected one first. It is set to what it holds before that, so only the applied values are merged into it, and gets its other edits back after: an applied edit is no longer an edit, the rest stay edits. Runs in `Undo.suspend`; the visible values end as they were, so there is no undo step and no way to undo it.
- **Version data:** `exportVersions` / `importVersions` move versions as plain data through documented `DialStore` calls. The base version's values are readable only while it is selected, so export selects the base and reselects the version; that keeps pending edits in the version. Import deletes all versions, writes the base, then per version writes the values and calls `savePreset`. DialKit generates version ids, so `active` is a name. `Panel` wraps both in `Undo.suspend` so the switching is not recorded; an import is one undo step of the visible values. Transport (download, request, dev-server route) is the consumer's.
- **Labels:** DialKit has no label option for controls; it derives labels from keys. `labels` (by control path) replaces `ControlMeta.label` on the copy `ControlTree` hands to the folder, curve row or DialKit's renderer. Action labels are DialKit's own (`ActionConfig.label`).
- **Slot:** `Panel.slot` (`.little-slot`, `display: contents`) sits in the shell body above the controls. Its children are the consumer's and lay out as panel rows.
- **Element count:** `ControlFolder` builds its controls when the folder is first opened (capture-phase `click` / `keydown` on the folder, ahead of DialKit's handler that measures the content for the animation), `CurvePicker` and `VersionMenu` fill their menus on `beforetoggle` and empty them on close. Controls of a folder stay once built.
- **Fixed structure:** controls are built once from the panel's control tree. `updateConfig` with a different structure is not reflected.

## Code map

| File | Role |
|---|---|
| `src/panel.ts` | `Panel`: kit, root element, shell folder (docked or `FloatingShell`), toolbar row, edits, versions menu, tree, undo, version export / import |
| `src/panelOptions.ts` | `PanelOptions`: `DockedOptions` or `FloatingOptions`, typed from DialKit's `DialRootOptions` |
| `src/floatingShell.ts` | Floating shell: corner / dragged position, open sync with `DialStore`, persistence, keep inside viewport |
| `src/panelDrag.ts` | Pointer gesture: threshold, capture, click blocking after a drag |
| `src/placement.ts` | Pure clamping and nearest-corner maths |
| `src/shellState.ts` | Persisted open state, corner and offset |
| `src/controlTree.ts` | Walks DialKit's `ControlMeta` tree: folders, curve rows, native controls |
| `src/controlFolder.ts` | Folder: kept open state, lazy content, edit mark |
| `src/nativeControl.ts` | DialKit control via `mountControlRenderer`, in a row with its buttons |
| `src/edits.ts` | `Edits`: which values differ from the selected version, reset |
| `src/rowButtons.ts` | Reset and apply buttons of a control row, stacked |
| `src/actionRow.ts` | `actionRow`: row of icon buttons for the slot |
| `src/resetButton.ts` | Reset button of a control row |
| `src/applyButton.ts` | Apply-to-all-versions button of a control row |
| `src/spread.ts` | `applyToVersions` on `DialStore`; `Spread`: per panel, with edits and undo |
| `src/curveConfig.ts` | `curve()` config helper, `isCurve` |
| `src/curveModel.ts` | Store access and position for one curve parameter |
| `src/curveSlider.ts` | Own slider: pointer, keyboard, typed value |
| `src/curvePicker.ts` | Curve button and popover grid (families across, variants down, linear in the corner) |
| `src/curves.ts` | Curve table, `evaluate`, `invert` |
| `src/folderState.ts` | Folder open state by control path |
| `src/undo.ts`, `src/history.ts` | Undo binding and history store; `canUndo`, `canRedo`, `subscribe` expose availability; `suspend` runs changes that are not steps |
| `src/versions.ts` | `listVersions`, `activeVersion`, `selectVersion` on `DialStore` |
| `src/versionMenu.ts`, `src/versionRow.ts`, `src/versionPrompt.ts` | Versions button and menu; one menu row; the save / discard prompt |
| `src/icon.ts` | Icon paths, `icon`, `iconButton` |
| `src/versionData.ts` | `exportVersions`, `importVersions` on `DialStore` |
| `src/values.ts` | `Values` type, `withoutActions` |
| `src/historyButtons.ts` | Undo / redo buttons, disabled by availability |
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

- `npm run release` runs release-it with `.release-it.js`: type check and tests, version prompt, build, commit `chore: release v<version>`, tag `v<version>`, push, `npm publish`, GitHub release with the commit list as notes.
- Requires branch `main`, a clean working tree, an upstream, `npm login` and `gh auth login`.
- `.release-it.js` sets `GITHUB_TOKEN` from `gh auth token` when it is unset, so release-it creates the GitHub release through the API. A `GITHUB_TOKEN` already in the environment wins.
- `npm run release -- --no-increment` releases the version in `package.json` as is (first release: 0.1.0). `--dry-run` shows the steps without changes.

## Verification

- Unit tests cover `curves.ts`, `history.ts` (including availability and subscriptions) `placement.ts`, `versionData.ts`, `edits.ts` and `spread.ts` (the last three against DialKit's real store). There are no DOM tests.
- Check UI changes on the demo page (`?docked`, `?position=<corner>`). Automated drag-and-drop helpers do not send `pointermove` / `pointerup` to the slider or the shell; dispatch pointer events or drag by hand.

## Not built yet

- A dev-server helper for writing versions to a file. The README shows a Vite middleware instead.
- Duplicating a version that is not selected (DialKit saves a new version from the visible values only).
- DialKit's thumbnail gallery is no longer mounted; thumbnails it stored earlier stay in `dialkit:<id>:thumbnails` until deleted by hand.
