import { Map } from 'immutable';
import stateToTree from './stateToTree';

export default () => {
  let lastState = Map();
  let lastResult = null;
  let refs = {};

  return state => {
    lastResult = stateToTree({
      state,
      lastState,
      lastResult,
      refs
    });
    lastState = state;
    return lastResult;
  };
}
