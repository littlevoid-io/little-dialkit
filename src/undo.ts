import { DialStore } from 'dialkit/vanilla';
import type { Edits } from './edits';
import { EditHistory } from './history';
import { show, type Shown, shown } from './versions';

/** Undo / redo of a panel's values and its selected version. The keys: `Shortcuts`. */
export class Undo {
  private readonly history: EditHistory<Shown>;
  private readonly stop: () => void;
  private suspended = false;

  constructor(private readonly panelId: string, storageKey: string, private readonly edits: Edits) {
    this.history = new EditHistory(shown(panelId), storageKey);
    this.stop = DialStore.subscribe(panelId, () => this.record());
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
  }

  private record(): void {
    if (!this.suspended) this.history.record(shown(this.panelId));
  }

  private restore(step: Shown | undefined): void {
    if (step) this.suspend(() => show(this.panelId, step, this.edits.held));
  }
}
