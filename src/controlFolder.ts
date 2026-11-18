import { type ControlMeta, type FolderProps, mountFolder } from 'dialkit/vanilla';
import type { Mounted } from './dom';
import type { Edits } from './edits';
import type { FolderState } from './folderState';

/**
 * A DialKit folder whose open state is kept, with a mark in its title while a control in it differs from the selected version.
 * Its controls are built when it is first opened: a panel holds many rows.
 */
export class ControlFolder implements Mounted {
  private readonly folder: ReturnType<typeof mountFolder>;
  private controls: Mounted[] | undefined;
  private marked: boolean;

  /** `build`: mounts the folder's controls into its body. */
  constructor(
    host: HTMLElement,
    private readonly meta: ControlMeta,
    private readonly folderState: FolderState,
    private readonly edits: Edits,
    private readonly build: (body: HTMLElement) => Mounted[],
  ) {
    const open = folderState.isOpen(meta.path, meta.defaultOpen ?? true);
    this.marked = edits.changed(meta.path);
    this.folder = mountFolder(host, { ...this.props(), defaultOpen: open });
    if (open) this.fill();
    // Capture phase: before DialKit's own handlers open the folder and measure its content for the animation.
    for (const type of ['click', 'keydown']) this.folder.element.addEventListener(type, () => this.fill(), { capture: true });
  }

  public update(): void {
    const marked = this.edits.changed(this.meta.path);
    if (marked !== this.marked) {
      this.marked = marked;
      this.folder.update(this.props());
    }
    for (const control of this.controls ?? []) control.update();
  }

  public destroy(): void {
    for (const control of this.controls ?? []) control.destroy();
    this.folder.destroy();
  }

  /** DialKit's folder replaces its props on update: the handler goes with every one. */
  private props(): FolderProps {
    const { label, path } = this.meta;
    return { title: this.marked ? `${label} *` : label, onOpenChange: (open) => this.folderState.set(path, open) };
  }

  private fill(): void {
    this.controls ??= this.build(this.folder.body);
  }
}
