import type { CurveModel } from './curveModel';
import { CurvePicker } from './curvePicker';
import { CurveSlider } from './curveSlider';
import { element, type Mounted } from './dom';
import type { Edits } from './edits';
import { ResetButton } from './resetButton';

/** One panel row for a curve parameter: the slider, its curve button and the reset button for both. */
export class CurveRow implements Mounted {
  private readonly row = element('div', 'little-row');
  private readonly slider: CurveSlider;
  private readonly picker: CurvePicker;
  private readonly reset: ResetButton;

  constructor(host: HTMLElement, model: CurveModel, edits: Edits, path: string) {
    this.slider = new CurveSlider(this.row, model);
    this.picker = new CurvePicker(this.row, model);
    this.reset = new ResetButton(this.row, edits, path);
    host.append(this.row);
  }

  public update(): void {
    this.slider.update();
    this.picker.update();
    this.reset.update();
  }

  public destroy(): void {
    this.row.remove();
  }
}
