import { element } from './dom';
import { ICONS, iconButton } from './icon';
import type { VersionEntry } from './versions';

const ACTION = 'little-version-action';

export interface RowState {
  active: boolean;
  /** The selected version has edits. */
  edited: boolean;
  renaming: boolean;
}

export interface RowActions {
  select(entry: VersionEntry): void;
  /** Shows the name as a text field. */
  edit(entry: VersionEntry): void;
  rename(entry: VersionEntry, name: string): void;
  remove(entry: VersionEntry): void;
  save(): void;
  discard(): void;
}

function nameButton(entry: VersionEntry, { active, edited }: RowState, actions: RowActions): HTMLElement {
  const button = element('button', 'little-version-name', active && edited ? `${entry.name} *` : entry.name);
  button.type = 'button';
  button.addEventListener('click', () => actions.select(entry));
  return button;
}

/** Leaving the field renames; Enter leaves it, Escape leaves it with the old name. */
function nameField(entry: VersionEntry, actions: RowActions): HTMLElement {
  const input = element('input', 'little-version-field');
  input.value = entry.name;
  input.ariaLabel = 'Version name';
  input.addEventListener('blur', () => actions.rename(entry, input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    if (event.key === 'Escape') input.value = entry.name;
    event.preventDefault();
    input.blur();
  });
  return input;
}

/** Deletes on the second click; leaving the button disarms it. */
function removeButton(entry: VersionEntry, actions: RowActions): HTMLElement {
  const button = iconButton(ACTION, 'Delete', ICONS.remove, () => {
    if ('armed' in button.dataset) actions.remove(entry);
    button.dataset.armed = '';
    button.title = 'Click again to delete';
  });
  button.addEventListener('pointerleave', () => {
    delete button.dataset.armed;
    button.title = 'Delete';
  });
  return button;
}

function buttons(entry: VersionEntry, { active, edited }: RowState, actions: RowActions): HTMLElement[] {
  const list: HTMLElement[] = [iconButton(ACTION, 'Rename', ICONS.rename, () => actions.edit(entry))];
  if (active && edited) {
    list.unshift(
      iconButton(ACTION, 'Save changes to this version', ICONS.save, () => actions.save()),
      iconButton(ACTION, 'Discard changes', ICONS.reset, () => actions.discard()),
    );
  }
  if (entry.id !== null) list.push(removeButton(entry, actions));
  return list;
}

/** One version in the menu: its name, or the field renaming it, and its buttons. */
export function versionRow(entry: VersionEntry, state: RowState, actions: RowActions): HTMLElement {
  const row = element('div', 'little-version');
  row.toggleAttribute('data-active', state.active);
  row.toggleAttribute('data-edited', state.active && state.edited);
  row.append(state.renaming ? nameField(entry, actions) : nameButton(entry, state, actions), ...buttons(entry, state, actions));
  return row;
}
