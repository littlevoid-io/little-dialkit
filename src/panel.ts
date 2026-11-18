import {
  createDialKit, type DialConfig, type DialKitController, DialStore,
  mountFolder, mountPresetManager, mountShortcutListener, type PresetManagerProps,
} from 'dialkit/vanilla';
import { ControlTree } from './controlTree';
import { element } from './dom';
import { FloatingShell } from './floatingShell';
import { FolderState } from './folderState';
import { HistoryButtons } from './historyButtons';
import type { PanelOptions } from './panelOptions';
import { Undo } from './undo';

/** A DialKit panel, docked or floating, with curve rows, undo and folders that stay open or closed across reloads. */
export class Panel<Config extends DialConfig> {
  /** DialKit's controller: values, subscriptions and versions. */
  public readonly kit: DialKitController<Config>;
  public readonly history: Undo;
  private readonly root = element('div', 'dialkit-root little-dialkit');
  private readonly shortcuts = mountShortcutListener();
  private readonly floating: FloatingShell | undefined;
  private readonly shell: ReturnType<typeof mountFolder>;
  private readonly versions: ReturnType<typeof mountPresetManager>;
  private readonly tree: ControlTree;
  private readonly buttons: HistoryButtons;
  private readonly stop: () => void;

  /** The controls are built once: the config's structure is fixed for the life of the panel. */
  constructor(name: string, config: Config, options: PanelOptions) {
    const { id, theme = 'system' } = options;
    this.kit = createDialKit(name, config, options);
    this.root.dataset.theme = theme;
    (options.target ?? document.body).append(this.root);
    this.floating = options.mode === 'popover' ? new FloatingShell(this.root, this.kit, name, options) : undefined;
    this.shell = this.floating?.folder ?? mountFolder(this.root, { title: name, isRoot: true, inline: true });
    const toolbar = element('div', 'little-toolbar');
    this.shell.toolbar.append(toolbar);
    this.versions = mountPresetManager(toolbar, this.versionProps());
    this.tree = new ControlTree(id, new FolderState(`little-dialkit:${id}:folders`), this.controls(), this.shell.body);
    this.history = new Undo(id, `little-dialkit:${id}:history`);
    this.buttons = new HistoryButtons(toolbar, this.history);
    this.stop = DialStore.subscribe(id, () => this.render());
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

  private versionProps(): PresetManagerProps {
    const { id } = this.kit;
    return { panelId: id, presets: DialStore.getPresets(id), activePresetId: DialStore.getActivePresetId(id) };
  }

  private render(): void {
    this.floating?.update();
    this.tree.update();
    this.versions.update(this.versionProps());
  }
}
