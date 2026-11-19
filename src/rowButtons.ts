import { ApplyButton } from './applyButton';
import { element, type Mounted } from './dom';
import type { Edits } from './edits';
import { ResetButton } from './resetButton';
import type { Spread } from './spread';

/** The two small buttons at the end of a control's row, one above the other: reset, apply to all versions. */
export class RowButtons implements Mounted {
  private readonly stack = element('div', 'little-row-buttons');
  private readonly reset: ResetButton;
  private readonly apply: ApplyButton;

  constructor(row: HTMLElement, edits: Edits, spread: Spread, path: string) {
    row.append(this.stack);
    this.reset = new ResetButton(this.stack, edits, path);
    this.apply = new ApplyButton(this.stack, spread, path);
  }

  public update(): void {
    this.reset.update();
    this.apply.update();
  }

  public destroy(): void {
    this.stack.remove();
  }
}
