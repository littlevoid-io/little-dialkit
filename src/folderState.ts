/** Open / closed state of folders by control path, kept in localStorage. */
export class FolderState {
  private readonly open: Record<string, boolean>;

  constructor(private readonly storageKey: string) {
    this.open = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
  }

  /** The stored state, or `initial` for a folder that was never toggled. */
  public isOpen(path: string, initial: boolean): boolean {
    return this.open[path] ?? initial;
  }

  public set(path: string, open: boolean): void {
    this.open[path] = open;
    localStorage.setItem(this.storageKey, JSON.stringify(this.open));
  }
}
