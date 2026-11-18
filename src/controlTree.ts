import { type ControlMeta, type ControlRendererProps, DialStore, mountControlRenderer, mountFolder } from 'dialkit/vanilla';
import { isCurve } from './curveConfig';
import { CurveModel } from './curveModel';
import { CurveRow } from './curveRow';
import type { Mounted } from './dom';
import type { FolderState } from './folderState';

/** One of DialKit's own controls, drawn by its renderer. */
class NativeControl implements Mounted {
  private readonly renderer: ReturnType<typeof mountControlRenderer>;

  constructor(host: HTMLElement, private readonly panelId: string, private readonly meta: ControlMeta) {
    this.renderer = mountControlRenderer(host, this.props());
  }

  public update(): void {
    this.renderer.update(this.props());
  }

  public destroy(): void {
    this.renderer.destroy();
  }

  private props(): ControlRendererProps {
    return { panelId: this.panelId, controls: [this.meta], values: DialStore.getValues(this.panelId) };
  }
}

/** The controls of a panel: DialKit folders and controls, with curve rows for the `curve()` pairs. */
export class ControlTree implements Mounted {
  private readonly controls: Mounted[] = [];
  private readonly folders: Pick<Mounted, 'destroy'>[] = [];

  /** `labels`: by control path, in place of the labels DialKit derives from the keys. */
  constructor(
    private readonly panelId: string,
    private readonly folderState: FolderState,
    private readonly labels: Record<string, string>,
    controls: ControlMeta[],
    host: HTMLElement,
  ) {
    this.build(controls, host);
  }

  public update(): void {
    for (const control of this.controls) control.update();
  }

  public destroy(): void {
    for (const control of this.controls) control.destroy();
    for (const folder of this.folders.reverse()) folder.destroy();
  }

  private build(controls: ControlMeta[], host: HTMLElement): void {
    for (const control of controls) {
      const meta = { ...control, label: this.labels[control.path] ?? control.label };
      if (isCurve(meta)) this.controls.push(new CurveRow(host, new CurveModel(this.panelId, meta)));
      else if (meta.type === 'folder') this.folder(meta, host);
      else this.controls.push(new NativeControl(host, this.panelId, meta));
    }
  }

  private folder(meta: ControlMeta, host: HTMLElement): void {
    const folder = mountFolder(host, {
      title: meta.label,
      defaultOpen: this.folderState.isOpen(meta.path, meta.defaultOpen ?? true),
      onOpenChange: (open) => this.folderState.set(meta.path, open),
    });
    this.folders.push(folder);
    this.build(meta.children ?? [], folder.body);
  }
}
