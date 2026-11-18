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
