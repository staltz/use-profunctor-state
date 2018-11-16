# Profunctor State Hook

*React Hook for state management with Profunctor Optics*

A simple and small (2KB!) approach to state management in React using functional lenses (a type of profunctor optics). A lens is made of two functions: **get** (like selectors in Redux, or computed values in MobX) and **set** (the opposite of a selector, creates new parent state). This way, parent state and child state are kept in sync, updating back and forth automatically.

```
npm install --save @staltz/use-profunctor-state
```

## Example

Suppose your app handles temperatures in Fahrenheit, but one component works only with Celsius. You can create a conversion layer between those two with `promap(get, set)`.

Open this also in a [CodeSandbox](https://codesandbox.io/s/3vz5vl5p5).

```js
function App() {
  const initialState = {fahrenheit: 70, other: {}}

  const appProf = useProfunctorState(initialState);
  // or:
  // const {state, setState, promap} = useProfunctorState(initialState);

  const celsiusProf = appProf.promap(
    state => fToC(state.fahrenheit),
    (celsius, state) => ({ ...state, fahrenheit: cToF(celsius) })
  );

  return (
    <div>
      <div>Global app state: {JSON.stringify(appProf.state)}</div>
      <CelsiusThermometer {...celsiusProf} />
    </div>
  );
}
```

Because promap is composable, you can also split the conversion layer into multiple parts:

```js
const celsiusProf = appProf
  .promap(s => s.fahrenheit, (f, s) => ({ ...s, fahrenheit: f }))
  .promap(fToC, cToF);
```

The CelsiusThermometer component received props `state`, `setState` and `promap` from the spread of `celsiusProf`:

- `state`: in this case it's a number representing celsius
- `setState`: does what you think it does!
- `promap`: use this if CelsiusThermometer would have children components

```js
function CelsiusThermometer({ state, setState, promap }) {
  const onColder = () => setState(prev => prev - 5);
  const onHotter = () => setState(prev => prev + 5);
  return (
    <div>
      <button onClick={onColder}>Colder</button>
      <button onClick={onHotter}>Hotter</button>
      <Thermometer value={state} max="100" steps="4" format="°C" />
    </div>
  );
}
```

## Benefits

#### Simpler architecture

- Global app state == Props == Local component state
- No actions, no reducers, no dispatch, no store
- Selector/unselector conversion layers in the component tree

#### Familiar

- `state` and `setState` work just like you would assume
- Easy to migrate your apps to use profunctors

#### Fractal

- Build the parent components like you build the smaller components
- Same pattern applies to all components, both Presentational and Container

#### Decoupling

- Every child component assumes nothing about its parent component
- Child components with props `{state, setState, promap}` can be published as-is to NPM

#### Functional

- Lenses are composable and operate immutably, just like Redux selectors
- Chain `.promap` calls like you would chain `.map` calls
- Backed by [mathematical theory](https://github.com/hablapps/DontFearTheProfunctorOptics/)

#### Performance similar to Redux

- Sprinkle `React.memo()` here and there to avoid full-app rerenders

#### Small: 2 KB and 80 lines of code

#### TypeScript support

## Downsides

Compared to Redux and similar (ngrx, Vuex):

- No actions means no support for Redux DevTools
- Hooks are still in Alpha, and not yet supported in React Native
- This library itself is not used in production yet

## API

#### `useProfunctorState(initial, [args])`

```js
const {state, setState, promap} = useProfunctorState(initial);
```

React hook that should be called in the body of a function component. Returns a profunctor state object, which consists of three parts:

- `state`: the data, initially this will be `initial`
- `setState`: works just like React's traditional setState
  - `setState(newState)` or
  - `setState(prev => ...)`
- `promap(get, set)`: creates a new profunctor state object based on the current one, given two functions:
  - `get: parentState => childState`
  - `set: (newChild, oldParent) => newParent`

Promap also alternatively supports a lens object, which is simply `promap({get, set})` instead of `promap(get, set)`. This is useful in case you want to publish a lens object elsewhere and simply pass it into the promap.

Underneath, this hook uses `useState` and `useMemo`. The second argument (optional) `[args]` is an array of inputs that dictates when to recompute the memoized profunctor state object, just like with `useMemo(_, args)`. By default, the args array is `[state]`.

#### `withProfunctorState(ProComponent, initial, [args])`

Higher-order component that does the same as `useProfunctorState`, but accepts as input a Pro Component (component that wants props `state`, `setState`, `promap`), and returns a new component that calls `useProfunctorState` internally.

## Pro Components

A Pro Component is any component that expects all or some of these props `{state, setState, promap}`. When you use this library, you will begin writing Pro Components to consume pieces of the global app state. For instance, in the example above, the CelsiusThermometer was a Pro Component:

```js
function CelsiusThermometer({ state, setState, promap }) {
  const onColder = () => setState(prev => prev - 5);
  const onHotter = () => setState(prev => prev + 5);
  return (
    <div>
      <button onClick={onColder}>Colder</button>
      <button onClick={onHotter}>Hotter</button>
      <Thermometer value={state} max="100" steps="4" format="°C" />
    </div>
  );
}
```

A Pro Component can put its local state in the `state` prop using `setState`. You can also think of this `setState` as `setProps`. Writing components in this style is familiar, because `setState` works just like the traditional API. But now we have the added benefit that Pro Components can be published as-is (they are just functions!) to NPM, and there is no need to import `@staltz/use-profunctor-state` as a dependency of a Pro Component. This way you get encapsulated and composable pieces of state management that can be shared across applications. Pro Components can either be presentational or logic-heavy container components.

PS: it might be good to apply `React.memo()` on every Pro Component by default.

## FAQ

#### What about performance?

By default, each child's `setState` will cause a top-level state update which will rerender the entire hierarchy below. This is a bad thing, but it's not unlike Redux, where you need to carefully design `shouldComponentUpdate`. With profunctor state, just add `React.memo` to a Pro Component and that should do the same as `shouldComponentUpdate`, the memo will shallow compare the props (i.e. `state`, `setState`, `promap`, although only `state` is interesting during updates).

Check [this CodeSandbox](https://codesandbox.io/s/l5w1rpnv17) with `React.memo` usage, where background colors change upon re-render.

#### Can I still have truly internal local state?

Yes. Nothing stops you from adding a `useState` hook so you can have truly internal state in a Pro Component, such as:

```diff
 function CelsiusThermometer({ state, setState, promap }) {
   const onColder = () => setState(prev => prev - 5);
   const onHotter = () => setState(prev => prev + 5);
+  const [steps, setSteps] = useState(4);
   return (
     <div>
       <button onClick={onColder}>Colder</button>
       <button onClick={onHotter}>Hotter</button>
-      <Thermometer value={state} max="100" steps="4" format="°C" />
+      <Thermometer value={state} max="100" steps={steps} format="°C" />
     </div>
   );
 }
```

#### Is this production-ready?

Theoretically, yes, it was designed after [Cycle State](https://cycle.js.org/api/state.html). The community has been using functional lenses in Cycle State (a.k.a. [cycle-onionify](https://github.com/staltz/cycle-onionify/)) for at least a year, also in production. Lenses are also not new, they're in JS libraries like [Ramda](http://ramdajs.com/) and [Partial Lenses](https://github.com/calmm-js/partial.lenses), but much more common in functional languages like Haskell.

In practice, this specific library has not been used in production (neither have React hooks!), so you shouldn't go right ahead and convert any app to this style. That said, this was a conference-driven developed library, just like Redux was.

#### Why `@staltz/use-profunctor-state` and not `use-profunctor-state`?

First, I want to wait til React hooks are official. Second, I don't want to pollute the NPM registry. Third, I believe most people should author packages under their own scope (just like in GitHub!), so that forks can indicate who is maintaining the package, because I don't intend to maintain this package, although it's small and might not even need maintenance.

## License

MIT
