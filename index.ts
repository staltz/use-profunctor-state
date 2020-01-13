import {useState, useMemo, createElement} from 'react';

export type Updater<T> = (prev: T) => T;
export type SetState<T> = (updater: Updater<T>) => void;
export type Lens<T, S> = {get: Getter<T, S>; set: Setter<T, S>};
export type Getter<T, S> = (outer: T) => S;
export type Setter<T, S> = (newInner: S, prevOuter: T) => T;

interface Promap<T> {
  <S>(lens: Lens<T, S>, args?: any[]): ProfunctorState<S>;
  <S>(get: Getter<T, S>, set: Setter<T, S>, args?: any[]): ProfunctorState<S>;
}

export class ProfunctorState<T> {
  constructor(public state: T, public setState: SetState<T>) {}
  promap: Promap<T> = <S>(
    a: Getter<T, S> | Lens<T, S>,
    b?: Setter<T, S> | any[],
    c?: any[],
  ): ProfunctorState<S> => {
    const get = typeof a === 'object' ? a.get : a;
    const set = typeof a === 'object' ? a.set : (b as Setter<T, S>);
    const args = typeof a === 'object' ? (b as any[]) : c;
    const innerSetState: SetState<S> = (
      newInnerStateOrUpdate: S | Updater<S>,
    ) => {
      this.setState(prevState => {
        const innerState = get(prevState);
        const newInnerState =
          typeof newInnerStateOrUpdate === 'function'
            ? (newInnerStateOrUpdate as Updater<S>)(innerState)
            : (newInnerStateOrUpdate as S);
        if (newInnerState === innerState) return prevState;
        return set(newInnerState, prevState);
      });
    };
    const innerState = get(this.state);
    return useMemoizedProfunctorState(innerState, innerSetState, args);
  }
}

function useMemoizedProfunctorState<T>(
  state: T,
  setState: SetState<T>,
  args?: any[],
) {
  return useMemo(
    () => new ProfunctorState(state, setState),
    args ? args : [state],
  );
}

export function useProfunctorState<T = any>(
  initial: T,
  args?: any[],
): ProfunctorState<T> {
  const [state, setState] = useState<T>(initial);
  return useMemoizedProfunctorState(state, setState, args);
}

export function withProfunctorState<T = any>(
  Component: any,
  initial: T,
  args?: any[],
) {
  function WPS() {
    const prof = useProfunctorState(initial, args);
    return createElement(Component, prof);
  }
  WPS.displayName =
    'WithProfunctorState(' +
    (Component.displayName || Component.name || 'Component') +
    ')';
  return WPS;
}

export default useProfunctorState;
