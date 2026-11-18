import { DialStore, type DialValue } from 'dialkit/vanilla';
import { EditHistory } from './history';

type Values = Record<string, DialValue>;

function isAction(value: DialValue): boolean {
  return typeof value === 'object' && 'type' in value && value.type === 'action';
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/** Undo / redo of a panel's values: Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y (Cmd on macOS). */
export class Undo {
  private readonly history: EditHistory<Values>;
  private readonly stop: () => void;
  private restoring = false;

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

  public destroy(): void {
    this.stop();
    window.removeEventListener('keydown', this.key);
  }

  /** The values by path, without action buttons. */
  private snapshot(): Values {
    return Object.fromEntries(Object.entries(DialStore.getValues(this.panelId)).filter(([, value]) => !isAction(value)));
  }

  private record(): void {
    if (!this.restoring) this.history.record(this.snapshot());
  }

  private restore(values: Values | undefined): void {
    if (!values) return;
    this.restoring = true;
    DialStore.updateValues(this.panelId, values);
    this.restoring = false;
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
