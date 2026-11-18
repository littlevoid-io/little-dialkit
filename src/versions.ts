import { DialStore, type DialTheme, type DialVersions, type FolderProps, mountFolder, mountPresetManager, mountVersionGallery, type PresetManagerProps } from 'dialkit/vanilla';
import type { Mounted } from './dom';
import type { FolderState } from './folderState';

/** Key of the gallery's folder in the folder state; no control path starts with a colon. */
const GALLERY_PATH = ':versions';

/**
 * DialKit's versions UI: a menu in the toolbar, or the thumbnail gallery (renamed by a double click) in a folder above the controls.
 * The folder is closed until opened and its title names the selected version.
 */
export class Versions implements Mounted {
  private readonly menu: ReturnType<typeof mountPresetManager> | undefined;
  private readonly folder: ReturnType<typeof mountFolder> | undefined;
  private readonly gallery: ReturnType<typeof mountVersionGallery> | undefined;

  constructor(private readonly panelId: string, view: DialVersions, theme: DialTheme, toolbar: HTMLElement, body: HTMLElement, private readonly folderState: FolderState) {
    if (view === 'menu') {
      this.menu = mountPresetManager(toolbar, this.menuProps());
      return;
    }
    this.folder = mountFolder(body, this.folderProps());
    this.gallery = mountVersionGallery(this.folder.body, { panelId, theme });
  }

  /** The gallery follows the store by itself. */
  public update(): void {
    this.menu?.update(this.menuProps());
    this.folder?.update(this.folderProps());
  }

  public destroy(): void {
    this.menu?.destroy();
    this.gallery?.destroy();
    this.folder?.destroy();
  }

  /** DialKit's folder replaces its props on update: the handler goes with every one. */
  private folderProps(): FolderProps {
    return {
      title: this.title(),
      defaultOpen: this.folderState.isOpen(GALLERY_PATH, false),
      onOpenChange: (open) => this.folderState.set(GALLERY_PATH, open),
    };
  }

  private title(): string {
    const { panelId } = this;
    const activeId = DialStore.getActivePresetId(panelId);
    const name = DialStore.getPresets(panelId).find(({ id }) => id === activeId)?.name ?? DialStore.getBaseName(panelId);
    return `Version: ${name}`;
  }

  private menuProps(): PresetManagerProps {
    const { panelId } = this;
    return { panelId, presets: DialStore.getPresets(panelId), activePresetId: DialStore.getActivePresetId(panelId) };
  }
}
