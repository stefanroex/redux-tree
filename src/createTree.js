import { Map } from 'immutable';
import stateToTree from './stateToTree';

export default () => {
  const refs = {};
  let lastState = Map();
  let lastTree = null;

  return state => {
    lastTree = stateToTree({
      vistedPaths: [],
      state,
      lastState,
      lastTree,
      refs
    });
    lastState = state;
    return lastTree;
  };
}
