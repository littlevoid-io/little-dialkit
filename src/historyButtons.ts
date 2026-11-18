import { element } from './dom';
import type { Undo } from './undo';

const SVG = 'http://www.w3.org/2000/svg';

interface Action {
  label: string;
  shortcut: string;
  /** Stroked paths in a 24 x 24 box. */
  paths: string[];
}

const UNDO: Action = { label: 'Undo', shortcut: 'Ctrl+Z', paths: ['M3 7v6h6', 'M3 13a9 9 0 0 1 15-4.7 9 9 0 0 1 3 6.7'] };
const REDO: Action = { label: 'Redo', shortcut: 'Ctrl+Shift+Z', paths: ['M21 7v6h-6', 'M21 13a9 9 0 0 0-15-4.7 9 9 0 0 0-3 6.7'] };

function icon({ paths }: Action): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('little-history-icon');
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function button(action: Action, onClick: () => void): HTMLButtonElement {
  const node = element('button', 'little-history-button');
  node.type = 'button';
  node.title = `${action.label} (${action.shortcut})`;
  node.setAttribute('aria-label', node.title);
  node.append(icon(action));
  node.addEventListener('click', onClick);
  return node;
}

/** Undo and redo buttons, disabled while there is nothing to undo or redo. */
export class HistoryButtons {
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly stop: () => void;

  constructor(parent: HTMLElement, private readonly history: Undo) {
    this.undoButton = button(UNDO, () => history.undo());
    this.redoButton = button(REDO, () => history.redo());
    parent.append(this.undoButton, this.redoButton);
    this.stop = history.subscribe(() => this.update());
    this.update();
  }

  public destroy(): void {
    this.stop();
  }

  private update(): void {
    this.undoButton.disabled = !this.history.canUndo;
    this.redoButton.disabled = !this.history.canRedo;
  }
}
