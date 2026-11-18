import { curveIcon } from './curveIcon';
import type { CurveModel } from './curveModel';
import { type CurveName, FAMILY_NAMES, VARIANTS } from './curves';
import { element, type Mounted } from './dom';

/** Space between the row and the menu below it, in pixels. */
const OFFSET = 4;

/** Button on a curve row showing its curve, with a menu of all curves: families across, variants down. */
export class CurvePicker implements Mounted {
  private readonly button = element('button', 'little-curve-button');
  private readonly menu = element('div', 'little-curve-menu');
  private readonly options = new Map<CurveName, HTMLButtonElement>();
  private shown?: CurveName;

  constructor(private readonly row: HTMLElement, private readonly model: CurveModel) {
    this.button.type = 'button';
    this.button.popoverTargetElement = this.menu;
    this.menu.popover = 'auto';
    this.menu.addEventListener('beforetoggle', () => this.place());
    this.fill();
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
    for (const [name, option] of this.options) option.toggleAttribute('data-active', name === curve);
  }

  public destroy(): void {
    this.button.remove();
    this.menu.remove();
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

  /** The menu is in the top layer: placed under the row, at the row's width. */
  private place(): void {
    const { left, bottom, width } = this.row.getBoundingClientRect();
    Object.assign(this.menu.style, { left: `${left}px`, top: `${bottom + OFFSET}px`, width: `${width}px` });
  }
}
