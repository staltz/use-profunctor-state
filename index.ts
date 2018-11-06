import {useState, useMemo} from 'react';

export type Updater<T> = (prev: T) => T;
export type SetState<T> = (updater: Updater<T>) => void;
export type MapIn<T, S> = (outer: T) => S;
export type MapOut<T, S> = (prevOuter: T, newInner: S) => T;

export class ProfunctorState<T> {
  constructor(public state: T, public setState: SetState<T>) {}

  promap<S>(mapIn: MapIn<T, S>, mapOut: MapOut<T, S>): ProfunctorState<S> {
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
        return mapOut(prevState, newInnerState);
      });
    };
    const innerState = mapIn(this.state);
    return useMemoizedProfunctorState(innerState, innerSetState);
  }
}

function useMemoizedProfunctorState<T>(state: T, setState: SetState<T>) {
  return useMemo(
    () => {
      const profunctor = new ProfunctorState(state, setState);
      profunctor.promap = profunctor.promap.bind(profunctor);
      return profunctor;
    },
    [JSON.stringify(state)],
  );
}

export default function useProfunctorState<T = any>(
  initial: T,
): ProfunctorState<T> {
  const [state, setState] = useState<T>(initial);
  return useMemoizedProfunctorState(state, setState);
}
