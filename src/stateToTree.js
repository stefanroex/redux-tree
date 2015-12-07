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

function findRefs(node, path = [], { state, lastState }, result, reff) {
  if (typeof node === 'object') {
    return node.reduce((r, d, k) => {
      const p = path.concat([k]);
      const ref = pathToRef(p);

      if (state.getIn(p) === lastState.getIn(p)) {
        return r;
      }

      // need to fix ref-keys
      if (Set.isSet(d)) {
        return r;
      }

      if (isRef(d)) {
        if (!r.refs[d]) {
          r.refs[d] = {};
        }
        r.refs[d][ref] = true;

        if (!r.reverseRefs[ref]) {
          r.reverseRefs[ref] = {};
        }
        r.reverseRefs[ref][d] = true;
        r.reverseSeen[ref] = true;
      }

      if (r.refs[ref]) {
        r.seen[ref] = true;
      }

      if (typeof node === 'object') {
        findRefs(d, p, { state, lastState }, r);
      }
      return r;
    }, result);
  }
};

// function createTree(node, path = [], options, refInfo) {
//   const {
//     state,
//     lastState,
//     lastTree,
//   } = options;
//
//   if (state.getIn(path) === lastState.getIn(path)) {
//     return state.getIn(path);
//   }
//
//   if (isRef(node)) {
//     console.log(refInfo);
//     console.log(node);
//   }
//
//   if (typeof node === 'object') {
//     return node.map((d, k) => {
//       return createTree(d, [...path, k], options, refInfo);
//     });
//   }
//
//   return node;
// };

function createTree({state, lastState}, refInfo) {
  return state.withMutations(result => {
    Object.keys(refInfo.seen).forEach(sourceRef => {
      Object.keys(refInfo.refs[sourceRef]).forEach(nodeRef => {
        const source = refToPath(sourceRef);
        const node = refToPath(nodeRef);
        result.setIn(node, result.getIn(source));
      });
    });
  });
}

function findDependencies(refInfo) {
  return refInfo;
};

export default options => {
  if (options.state === options.lastState) {
    return options.lastTree;
  }

  const refInfo = findRefs(options.state, [], options, {
    refs: options.newRefs,
    reverseRefs: options.reverseRefs,
    seen: {},
    reverseSeen: {}
  });
  refInfo.dependencies = {};
  return createTree(options, findDependencies(refInfo));
};
