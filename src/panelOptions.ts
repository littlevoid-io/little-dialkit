import type { CreateDialOptions, DialMode, DialRootOptions, DialTheme } from 'dialkit/vanilla';

interface CommonOptions extends CreateDialOptions {
  /** Names the panel in DialKit's store and in the storage keys. */
  id: string;
  theme?: DialTheme;
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
