import { Map } from 'immutable';
import stateToTree from './stateToTree';

export default () => {
  const refs = {};
  const newRefs = {};
  const reverseRefs = {};
  let lastState = Map();
  let lastTree = null;

  return state => {
    lastTree = stateToTree({
      vistedPaths: [],
      state,
      lastState,
      lastTree,
      refs,
      newRefs,
      reverseRefs
    });
    lastState = state;
    return lastTree;
  };
}
