import { type ControlMeta, type ControlRendererProps, DialStore, mountControlRenderer } from 'dialkit/vanilla';
import { element, type Mounted } from './dom';
import type { Edits } from './edits';
import { RowButtons } from './rowButtons';
import type { Spread } from './spread';

/** One of DialKit's own controls, drawn by its renderer, in a row with its buttons (reset, apply to all versions). An action holds no value: no buttons. */
export class NativeControl implements Mounted {
  private readonly row = element('div', 'little-row');
  private readonly renderer: ReturnType<typeof mountControlRenderer>;
  private readonly buttons?: RowButtons;

  constructor(host: HTMLElement, private readonly panelId: string, private readonly meta: ControlMeta, edits: Edits, spread: Spread) {
    const control = element('div', 'little-row-control');
    this.row.append(control);
    host.append(this.row);
    this.renderer = mountControlRenderer(control, this.props());
    if (meta.type !== 'action') this.buttons = new RowButtons(this.row, edits, spread, meta.path);
  }

  public update(): void {
    this.renderer.update(this.props());
    this.buttons?.update();
  }

  public destroy(): void {
    this.renderer.destroy();
    this.row.remove();
  }

  private props(): ControlRendererProps {
    return { panelId: this.panelId, controls: [this.meta], values: DialStore.getValues(this.panelId) };
  }
}
