import { element } from './dom';
import { iconButton } from './icon';

export interface RowAction {
  /** Tooltip and accessible name. */
  label: string;
  /** Stroked paths in a 24 x 24 box. */
  icon: string[];
  run: () => void;
}

/** A panel row of icon buttons sharing its width, for `Panel.slot`. */
export function actionRow(actions: RowAction[]): HTMLElement {
  const row = element('div', 'little-action-row');
  row.append(...actions.map(({ label, icon, run }) => iconButton('little-button', label, icon, run)));
  return row;
}
