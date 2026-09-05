import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { loadingStore, useIsAppLoading } from '../loading.store';

describe('loading.store', () => {
  it('reflète une tâche unique', () => {
    const { result } = renderHook(() => useIsAppLoading());
    expect(result.current).toBe(false);

    let end: (() => void) | undefined;
    act(() => {
      end = loadingStore.beginLoadingTask();
    });
    expect(result.current).toBe(true);

    act(() => {
      end?.();
    });
    expect(result.current).toBe(false);
  });

  it('ne redevient false que lorsque TOUTES les tâches sont terminées', () => {
    const { result } = renderHook(() => useIsAppLoading());

    let endA: () => void;
    let endB: () => void;
    act(() => {
      endA = loadingStore.beginLoadingTask();
      endB = loadingStore.beginLoadingTask();
    });
    expect(result.current).toBe(true);

    act(() => {
      endA();
    });
    expect(result.current).toBe(true); // endB toujours active

    act(() => {
      endB();
    });
    expect(result.current).toBe(false);
  });

  it('la fonction de clôture est idempotente', () => {
    const { result } = renderHook(() => useIsAppLoading());

    let end: () => void;
    act(() => {
      end = loadingStore.beginLoadingTask();
    });
    act(() => {
      end();
      end(); // deuxième appel : ne doit pas décrémenter deux fois (compteur ne peut pas devenir négatif)
    });
    expect(result.current).toBe(false);
  });
});
