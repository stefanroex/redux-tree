import { Set } from 'immutable';
import { pathToRef, refToPath, isRef } from './utils';

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
      vistedPaths.push(pathToRef(path));
    }

    if (Set.isSet(data)) {
      return data;
    }

    if (isRef(data)) {
      const keyPath = refToPath(data);
      if (refs[data]) {
        refs[data].paths = refs[data].paths.add(pathToRef(path))
        return refs[data].result;
      }

      const result = joinRefs(state.getIn(keyPath), keyPath, force);
      refs[data] = { key: keyPath, paths: Set.of(pathToRef(path)), result };
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
      const path = refToPath(pathKey);
      data.setIn(path, ref.result);
      joinDependencies(data, pathToRef(path.slice(0, -1)));
    });
  };

  return joinRefs(state).withMutations(result => {
    vistedPaths.forEach(path => {
      joinDependencies(result, path);
    });
  });
};
