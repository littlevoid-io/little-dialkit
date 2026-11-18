import type { ControlMeta } from 'dialkit/vanilla';
import { ControlFolder } from './controlFolder';
import { isCurve } from './curveConfig';
import { CurveModel } from './curveModel';
import { CurveRow } from './curveRow';
import type { Mounted } from './dom';
import type { Edits } from './edits';
import type { FolderState } from './folderState';
import { NativeControl } from './nativeControl';

/** The controls of a panel: DialKit folders and controls, with curve rows for the `curve()` pairs. */
export class ControlTree implements Mounted {
  private readonly controls: Mounted[];

  /** `labels`: by control path, in place of the labels DialKit derives from the keys. */
  constructor(
    private readonly panelId: string,
    private readonly folderState: FolderState,
    private readonly edits: Edits,
    private readonly labels: Record<string, string>,
    controls: ControlMeta[],
    host: HTMLElement,
  ) {
    this.controls = this.build(controls, host);
  }

  public update(): void {
    for (const control of this.controls) control.update();
  }

  public destroy(): void {
    for (const control of this.controls) control.destroy();
  }

  private build(controls: ControlMeta[], host: HTMLElement): Mounted[] {
    return controls.map((control) => this.mount({ ...control, label: this.labels[control.path] ?? control.label }, host));
  }

  private mount(meta: ControlMeta, host: HTMLElement): Mounted {
    if (isCurve(meta)) return new CurveRow(host, new CurveModel(this.panelId, meta), this.edits, meta.path);
    if (meta.type !== 'folder') return new NativeControl(host, this.panelId, meta, this.edits);
    return new ControlFolder(host, meta, this.folderState, this.edits, (body) => this.build(meta.children ?? [], body));
  }
}
