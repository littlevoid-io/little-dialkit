import { ICONS, iconButton } from './icon';
import type { Undo } from './undo';

/** Undo and redo buttons, disabled while there is nothing to undo or redo. */
export class HistoryButtons {
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly stop: () => void;

  constructor(parent: HTMLElement, private readonly history: Undo) {
    this.undoButton = iconButton('little-button', 'Undo (Ctrl+Z)', ICONS.undo, () => history.undo());
    this.redoButton = iconButton('little-button', 'Redo (Ctrl+Shift+Z)', ICONS.redo, () => history.redo());
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
