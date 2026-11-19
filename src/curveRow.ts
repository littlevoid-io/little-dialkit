import type { CurveModel } from './curveModel';
import { CurvePicker } from './curvePicker';
import { CurveSlider } from './curveSlider';
import { element, type Mounted } from './dom';
import type { Edits } from './edits';
import { RowButtons } from './rowButtons';
import type { Spread } from './spread';

/** One panel row for a curve parameter: the slider, its curve button and the reset and apply-to-all-versions buttons for value and curve. */
export class CurveRow implements Mounted {
  private readonly row = element('div', 'little-row');
  private readonly slider: CurveSlider;
  private readonly picker: CurvePicker;
  private readonly buttons: RowButtons;

  constructor(host: HTMLElement, model: CurveModel, edits: Edits, spread: Spread, path: string) {
    this.slider = new CurveSlider(this.row, model);
    this.picker = new CurvePicker(this.row, model);
    this.buttons = new RowButtons(this.row, edits, spread, path);
    host.append(this.row);
  }

  public update(): void {
    this.slider.update();
    this.picker.update();
    this.buttons.update();
  }

  public destroy(): void {
    this.row.remove();
  }
}
