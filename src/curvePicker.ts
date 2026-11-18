import { curveIcon } from './curveIcon';
import type { CurveModel } from './curveModel';
import { type CurveName, FAMILY_NAMES, VARIANTS } from './curves';
import { element, type Mounted, placeBelow } from './dom';

/**
 * Button on a curve row showing its curve, with a menu of all curves: families across, variants down.
 * The menu has its options only while it is open: a panel holds many rows.
 */
export class CurvePicker implements Mounted {
  private readonly button = element('button', 'little-button little-curve-button');
  private readonly menu = element('div', 'little-curve-menu');
  private readonly options = new Map<CurveName, HTMLButtonElement>();
  private shown?: CurveName;

  constructor(private readonly row: HTMLElement, private readonly model: CurveModel) {
    this.button.type = 'button';
    this.button.popoverTargetElement = this.menu;
    this.menu.popover = 'auto';
    this.menu.addEventListener('beforetoggle', (event) => this.toggle(event.newState === 'open'));
    row.append(this.button, this.menu);
    this.update();
  }

  public update(): void {
    const { curve } = this.model;
    if (curve === this.shown) return;
    this.shown = curve;
    this.button.replaceChildren(curveIcon(curve));
    this.button.title = `Curve: ${curve}`;
    this.button.toggleAttribute('data-mapped', curve !== 'linear');
    this.mark();
  }

  public destroy(): void {
    this.button.remove();
    this.menu.remove();
  }

  private toggle(open: boolean): void {
    this.menu.replaceChildren();
    this.options.clear();
    if (!open) return;
    this.fill();
    this.mark();
    placeBelow(this.menu, this.row);
  }

  private mark(): void {
    for (const [name, option] of this.options) option.toggleAttribute('data-active', name === this.model.curve);
  }

  /** Linear takes the corner of the grid. */
  private fill(): void {
    this.menu.append(this.option('linear'), ...FAMILY_NAMES.map((family) => element('span', 'little-curve-heading', family)));
    for (const variant of VARIANTS) {
      this.menu.append(element('span', 'little-curve-heading', variant), ...FAMILY_NAMES.map((family) => this.option(`${family}${variant}`)));
    }
  }

  private option(name: CurveName): HTMLButtonElement {
    const option = element('button', 'little-curve-option');
    option.type = 'button';
    option.title = name;
    option.append(curveIcon(name));
    option.addEventListener('click', () => this.choose(name));
    this.options.set(name, option);
    return option;
  }

  private choose(name: CurveName): void {
    this.menu.hidePopover();
    this.model.curve = name;
  }
}
