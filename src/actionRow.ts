import { element } from './dom';
import { iconButton } from './icon';

export interface RowAction {
  /** Tooltip and accessible name. */
  label: string;
  /** Stroked paths in a 24 x 24 box. */
  icon: string[];
  run: () => void;
  /** Called once with the action's button: for a state to show on it (`aria-pressed`, `disabled`, another label). */
  mount?: (button: HTMLButtonElement) => void;
}

function rowButton({ label, icon, run, mount }: RowAction): HTMLButtonElement {
  const button = iconButton('little-button', label, icon, run);
  mount?.(button);
  return button;
}

/** A panel row of icon buttons sharing its width, for `Panel.slot`. */
export function actionRow(actions: RowAction[]): HTMLElement {
  const row = element('div', 'little-action-row');
  row.append(...actions.map(rowButton));
  return row;
}
