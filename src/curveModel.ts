import { type ControlMeta, DialStore } from 'dialkit/vanilla';
import { type CurveName, evaluate, invert } from './curves';

/** One curve parameter in the store: its value, its curve and the slider position between them. */
export class CurveModel {
  public readonly label: string;
  public readonly min: number;
  public readonly max: number;
  public readonly step: number;
  private readonly valuePath: string;
  private readonly curvePath: string;
  /** The last slider position, with the value and curve it belongs to. */
  private held = { position: 0, value: Number.NaN, curve: '' };

  constructor(private readonly panelId: string, meta: ControlMeta) {
    const { min, max, step } = meta.children?.[0] ?? {};
    if (min === undefined || max === undefined || step === undefined) throw new Error(`"${meta.path}" has no slider range`);
    this.label = meta.label;
    this.min = min;
    this.max = max;
    this.step = step;
    this.valuePath = `${meta.path}.value`;
    this.curvePath = `${meta.path}.curve`;
  }

  public get value(): number {
    return DialStore.getValue(this.panelId, this.valuePath) as number;
  }

  public set value(value: number) {
    DialStore.updateValue(this.panelId, this.valuePath, value);
  }

  public get curve(): CurveName {
    return DialStore.getValue(this.panelId, this.curvePath) as CurveName;
  }

  /** The value keeps; the slider position moves. */
  public set curve(name: CurveName) {
    DialStore.updateValue(this.panelId, this.curvePath, name);
  }

  /** Digits after the decimal point of the step. */
  public get decimals(): number {
    return String(this.step).split('.')[1]?.length ?? 0;
  }

  /** Slider position (0..1). A dragged position is kept while the store holds the value it produced. */
  public get position(): number {
    const { value, curve } = this;
    if (this.held.value !== value || this.held.curve !== curve) {
      this.held = { position: invert(curve, (value - this.min) / (this.max - this.min)), value, curve };
    }
    return this.held.position;
  }

  /** The store clamps the value and snaps it to the step. */
  public set position(position: number) {
    this.value = this.min + evaluate(this.curve, position) * (this.max - this.min);
    this.held = { position, value: this.value, curve: this.curve };
  }
}
