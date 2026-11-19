/** Data type of a dragged version row: its value is the version's id. Other drags (files, text) are not taken. */
const TYPE = 'application/x-little-version';

/** The dragged version goes before the row under the pointer's upper half, after it under the lower half. */
function after(row: HTMLElement, event: DragEvent): boolean {
  const { top, height } = row.getBoundingClientRect();
  return event.clientY > top + height / 2;
}

function start(row: HTMLElement, id: string, event: DragEvent): void {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData(TYPE, id);
  event.dataTransfer.effectAllowed = 'move';
  row.dataset.dragged = '';
}

/** Marks the edge of the row the version would drop at (`data-drop`). */
function over(row: HTMLElement, event: DragEvent): void {
  if (!event.dataTransfer?.types.includes(TYPE)) return;
  event.preventDefault();
  row.dataset.drop = after(row, event) ? 'after' : 'before';
}

/**
 * Lets the row of the saved version `id` be dragged onto the rows of other saved versions, in the same menu.
 * `move(dragged, target, after)`: the dragged version goes before or after the one it is dropped on.
 */
export function dragToSort(row: HTMLElement, id: string, move: (dragged: string, target: string, after: boolean) => void): void {
  row.draggable = true;
  row.addEventListener('dragstart', (event) => start(row, id, event));
  row.addEventListener('dragend', () => delete row.dataset.dragged);
  row.addEventListener('dragover', (event) => over(row, event));
  row.addEventListener('dragleave', () => delete row.dataset.drop);
  row.addEventListener('drop', (event) => {
    const dragged = event.dataTransfer?.getData(TYPE);
    delete row.dataset.drop;
    if (!dragged) return;
    event.preventDefault();
    move(dragged, id, after(row, event));
  });
}
