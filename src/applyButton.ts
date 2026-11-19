import type { Mounted } from './dom';
import { ICONS, iconButton } from './icon';
import type { Spread } from './spread';

const LABEL = 'Apply to all versions';

/**
 * Button of a control's row: writes the control's value into all other versions on the second click.
 * Leaving the button disarms it. Disabled while there is no other version.
 */
export class ApplyButton implements Mounted {
  private readonly button: HTMLButtonElement;

  constructor(host: HTMLElement, private readonly spread: Spread, private readonly path: string) {
    this.button = iconButton('little-button little-apply', LABEL, ICONS.versions, () => this.click());
    this.button.addEventListener('pointerleave', () => this.disarm());
    host.append(this.button);
    this.update();
  }

  public update(): void {
    this.button.disabled = !this.spread.possible;
  }

  public destroy(): void {
    this.button.remove();
  }

  private click(): void {
    if (!('armed' in this.button.dataset)) return this.arm();
    this.disarm();
    this.spread.apply(this.path);
  }

  private arm(): void {
    this.button.dataset.armed = '';
    this.button.title = 'Click again to apply to all versions';
  }

  private disarm(): void {
    delete this.button.dataset.armed;
    this.button.title = LABEL;
  }
}
