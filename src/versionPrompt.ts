import { element, textButton } from './dom';
import type { VersionEntry } from './versions';

const CHOICE = 'little-version-choice';

/** Shown in the versions menu before an edited version is left for `next`. `leave(keep)`: selects `next`, with the edits kept in `active` or dropped. */
export function versionPrompt(active: VersionEntry, next: VersionEntry, leave: (keep: boolean) => void, cancel: () => void): HTMLElement[] {
  const choices = element('div', 'little-version-choices');
  choices.append(textButton(CHOICE, 'Save', () => leave(true)), textButton(CHOICE, 'Discard', () => leave(false)), textButton(CHOICE, 'Cancel', cancel));
  return [element('p', 'little-version-prompt', `Save the changes to “${active.name}” before selecting “${next.name}”?`), choices];
}
