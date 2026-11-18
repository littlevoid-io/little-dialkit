import { DRAG_THRESHOLD, type Offset } from './placement';

export interface DragHandlers {
  /** Whether a press on `target` may start a drag. */
  accepts(target: Element): boolean;
  /** The panel's top left corner at the press. */
  origin(): Offset;
  /** Called for every pointer move once the press became a drag. */
  move(offset: Offset): void;
  /** Called once after a drag, `cancelled` when the browser took the pointer away. */
  end(cancelled: boolean): void;
}

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  origin: Offset;
  dragging: boolean;
}

function stopClick(event: Event): void {
  event.stopImmediatePropagation();
  event.preventDefault();
}

/** Drags a panel once a press has travelled `DRAG_THRESHOLD`. A press that stays put is left to be a click. */
export class PanelDrag {
  private gesture: Gesture | undefined;

  constructor(private readonly node: HTMLElement, private readonly handlers: DragHandlers) {
    node.addEventListener('pointerdown', this.press);
  }

  public destroy(): void {
    this.node.removeEventListener('pointerdown', this.press);
    this.detach();
  }

  private readonly press = (event: PointerEvent): void => {
    if (event.button !== 0 || this.gesture || !(event.target instanceof Element) || !this.handlers.accepts(event.target)) return;
    this.gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: this.handlers.origin(), dragging: false };
    window.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.release);
    window.addEventListener('pointercancel', this.release);
  };

  private readonly move = (event: PointerEvent): void => {
    const { gesture } = this;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    // Capturing only now keeps the click of a press that stays put targeted at the header.
    if (!gesture.dragging) this.node.setPointerCapture(gesture.pointerId);
    gesture.dragging = true;
    this.handlers.move({ x: gesture.origin.x + dx, y: gesture.origin.y + dy });
  };

  private readonly release = (event: PointerEvent): void => {
    if (event.pointerId !== this.gesture?.pointerId) return;
    const { dragging } = this.gesture;
    const cancelled = event.type === 'pointercancel';
    this.detach();
    if (!dragging) return;
    // The click that follows a drag must not toggle the panel.
    if (!cancelled) this.blockClick();
    this.handlers.end(cancelled);
  };

  private detach(): void {
    this.gesture = undefined;
    window.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.release);
  }

  private blockClick(): void {
    this.node.addEventListener('click', stopClick, { capture: true, once: true });
    // No click follows when the pointer is released elsewhere.
    setTimeout(() => this.node.removeEventListener('click', stopClick, true));
  }
}
