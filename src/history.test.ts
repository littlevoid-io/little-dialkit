import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditHistory } from './history';

const KEY = 'history-test';

function createHistory(value: number): EditHistory<{ value: number }> {
  return new EditHistory({ value }, KEY);
}

describe('EditHistory', () => {
  beforeEach(() => {
    const items = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value), removeItem: (key: string) => items.delete(key) });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('records a burst of changes as one step', () => {
    const history = createHistory(1);
    history.record({ value: 2 });
    history.record({ value: 3 });
    vi.advanceTimersByTime(1000);
    history.record({ value: 4 });
    expect(history.undo()?.value).toBe(3);
    expect(history.undo()?.value).toBe(1);
    expect(history.undo()).toBeUndefined();
  });

  it('redoes undone steps until a new change', () => {
    const history = createHistory(1);
    history.record({ value: 2 });
    history.undo();
    expect(history.redo()?.value).toBe(2);
    history.undo();
    history.record({ value: 5 });
    expect(history.redo()).toBeUndefined();
    expect(history.undo()?.value).toBe(1);
  });

  it('ignores unchanged values', () => {
    const history = createHistory(1);
    history.record({ value: 1 });
    expect(history.undo()).toBeUndefined();
  });

  it('keeps the steps in sessionStorage', () => {
    createHistory(1).record({ value: 2 });
    expect(createHistory(2).undo()?.value).toBe(1);
  });

  it('reports whether there is a step to undo or redo', () => {
    const history = createHistory(1);
    expect([history.canUndo, history.canRedo]).toEqual([false, false]);
    history.record({ value: 2 });
    expect([history.canUndo, history.canRedo]).toEqual([true, false]);
    history.undo();
    expect([history.canUndo, history.canRedo]).toEqual([false, true]);
    history.record({ value: 3 });
    expect([history.canUndo, history.canRedo]).toEqual([true, false]);
  });

  it('notifies subscribers of record, undo and redo until they unsubscribe', () => {
    const history = createHistory(1);
    const listener = vi.fn();
    const unsubscribe = history.subscribe(listener);
    history.record({ value: 2 });
    history.undo();
    history.redo();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    history.undo();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('reports the steps restored from sessionStorage', () => {
    createHistory(1).record({ value: 2 });
    const history = createHistory(2);
    expect([history.canUndo, history.canRedo]).toEqual([true, false]);
  });
});
