import type { DialPosition } from 'dialkit/vanilla';
import { clamp } from 'es-toolkit';

export interface Offset {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Distance the pointer travels before a press becomes a drag (DialKit's value). */
export const DRAG_THRESHOLD = 8;
/** Space kept to the viewport edge when dragging (DialKit's value). */
const EDGE = 8;
/** Edge of DialKit's collapsed icon. DialKit sets it in its folder and does not export it. */
const COLLAPSED_SIZE = 42;

/** Keeps the whole panel inside the viewport, pinned to the top left edge when it is larger. */
export function clampOffset(offset: Offset, panel: Size, viewport: Size): Offset {
  return {
    x: clamp(offset.x, EDGE, Math.max(EDGE, viewport.width - panel.width - EDGE)),
    y: clamp(offset.y, EDGE, Math.max(EDGE, viewport.height - panel.height - EDGE)),
  };
}

/** The corner nearest to the collapsed icon at `offset`, judged by the icon's center as DialKit does. */
export function nearestCorner(offset: Offset, viewport: Size): DialPosition {
  const vertical = offset.y + COLLAPSED_SIZE / 2 < viewport.height / 2 ? 'top' : 'bottom';
  const horizontal = offset.x + COLLAPSED_SIZE / 2 < viewport.width / 2 ? 'left' : 'right';
  return `${vertical}-${horizontal}`;
}
