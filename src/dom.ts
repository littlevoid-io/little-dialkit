/** A mounted piece of the panel: redrawn from the store on every change. */
export interface Mounted {
  update(): void;
  destroy(): void;
}

/** Element with a class and optional text. */
export function element<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className: string, text = ''): HTMLElementTagNameMap[Tag] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

/** Space between an anchor and the menu below it, and between the menu and the viewport's edge, in pixels. */
const OFFSET = 4;

/** Places a top-layer menu under `anchor`, at its width, no taller than the viewport leaves. */
export function placeBelow(menu: HTMLElement, anchor: HTMLElement): void {
  const { left, bottom, width } = anchor.getBoundingClientRect();
  const top = bottom + OFFSET;
  Object.assign(menu.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${innerHeight - top - OFFSET}px` });
}

export function textButton(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const button = element('button', className, text);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}
