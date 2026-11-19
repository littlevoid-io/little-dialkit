import { element, textButton } from './dom';
import type { VersionEntry } from './versions';

const CHOICE = 'little-version-choice';

/** What the versions menu asks in place of its rows. `choices`: what to do, by button label. */
export interface Question {
  text: string;
  choices: Record<string, () => void>;
}

/** A question in the versions menu: its text and a button per choice, then Cancel. A choice runs, then `close`. */
export function versionPrompt({ text, choices }: Question, close: () => void): HTMLElement[] {
  const row = element('div', 'little-version-choices');
  const buttons = Object.entries(choices).map(([label, run]) => textButton(CHOICE, label, () => {
    run();
    close();
  }));
  row.append(...buttons, textButton(CHOICE, 'Cancel', close));
  return [element('p', 'little-version-prompt', text), row];
}

/** Asked before an edited version is left for `next`. `leave(keep)`: selects `next`, with the edits kept in `active` or dropped. */
export function leaveQuestion(active: VersionEntry, next: VersionEntry, leave: (keep: boolean) => void): Question {
  return {
    text: `Save the changes to “${active.name}” before selecting “${next.name}”?`,
    choices: { Save: () => leave(true), Discard: () => leave(false) },
  };
}
