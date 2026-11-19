import { element } from './dom';
import { icon, ICONS } from './icon';

/** The button in the toolbar row that names the selected version and opens the versions menu. */
export class VersionButton {
  public readonly element = element('button', 'little-version-button');
  private readonly label = element('span', 'little-version-label');

  /** `menu`: the popover the button opens. */
  constructor(menu: HTMLElement) {
    this.element.type = 'button';
    this.element.popoverTargetElement = menu;
    this.element.append(this.label, icon(ICONS.expand));
  }

  /** `edited`: the version has edits, marked with `*`. */
  public show(name: string, edited: boolean): void {
    this.label.textContent = edited ? `${name} *` : name;
    this.element.title = edited ? `Version: ${name} (edited)` : `Version: ${name}`;
  }
}
