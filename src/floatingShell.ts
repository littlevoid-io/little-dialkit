import { type DialConfig, type DialKitController, type DialPosition, mountFolder } from 'dialkit/vanilla';
import type { FloatingOptions } from './panelOptions';
import { type DragHandlers, PanelDrag } from './panelDrag';
import { clampOffset, nearestCorner, type Offset, type Size } from './placement';
import { ShellState } from './shellState';

type OpenControl = Pick<DialKitController<DialConfig>, 'getOpen' | 'setOpen'>;

function viewport(): Size {
  const { clientWidth, clientHeight } = document.documentElement;
  return { width: clientWidth, height: clientHeight };
}

/**
 * Makes `root` a floating panel around DialKit's root folder: fixed at a corner, dragged by the folder's header,
 * collapsed to an icon, and remembered across reloads. The folder's header, size and look are DialKit's.
 */
export class FloatingShell {
  /** DialKit's root folder; the panel puts its toolbar row and controls into it. */
  public readonly folder: ReturnType<typeof mountFolder>;
  private readonly state: ShellState;
  private readonly drag: PanelDrag;
  private readonly observer = new ResizeObserver(() => this.keepInside());
  private open: boolean;
  private corner: DialPosition;
  private offset: Offset | null;
  private offsetBeforeDrag: Offset | null = null;

  constructor(private readonly root: HTMLElement, private readonly kit: OpenControl, private readonly title: string, private readonly options: FloatingOptions) {
    this.state = new ShellState(`little-dialkit:${options.id}:shell`);
    this.corner = this.state.get('corner', options.position ?? 'top-right');
    this.offset = this.state.get('offset', null);
    this.open = this.state.get('open', kit.getOpen() ?? options.defaultOpen ?? true);
    kit.setOpen(this.open);
    root.classList.add('little-floating');
    this.folder = mountFolder(root, this.folderProps());
    this.place();
    this.drag = new PanelDrag(this.folder.element, this.dragHandlers());
    this.observer.observe(root);
    window.addEventListener('resize', this.keepInside);
  }

  /** Follows the open state in DialKit's store, which `kit.setOpen` and the folder's own toggle write. */
  public update(): void {
    const open = this.kit.getOpen() ?? this.open;
    this.folder.update(this.folderProps(open));
    if (open !== this.open) this.settle(open);
  }

  /** Detaches the drag and resize handling. The folder stays for the panel to destroy. */
  public destroy(): void {
    this.drag.destroy();
    this.observer.disconnect();
    window.removeEventListener('resize', this.keepInside);
  }

  private folderProps(open = this.open) {
    return { title: this.title, open, isRoot: true, inline: false, onOpenChange: (next: boolean) => this.kit.setOpen(next) };
  }

  private dragHandlers(): DragHandlers {
    const { body, toolbar } = this.folder;
    return {
      // The collapsed icon is dragged by any point; the open panel by its header, not by what the header holds or the controls.
      accepts: (target) => !this.open || !(body.contains(target) || toolbar.contains(target)),
      origin: () => this.startDrag(),
      move: (offset) => this.moveTo(offset),
      end: (cancelled) => this.drop(cancelled),
    };
  }

  private startDrag(): Offset {
    this.offsetBeforeDrag = this.offset;
    const { left, top } = this.root.getBoundingClientRect();
    return { x: left, y: top };
  }

  private moveTo(offset: Offset): void {
    this.root.dataset.dragging = '';
    this.offset = clampOffset(offset, this.root.getBoundingClientRect(), viewport());
    this.place();
  }

  private drop(cancelled: boolean): void {
    delete this.root.dataset.dragging;
    if (cancelled) {
      this.offset = this.offsetBeforeDrag;
      this.place();
    } else this.save();
  }

  /** A dragged panel keeps its position; opening it from the icon snaps it to the nearest corner, as DialKit's does. */
  private settle(open: boolean): void {
    if (open && this.offset) {
      this.corner = nearestCorner(this.offset, viewport());
      this.offset = null;
      this.place();
    }
    this.open = open;
    this.save();
    this.options.onOpenChange?.(open);
  }

  private place(): void {
    const { style, dataset } = this.root;
    if (this.offset) {
      delete dataset.position;
      Object.assign(style, { left: `${this.offset.x}px`, top: `${this.offset.y}px`, right: 'auto', bottom: 'auto' });
    } else {
      dataset.position = this.corner;
      Object.assign(style, { left: '', top: '', right: '', bottom: '' });
    }
  }

  /** Runs on a window resize and when the panel changes size, e.g. a folder opens. */
  private readonly keepInside = (): void => {
    if (!this.offset) return;
    const next = clampOffset(this.offset, this.root.getBoundingClientRect(), viewport());
    if (next.x === this.offset.x && next.y === this.offset.y) return;
    this.offset = next;
    this.place();
  };

  private save(): void {
    this.state.set({ open: this.open, corner: this.corner, offset: this.offset });
  }
}
