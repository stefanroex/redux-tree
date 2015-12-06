import { Set } from 'immutable';
import {
  pathToRef,
  refToPath,
  isRef
} from './utils';

function joinRefs(node, path = [], options) {
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

  if (Set.isSet(node)) {
    return node;
  }

  if (isRef(node)) {
    const keyPath = refToPath(node);
    if (refs[node]) {
      refs[node].paths = refs[node].paths.add(pathToRef(path))
      return refs[node].result;
    }

    const result = joinRefs(state.getIn(keyPath), keyPath, options);
    refs[node] = { key: keyPath, paths: Set.of(pathToRef(path)), result };
    return result;
  }

  if (typeof node === 'object') {
    return node.map((d, k) => {
      return joinRefs(d, [...path, k], options);
    });
  }

  return node;
};

function joinDependencies({state, key, options}) {
  const ref = options.refs[key];
  if (!ref) {
    return state;
  }

  ref.result = joinRefs(state.getIn(ref.key), ref.key, {
    ...options,
    force: true
  });

  return ref.paths.reduce((result, pathKey) => {
    const path = refToPath(pathKey);
    return joinDependencies({
      state: result.setIn(path, ref.result),
      key: pathToRef(path.slice(0, -1)),
      options
    });
  }, state);
};

function updateDependencies(state, options) {
  return options.vistedPaths.reduce((result, path) => (
    joinDependencies({
      state: result,
      key: path,
      options
    })
  ), state);
};

export default options => {
  const state = joinRefs(options.state, [], options);
  return updateDependencies(state, options);
};
