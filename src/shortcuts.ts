import type { Actions } from './actions';
import type { Undo } from './undo';
import type { VersionMenu } from './versionMenu';

type Keys = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

/**
 * Name of the keys pressed: `ctrl+shift+s`, `[`, `escape`. Cmd counts as Ctrl.
 * AltGr reports Ctrl and Alt on Windows: it is not Ctrl, and layouts that type `[` with it take part.
 */
export function chord({ key, ctrlKey, metaKey, altKey, shiftKey }: Keys): string {
  const command = metaKey || (ctrlKey && !altKey);
  return `${command ? 'ctrl+' : ''}${command && shiftKey ? 'shift+' : ''}${key.toLowerCase()}`;
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/**
 * A panel's keyboard shortcuts, on the window: Ctrl+S saves, Ctrl+Shift+S saves as a new version, Escape resets (`Actions`),
 * `[` / `]` select the previous / next version, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y undo and redo.
 * Not while a text field has the focus: it keeps the browser's own keys.
 */
export class Shortcuts {
  private readonly keys: Record<string, () => void> = {
    'ctrl+s': () => this.actions.save(),
    'ctrl+shift+s': () => this.actions.saveAs(),
    'ctrl+z': () => this.history.undo(),
    'ctrl+shift+z': () => this.history.redo(),
    'ctrl+y': () => this.history.redo(),
    '[': () => this.cycle(-1),
    ']': () => this.cycle(1),
    escape: () => this.actions.reset(),
  };

  constructor(private readonly actions: Actions, private readonly versions: VersionMenu, private readonly history: Undo) {
    window.addEventListener('keydown', this.key);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.key);
  }

  /** Selects the version `step` rows on from the selected one in the versions menu; wraps at the ends. */
  private cycle(step: number): void {
    const { entries, active } = this.versions;
    const index = entries.findIndex(({ id }) => id === active.id);
    this.versions.select(entries[(index + step + entries.length) % entries.length]);
  }

  private readonly key = (event: KeyboardEvent): void => {
    // DialKit's controls prevent the default of the Escape they take (a drag, a popup).
    if (event.defaultPrevented || isEditable(event.target)) return;
    const name = chord(event);
    const action = this.keys[name];
    // The Escape that closes a menu or a picker is the browser's: preventing its default would keep them open.
    if (!action || (name === 'escape' && document.querySelector(':popover-open'))) return;
    event.preventDefault();
    action();
  };
}
