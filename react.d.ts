declare module 'react' {
  export type Updater<T> = (prev: T) => T;
  export type SetState<T> = (updater: Updater<T>) => void;
  export function useState<T = any>(initial: T): [T, SetState<T>];
  export function useMemo<T = any>(factory: () => T, args: Array<any>): T;
}
