import {
  createDialKit, type DialConfig, type DialKitController, DialStore,
  mountFolder, mountShortcutListener,
} from 'dialkit/vanilla';
import { ControlTree } from './controlTree';
import { element } from './dom';
import { Edits } from './edits';
import { FloatingShell } from './floatingShell';
import { FolderState } from './folderState';
import { HistoryButtons } from './historyButtons';
import type { PanelOptions } from './panelOptions';
import { Spread } from './spread';
import { Undo } from './undo';
import { exportVersions, importVersions, type VersionData } from './versionData';
import { VersionMenu } from './versionMenu';

/** A DialKit panel, docked or floating, with curve rows, undo, a versions menu, reset and apply-to-all-versions buttons on the controls and folders that stay open or closed across reloads. */
export class Panel<Config extends DialConfig> {
  /** DialKit's controller: values, subscriptions and versions. */
  public readonly kit: DialKitController<Config>;
  public readonly history: Undo;
  /** The versions menu: the versions, the selected one, selecting with the prompt for unsaved edits. */
  public readonly versions: VersionMenu;
  /** Above the controls: for rows of the page's own, such as DialKit's `mountSlider`. Not part of values, versions or undo. */
  public readonly slot = element('div', 'little-slot');
  private readonly root = element('div', 'dialkit-root little-dialkit');
  private readonly shortcuts = mountShortcutListener();
  private readonly floating: FloatingShell | undefined;
  private readonly shell: ReturnType<typeof mountFolder>;
  private readonly edits: Edits;
  private readonly tree: ControlTree;
  private readonly buttons: HistoryButtons;
  private readonly stop: () => void;

  /** The controls are built once: the config's structure is fixed for the life of the panel. */
  constructor(name: string, config: Config, options: PanelOptions) {
    const { id, theme = 'system', labels = {} } = options;
    this.kit = createDialKit(name, config, options);
    this.root.dataset.theme = theme;
    (options.target ?? document.body).append(this.root);
    this.floating = options.mode === 'popover' ? new FloatingShell(this.root, this.kit, name, options) : undefined;
    this.shell = this.floating?.folder ?? mountFolder(this.root, { title: name, isRoot: true, inline: true });
    const toolbar = element('div', 'little-toolbar');
    this.shell.toolbar.append(toolbar);
    const folders = new FolderState(`little-dialkit:${id}:folders`);
    this.edits = new Edits(id);
    this.history = new Undo(id, `little-dialkit:${id}:undo`, this.edits);
    this.versions = new VersionMenu(id, this.root, toolbar, this.edits, this.history);
    this.shell.body.append(this.slot);
    this.tree = new ControlTree(id, folders, this.edits, new Spread(id, this.edits, this.history), labels, this.controls(), this.shell.body);
    this.buttons = new HistoryButtons(toolbar, this.history);
    this.stop = DialStore.subscribe(id, () => this.render());
  }

  /** All versions as plain data, for a file or a request body. Edits on the selected version become part of it. */
  public exportVersions(): VersionData {
    return this.history.suspend(() => exportVersions(this.kit.id));
  }

  /** Replaces all versions. The change is one undo step of the visible values; the versions themselves are not undone. */
  public importVersions(data: VersionData): void {
    this.history.suspend(() => importVersions(this.kit.id, data));
  }

  public destroy(): void {
    this.stop();
    this.buttons.destroy();
    this.history.destroy();
    this.tree.destroy();
    this.versions.destroy();
    this.floating?.destroy();
    this.shell.destroy();
    this.shortcuts.destroy();
    this.root.remove();
    this.kit.destroy();
  }

  private controls() {
    const panel = DialStore.getPanel(this.kit.id);
    if (!panel) throw new Error(`Panel "${this.kit.id}" is not registered`);
    return panel.controls;
  }

  private render(): void {
    this.edits.update();
    this.floating?.update();
    this.tree.update();
    this.versions.update();
  }
}
