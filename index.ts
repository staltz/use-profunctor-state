import {useState, useMemo, createElement} from 'react';

export type Updater<T> = (prev: T) => T;
export type SetState<T> = (updater: Updater<T>) => void;
export type MapIn<T, S> = (outer: T) => S;
export type MapOut<T, S> = (newInner: S, prevOuter: T) => T;

export class ProfunctorState<T> {
  constructor(public state: T, public setState: SetState<T>) {}

  promap<S>(
    mapIn: MapIn<T, S>,
    mapOut: MapOut<T, S>,
    args?: any[],
  ): ProfunctorState<S> {
    const innerSetState: SetState<S> = (
      newInnerStateOrUpdate: S | Updater<S>,
    ) => {
      this.setState(prevState => {
        const innerState = mapIn(prevState);
        const newInnerState =
          typeof newInnerStateOrUpdate === 'function'
            ? (newInnerStateOrUpdate as Updater<S>)(innerState)
            : (newInnerStateOrUpdate as S);
        if (newInnerState === innerState) return prevState;
        return mapOut(newInnerState, prevState);
      });
    };
    const innerState = mapIn(this.state);
    return useMemoizedProfunctorState(innerState, innerSetState, args);
  }
}

function useMemoizedProfunctorState<T>(
  state: T,
  setState: SetState<T>,
  args?: any[],
) {
  return useMemo(
    () => {
      const profunctor = new ProfunctorState(state, setState);
      profunctor.promap = profunctor.promap.bind(profunctor);
      return profunctor;
    },
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

export type HOC = (component: any) => any;

export function withProfunctorState<T = any>(initial: T, args?: any[]): HOC {
  return (component: any) => {
    function WPS() {
      const prof = useProfunctorState(initial, args);
      return createElement(component, prof);
    }
    WPS.displayName =
      'WithProfunctorState(' +
      (component.displayName || component.name || 'Component') +
      ')';
    return WPS;
  };
}

export default useProfunctorState;
