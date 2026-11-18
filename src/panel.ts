import {
  createDialKit, type CreateDialOptions, type DialConfig, type DialKitController, DialStore, type DialTheme,
  mountFolder, mountPresetManager, mountShortcutListener, type PresetManagerProps,
} from 'dialkit/vanilla';
import { ControlTree } from './controlTree';
import { element } from './dom';
import { FolderState } from './folderState';
import { Undo } from './undo';

export interface PanelOptions extends CreateDialOptions {
  /** Names the panel in DialKit's store and in the storage keys. */
  id: string;
  /** The element the panel is docked into. */
  target: HTMLElement;
  theme?: DialTheme;
}

/** A docked DialKit panel with curve rows, undo and folders that stay open or closed across reloads. */
export class Panel<Config extends DialConfig> {
  /** DialKit's controller: values, subscriptions and versions. */
  public readonly kit: DialKitController<Config>;
  public readonly history: Undo;
  private readonly root = element('div', 'dialkit-root little-dialkit');
  private readonly shortcuts = mountShortcutListener();
  private readonly shell: ReturnType<typeof mountFolder>;
  private readonly versions: ReturnType<typeof mountPresetManager>;
  private readonly tree: ControlTree;
  private readonly stop: () => void;

  /** The controls are built once: the config's structure is fixed for the life of the panel. */
  constructor(name: string, config: Config, options: PanelOptions) {
    const { target, theme = 'system', ...dial } = options;
    const { id } = options;
    this.kit = createDialKit(name, config, dial);
    this.root.dataset.theme = theme;
    target.append(this.root);
    this.shell = mountFolder(this.root, { title: name, isRoot: true, inline: true });
    this.versions = mountPresetManager(this.shell.toolbar, this.versionProps());
    this.tree = new ControlTree(id, new FolderState(`little-dialkit:${id}:folders`), this.controls(), this.shell.body);
    this.history = new Undo(id, `little-dialkit:${id}:history`);
    this.stop = DialStore.subscribe(id, () => this.render());
  }

  public destroy(): void {
    this.stop();
    this.history.destroy();
    this.tree.destroy();
    this.versions.destroy();
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
    this.tree.update();
    this.versions.update(this.versionProps());
  }
}
