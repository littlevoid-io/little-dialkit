import { type ControlMeta, type ControlRendererProps, DialStore, mountControlRenderer } from 'dialkit/vanilla';
import { element, type Mounted } from './dom';
import type { Edits } from './edits';
import { ResetButton } from './resetButton';

/** One of DialKit's own controls, drawn by its renderer, in a row with the reset button. */
export class NativeControl implements Mounted {
  private readonly row = element('div', 'little-row');
  private readonly renderer: ReturnType<typeof mountControlRenderer>;
  private readonly reset: ResetButton;

  constructor(host: HTMLElement, private readonly panelId: string, private readonly meta: ControlMeta, edits: Edits) {
    const control = element('div', 'little-row-control');
    this.row.append(control);
    host.append(this.row);
    this.renderer = mountControlRenderer(control, this.props());
    this.reset = new ResetButton(this.row, edits, meta.path);
  }

  public update(): void {
    this.renderer.update(this.props());
    this.reset.update();
  }

  public destroy(): void {
    this.renderer.destroy();
    this.row.remove();
  }

  private props(): ControlRendererProps {
    return { panelId: this.panelId, controls: [this.meta], values: DialStore.getValues(this.panelId) };
  }
}
