import { Set } from 'immutable';

function pathToKey(path) {
  return path.join('.');
}

function keyToPath(key) {
  return key.split('.').filter(k => k.split(',').length === 1);
}

export default ({
  state,
  lastState,
  lastResult,
  refs
}) => {
  const vistedPaths = [];

  const joinRefs = (data, path = [], force = false) => {
    if (!force && state.getIn(path) === lastState.getIn(path)) {
      return lastResult.getIn(path);
    }

    if (lastState.size) {
      vistedPaths.push(pathToKey(path));
    }

    if (data instanceof Array) {
      const key = pathToKey(data);
      if (refs[key]) {
        refs[key].paths = refs[key].paths.add(pathToKey(path))
        return refs[key].result;
      }

      const result = joinRefs(state.getIn(data), data, force);
      refs[key] = { key: data, paths: Set.of(pathToKey(path)), result };
      return result;
    }

    if (typeof data === 'object') {
      return data.map((d, k) => {
        return joinRefs(d, [...path, k], force);
      });
    }

    return data;
  };

  const joinDependencies = (data, key) => {
    const ref = refs[key];
    if (!ref) {
      return;
    }

    ref.result = joinRefs(data.getIn(ref.key), ref.key, true);
    ref.paths.forEach(pathKey => {
      const path = keyToPath(pathKey);
      data.setIn(path, ref.result);
      joinDependencies(data, pathToKey(path.slice(0, -1)));
    });
  };

  return joinRefs(state).withMutations(result => {
    vistedPaths.forEach(path => {
      joinDependencies(result, path);
    });
  });
};
