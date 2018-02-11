import { combineReducers } from 'redux';
import { PREFERENCES_CHANGED, VISIBILITIES_CHANGED } from './actions';

const INITIAL_STATE = {
  preferences: {
    'search-descriptions': false,
  },
  visibilities: { },
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case PREFERENCES_CHANGED:
      return { ...state, preferences: action.payload };
    case VISIBILITIES_CHANGED:
      return { ...state, visibilities: action.payload };
    default:
      return state;
  }
}
