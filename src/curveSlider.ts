import { clamp } from 'es-toolkit';
import type { CurveModel } from './curveModel';
import { element, type Mounted } from './dom';

/** Keys that step the value, in steps. */
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
/** Steps per key press while Shift is held. */
const COARSE = 10;
/** How long the pointer rests on the readout before a press there edits it, in milliseconds: DialKit's delay. */
const REST = 800;

/** Slider drawn at the curve position; the readout shows and edits the mapped value. */
export class CurveSlider implements Mounted {
  private readonly track = element('div', 'little-slider');
  private readonly fill = element('div', 'little-slider-fill');
  private readonly handle = element('div', 'little-slider-handle');
  private readonly input = element('input', 'little-slider-value');
  private timer: number | undefined;

  constructor(host: HTMLElement, private readonly model: CurveModel) {
    this.track.tabIndex = 0;
    this.track.role = 'slider';
    this.track.ariaLabel = model.label;
    this.track.ariaValueMin = String(model.min);
    this.track.ariaValueMax = String(model.max);
    this.input.ariaLabel = `${model.label} value`;
    this.track.append(this.fill, this.handle, element('span', 'little-slider-label', model.label), this.input);
    this.listen();
    host.append(this.track);
    this.update();
  }

  public update(): void {
    const percent = this.model.position * 100;
    const text = this.model.value.toFixed(this.model.decimals);
    this.fill.style.width = `${percent}%`;
    this.handle.style.left = `max(5px, calc(${percent}% - 9px))`;
    this.track.ariaValueNow = text;
    if (document.activeElement === this.input) return;
    this.input.value = text;
    this.input.style.width = `${text.length}ch`;
  }

  public destroy(): void {
    window.clearTimeout(this.timer);
    this.track.remove();
  }

  private listen(): void {
    this.track.addEventListener('pointerdown', (event) => this.press(event));
    this.track.addEventListener('pointermove', (event) => this.drag(event));
    this.track.addEventListener('pointerup', () => delete this.track.dataset.dragging);
    this.track.addEventListener('pointercancel', () => delete this.track.dataset.dragging);
    this.track.addEventListener('keydown', (event) => this.step(event));
    this.input.addEventListener('pointerenter', () => this.arm());
    this.input.addEventListener('pointerleave', () => this.disarm());
    this.input.addEventListener('focus', () => this.input.select());
    this.input.addEventListener('change', () => this.commit());
    this.input.addEventListener('blur', () => this.update());
    this.input.addEventListener('keydown', (event) => this.edit(event));
  }

  /** As in DialKit's slider, a press drags on the readout too: the readout takes it only once the pointer has rested there, or while it is edited. */
  private press(event: PointerEvent): void {
    if (event.button !== 0 || this.editing(event)) return;
    event.preventDefault();
    this.track.focus({ preventScroll: true });
    this.track.setPointerCapture(event.pointerId);
    this.track.dataset.dragging = '';
    this.drag(event);
  }

  private editing(event: PointerEvent): boolean {
    if (event.target !== this.input) return false;
    return 'editable' in this.input.dataset || document.activeElement === this.input;
  }

  private arm(): void {
    this.timer = window.setTimeout(() => { this.input.dataset.editable = ''; }, REST);
  }

  private disarm(): void {
    window.clearTimeout(this.timer);
    delete this.input.dataset.editable;
  }

  private drag(event: PointerEvent): void {
    if (!('dragging' in this.track.dataset)) return;
    const { left, width } = this.track.getBoundingClientRect();
    this.model.position = clamp((event.clientX - left) / width, 0, 1);
    // The store stays silent while the snapped value is unchanged; the handle still follows the pointer.
    this.update();
  }

  private step(event: KeyboardEvent): void {
    if (event.target === this.input) return;
    if (event.key === 'Enter') return this.input.focus();
    const value = this.keyValue(event);
    if (value === undefined) return;
    event.preventDefault();
    this.model.value = value;
  }

  private keyValue(event: KeyboardEvent): number | undefined {
    if (event.key === 'Home') return this.model.min;
    if (event.key === 'End') return this.model.max;
    const steps = STEPS[event.key];
    if (steps === undefined) return undefined;
    return this.model.value + steps * this.model.step * (event.shiftKey ? COARSE : 1);
  }

  private commit(): void {
    const value = Number.parseFloat(this.input.value);
    if (!Number.isNaN(value)) this.model.value = value;
  }

  /** Enter commits; Escape drops the typed text. Both leave the field, which redraws it. */
  private edit(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    if (event.key === 'Escape') this.input.value = this.model.value.toFixed(this.model.decimals);
    this.input.blur();
  }
}
