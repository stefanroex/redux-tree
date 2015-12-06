import { Set } from 'immutable';
import { pathToRef, refToPath, isRef } from './utils';

const joinRefs = (data, path = [], options) => {
  const {
    vistedPaths,
    state,
    lastState,
    lastTree,
    refs,
    force = false
  } = options;

  if (!force && state.getIn(path) === lastState.getIn(path)) {
    return lastTree.getIn(path);
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

    const result = joinRefs(state.getIn(keyPath), keyPath, options);
    refs[data] = { key: keyPath, paths: Set.of(pathToRef(path)), result };
    return result;
  }

  if (typeof data === 'object') {
    return data.map((d, k) => {
      return joinRefs(d, [...path, k], options);
    });
  }

  return data;
};

export default options => {
  options.vistedPaths = [];

  return joinRefs(options.state, [], options).withMutations(result => {
    options.vistedPaths.forEach(path => {
      joinDependencies(result, path);
    });
  });
};
