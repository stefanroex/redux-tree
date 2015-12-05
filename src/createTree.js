import { Map } from 'immutable';
import stateToTree from './stateToTree';

export default () => {
  const refs = {};
  let lastState = Map();
  let lastResult = null;

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
