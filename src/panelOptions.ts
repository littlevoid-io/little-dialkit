import type { ActionChoice } from './actions';
import type { CanvasSource } from './capture';
import type { CreateDialOptions, DialMode, DialRootOptions, DialTheme } from 'dialkit/vanilla';

interface CommonOptions extends CreateDialOptions {
  /** Names the panel in DialKit's store and in the storage keys. */
  id: string;
  theme?: DialTheme;
  /** Labels by control path (`'blur.radius'`), in place of the ones DialKit derives from the keys. */
  labels?: Record<string, string>;
  /** Buttons of the action row under the toolbar (save, save as new version, reset, export to a file): all, unless set to false. */
  actions?: ActionChoice;
  /** The canvas the screenshot and record buttons capture, asked on every capture. Left out: the largest visible canvas of the page. */
  canvas?: CanvasSource;
}

/** A panel docked into `target`, always open. */
export interface DockedOptions extends CommonOptions {
  mode?: Extract<DialMode, 'inline'>;
  /** The element the panel is docked into. */
  target: HTMLElement;
}

/**
 * A panel above the page, dragged by its header and collapsed to an icon, as DialKit's own.
 * A position or open state saved in localStorage wins over `position` and `defaultOpen`.
 */
export interface FloatingOptions extends CommonOptions, Pick<DialRootOptions, 'position' | 'defaultOpen' | 'onOpenChange'> {
  mode: Extract<DialMode, 'popover'>;
  /** Defaults to `document.body`. */
  target?: HTMLElement;
}

export type PanelOptions = DockedOptions | FloatingOptions;
