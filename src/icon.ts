import { element } from './dom';

const SVG = 'http://www.w3.org/2000/svg';

/** Stroked paths in a 24 x 24 box. */
export const ICONS = {
  undo: ['M3 7v6h6', 'M3 13a9 9 0 0 1 15-4.7 9 9 0 0 1 3 6.7'],
  redo: ['M21 7v6h-6', 'M21 13a9 9 0 0 0-15-4.7 9 9 0 0 0-3 6.7'],
  reset: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  save: ['M20 6 9 17l-5-5'],
  rename: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'],
  remove: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  add: ['M12 5v14', 'M5 12h14'],
  expand: ['m6 9 6 6 6-6'],
  versions: ['M12 2 2 7l10 5 10-5-10-5Z', 'm2 12 10 5 10-5', 'm2 17 10 5 10-5'],
} satisfies Record<string, string[]>;

export function icon(paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('little-icon');
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** Button showing an icon; `label` is its tooltip and accessible name. */
export function iconButton(className: string, label: string, paths: string[], onClick: () => void): HTMLButtonElement {
  const button = element('button', className);
  button.type = 'button';
  button.title = label;
  button.ariaLabel = label;
  button.append(icon(paths));
  button.addEventListener('click', onClick);
  return button;
}
