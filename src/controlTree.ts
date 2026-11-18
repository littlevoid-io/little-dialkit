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

/**
 * The controls of a panel: DialKit folders and controls, with curve rows for the `curve()` pairs.
 * A folder's controls are built when it is first opened: DialKit's thumbnail capture reads the style of every element, closed folders included.
 */
export class ControlTree implements Mounted {
  private readonly controls: Mounted[] = [];
  private readonly folders: Pick<Mounted, 'destroy'>[] = [];
  /** Paths of the folders whose controls exist. */
  private readonly built = new Set<string>();

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
    const open = this.folderState.isOpen(meta.path, meta.defaultOpen ?? true);
    const folder = mountFolder(host, { title: meta.label, defaultOpen: open, onOpenChange: (next) => this.folderState.set(meta.path, next) });
    this.folders.push(folder);
    if (open) this.fill(meta, folder.body);
    // Capture phase: before DialKit's own handlers open the folder and measure its content for the animation.
    for (const type of ['click', 'keydown']) folder.element.addEventListener(type, () => this.fill(meta, folder.body), { capture: true });
  }

  private fill(meta: ControlMeta, body: HTMLElement): void {
    if (this.built.has(meta.path)) return;
    this.built.add(meta.path);
    this.build(meta.children ?? [], body);
  }
}
