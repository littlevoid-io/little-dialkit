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
});
