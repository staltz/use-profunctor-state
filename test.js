const test = require('tape');
const React = require('react');
const {default: useProfunctorState} = require('./index');
const TestRenderer = require('react-test-renderer');

test('updates component state', t => {
  t.plan(6);
  function Input({callbag}) {
    const my = useProfunctorState({age: 20});
    React.useEffect(() => {
      callbag(0, (t, d) => {
        if (t === 1) my.setState(() => ({age: d}));
      });
      () => {
        callbag(2);
      };
    }, []);
    return React.createElement('span', null, `My age is ${my.state.age}`);
  }

  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();
  const elem = React.createElement(Input, {callbag});
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 20', 'should show 20');

  callbag(1, 30);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 30', 'should show 30');

  testRenderer.unmount();
  t.end();
});

test('profunctor identity', t => {
  t.plan(6);
  function Input({callbag}) {
    const my = useProfunctorState({age: 20}).promap(x => x, x => x);
    React.useEffect(() => {
      callbag(0, (t, d) => {
        if (t === 1) my.setState(() => ({age: d}));
      });
      () => {
        callbag(2);
      };
    }, []);
    return React.createElement('span', null, `My age is ${my.state.age}`);
  }

  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();
  const elem = React.createElement(Input, {callbag});
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 20', 'should show 20');

  callbag(1, 30);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 30', 'should show 30');

  testRenderer.unmount();
  t.end();
});

test('profunctor composition', t => {
  t.plan(8);
  const f = outer => outer.age;
  const g = age => age + 100;
  const h = age100 => age100 - 100;
  const i = age => ({age});
  function Input({callbag}) {
    const level0 = useProfunctorState({age: 20});
    const level1 = level0.promap(f, i);
    const level2 = level1.promap(g, h);
    React.useEffect(() => {
      callbag(0, (t, d) => {
        if (t === 1) level2.setState(() => d);
      });
      () => {
        callbag(2);
      };
    }, []);
    t.equal(g(f(level0.state)), level2.state, 'g . f compose');
    return React.createElement('span', null, `My age is ${level2.state}`);
  }

  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();
  const elem = React.createElement(Input, {callbag});
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 120', 'should show 120');

  callbag(1, 130);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 130', 'should show 130');

  testRenderer.unmount();
  t.end();
});
