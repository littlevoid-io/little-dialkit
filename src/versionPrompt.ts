import type { Question } from './prompt';
import type { VersionEntry } from './versions';

/** Asked before an edited version is left for `next`. `leave(keep)`: selects `next`, with the edits kept in `active` or dropped. */
export function leaveQuestion(active: VersionEntry, next: VersionEntry, leave: (keep: boolean) => void): Question {
  return {
    text: `Save the changes to “${active.name}” before selecting “${next.name}”?`,
    choices: { Save: () => leave(true), Discard: () => leave(false) },
  };
}

/** Asked before the saved version `entry` is copied to the base. */
export function defaultQuestion(entry: VersionEntry, base: VersionEntry, copy: () => void): Question {
  return {
    text: `Copy all values of “${entry.name}” to “${base.name}”? This replaces what it holds and cannot be undone.`,
    choices: { Copy: copy },
  };
}
