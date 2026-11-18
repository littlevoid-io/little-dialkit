import { debounce } from 'es-toolkit';
import { temporal } from 'zundo';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

/** Undo steps kept. */
const LIMIT = 100;
/** Changes closer together than this (slider drags, a load of many values) form one undo step. */
const BURST_MS = 400;

interface Burst {
  cancel: () => void;
}

function same(a: object, b: object): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createHistoryStore<T extends object>(initial: T, storageKey: string, onBurst: (burst: Burst) => void) {
  return createStore<T>()(
    temporal(() => structuredClone(initial), {
      limit: LIMIT,
      equality: same,
      // Leading edge: the state before a burst of changes is recorded once, the rest of the burst joins that step.
      handleSet: (handleSet) => {
        const burst = debounce(handleSet, BURST_MS, { edges: ['leading'] });
        onBurst(burst);
        return burst;
      },
      wrapTemporal: (initializer) =>
        persist(initializer, {
          name: storageKey,
          storage: createJSONStorage(() => sessionStorage),
          partialize: ({ pastStates, futureStates }) => ({ pastStates, futureStates }),
        }),
    }),
  );
}

/** Undo / redo snapshots of plain values (zundo); past and future steps persist in sessionStorage. */
export class EditHistory<T extends object> {
  private store: ReturnType<typeof createHistoryStore<T>>;
  private burst?: Burst;

  /** `initial`: the current values; earlier steps of this tab session come from sessionStorage (`storageKey`). */
  constructor(initial: T, storageKey: string) {
    this.store = createHistoryStore(initial, storageKey, (burst) => (this.burst = burst));
  }

  /** Records the values if they changed; a burst of changes is one step. */
  public record(values: T): void {
    if (same(values, this.store.getState())) return;
    this.store.setState(structuredClone(values), true);
  }

  /** The previous values, or undefined at the first step. */
  public undo(): T | undefined {
    return this.step(this.canUndo, () => this.store.temporal.getState().undo());
  }

  /** The values before the last undo, or undefined after the last step. */
  public redo(): T | undefined {
    return this.step(this.canRedo, () => this.store.temporal.getState().redo());
  }

  public get canUndo(): boolean {
    return this.store.temporal.getState().pastStates.length > 0;
  }

  public get canRedo(): boolean {
    return this.store.temporal.getState().futureStates.length > 0;
  }

  /** Calls the listener after every change of the steps: record, undo, redo. Returns the unsubscribe function. */
  public subscribe(listener: () => void): () => void {
    return this.store.temporal.subscribe(listener);
  }

  /** Ends the current burst: the next change after an undo or redo is a step of its own. */
  private step(available: boolean, move: () => void): T | undefined {
    if (!available) return undefined;
    this.burst?.cancel();
    move();
    return structuredClone(this.store.getState());
  }
}
