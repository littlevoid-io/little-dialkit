import type { DialPosition } from 'dialkit/vanilla';
import type { Offset } from './placement';

export interface SavedShell {
  open: boolean;
  /** Where the panel sits while `offset` is null. */
  corner: DialPosition;
  /** The dragged position, or null while the panel sits at its corner. */
  offset: Offset | null;
}

/** Open state and position of the floating shell, kept in localStorage. */
export class ShellState {
  private saved: Partial<SavedShell>;

  constructor(private readonly storageKey: string) {
    this.saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
  }

  /** The stored value, or `initial` for one that was never saved. */
  public get<Key extends keyof SavedShell>(key: Key, initial: SavedShell[Key]): SavedShell[Key] {
    return this.saved[key] ?? initial;
  }

  public set(saved: SavedShell): void {
    this.saved = saved;
    localStorage.setItem(this.storageKey, JSON.stringify(saved));
  }
}
