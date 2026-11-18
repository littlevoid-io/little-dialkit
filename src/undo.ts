import { DialStore } from 'dialkit/vanilla';
import { EditHistory } from './history';
import { type Values, withoutActions } from './values';

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/** Undo / redo of a panel's values: Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y (Cmd on macOS). */
export class Undo {
  private readonly history: EditHistory<Values>;
  private readonly stop: () => void;
  private suspended = false;

  constructor(private readonly panelId: string, storageKey: string) {
    this.history = new EditHistory(this.snapshot(), storageKey);
    this.stop = DialStore.subscribe(panelId, () => this.record());
    window.addEventListener('keydown', this.key);
  }

  public undo(): void {
    this.restore(this.history.undo());
  }

  public redo(): void {
    this.restore(this.history.redo());
  }

  public get canUndo(): boolean {
    return this.history.canUndo;
  }

  public get canRedo(): boolean {
    return this.history.canRedo;
  }

  /** Calls the listener when `canUndo` or `canRedo` may have changed. Returns the unsubscribe function. */
  public subscribe(listener: () => void): () => void {
    return this.history.subscribe(listener);
  }

  /** Runs store changes that are not undo steps of their own; what they leave behind is recorded as one step. */
  public suspend<Result>(run: () => Result): Result {
    this.suspended = true;
    try {
      return run();
    } finally {
      this.suspended = false;
      this.record();
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('keydown', this.key);
  }

  private snapshot(): Values {
    return withoutActions(DialStore.getValues(this.panelId));
  }

  private record(): void {
    if (!this.suspended) this.history.record(this.snapshot());
  }

  private restore(values: Values | undefined): void {
    if (values) this.suspend(() => DialStore.updateValues(this.panelId, values));
  }

  private readonly key = (event: KeyboardEvent): void => {
    if (!(event.ctrlKey || event.metaKey) || isEditable(event.target)) return;
    const key = event.key.toLowerCase();
    if (key !== 'z' && key !== 'y') return;
    event.preventDefault();
    if (key === 'z' && !event.shiftKey) this.undo();
    else this.redo();
  };
}
