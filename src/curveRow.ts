import type { CurveModel } from './curveModel';
import { CurvePicker } from './curvePicker';
import { CurveSlider } from './curveSlider';
import { element, type Mounted } from './dom';

/** One panel row for a curve parameter: the slider and its curve button. */
export class CurveRow implements Mounted {
  private readonly row = element('div', 'little-curve-row');
  private readonly slider: CurveSlider;
  private readonly picker: CurvePicker;

  constructor(host: HTMLElement, model: CurveModel) {
    this.slider = new CurveSlider(this.row, model);
    this.picker = new CurvePicker(this.row, model);
    host.append(this.row);
  }

  public update(): void {
    this.slider.update();
    this.picker.update();
  }

  public destroy(): void {
    this.row.remove();
  }
}
