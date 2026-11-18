import { DialStore, type DialTheme, type DialVersions, mountPresetManager, mountVersionGallery, type PresetManagerProps } from 'dialkit/vanilla';
import type { Mounted } from './dom';

/** DialKit's versions UI: thumbnails above the controls (renamed by a double click), or a menu in the toolbar. */
export class Versions implements Mounted {
  private readonly menu: ReturnType<typeof mountPresetManager> | undefined;
  private readonly gallery: ReturnType<typeof mountVersionGallery> | undefined;

  constructor(private readonly panelId: string, view: DialVersions, theme: DialTheme, toolbar: HTMLElement, body: HTMLElement) {
    if (view === 'menu') this.menu = mountPresetManager(toolbar, this.menuProps());
    else this.gallery = mountVersionGallery(body, { panelId, theme });
  }

  /** The gallery follows the store by itself. */
  public update(): void {
    this.menu?.update(this.menuProps());
  }

  public destroy(): void {
    this.menu?.destroy();
    this.gallery?.destroy();
  }

  private menuProps(): PresetManagerProps {
    const { panelId } = this;
    return { panelId, presets: DialStore.getPresets(panelId), activePresetId: DialStore.getActivePresetId(panelId) };
  }
}
