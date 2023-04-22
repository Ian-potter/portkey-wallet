import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import { RootCommonState } from '../types/store';
import { DependencyList, useCallback, useRef, useEffect } from 'react';

export { useAppEOASelector } from './hooks-eoa/index';
export { useAppCASelector } from './hooks-ca/index';

export const useAppCommonDispatch: () => any = useDispatch;
export const useAppCommonSelector: TypedUseSelectorHook<RootCommonState> = useSelector;

export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
  deps: DependencyList,
  delay = 500,
) {
  const lock = useRef<number>();
  return useCallback((...args: any[]) => {
    if (!callback) return;
    const now = Date.now();
    if (lock.current && lock.current + delay > now) return;
    lock.current = now;
    return callback(...args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
  deps: DependencyList,
  delay = 500,
) {
  const timer = useRef<NodeJS.Timeout | number>();
  const callbackRef = useRef<T>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: any[]) => {
    if (!callbackRef.current) return;
    timer.current && clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!callbackRef.current) return;
      callbackRef.current(...args);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
