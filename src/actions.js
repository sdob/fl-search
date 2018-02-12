import $ from 'jquery';
import { IDS } from './ids';

export const PREFERENCES_CHANGED = 'storage/PREFERENCES_CHANGED';
export const VISIBILITIES_CHANGED = 'visiblities/VISIBILITIES_CHANGED';

// Retrieve the user's preferences from storage. We do this on page
// load to create the store.
export function retrieveOptions({ store }) {
  // Use whichever storage we can access
  const storage = chrome.storage.sync || chrome.storage.local;

  // We'll build state from these objects
  const visibilities = {};
  const preferences = {};

  // Retrieve options from storage and build visibility/preference
  // objects
  storage.get(null, options => {
    Object.keys(options).forEach(key => {
      const id = IDS[key];

      // Decide what kind of value we're dealing with: search field
      // visibility or general preference?
      if (id) {
        const display = options[key] ? 'block' : 'none';
        visibilities[id] = display;
      } else {
        preferences[key] = options[key];
      }

      // Dispatch actions
      store.dispatch({ type: VISIBILITIES_CHANGED, payload: visibilities });
      store.dispatch({ type: PREFERENCES_CHANGED, payload: preferences });
    });
  });
}

// Listen for changes to the options in storage.
export function listenForStorageChanges({ store }) {
  chrome.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(change => {
      // Get the searchfield's ID
      const id = IDS[change];

      // Is this a change to a visibility preference?
      if (id) {
        return handleVisibilityChange({ change, changes, id, store });
      } else {
        return handlePreferenceChange({ change, changes, store });
      }
    });
  });
}

export function handlePreferenceChange({ change, changes, store }) {
  const { newValue } = changes[change];
  const { preferences } = store;

  if (['search-descriptions'].includes(change)) {
    // Trigger a keyup on all searchfields to re-filter items
    Object.keys(IDS).forEach(k => {
      const id = IDS[k];
      const $el = $(`#${id}`);
      $el.trigger('keyup');
    });
  } else if (['alphabetize-qualities'].includes(change)) {
    // TODO: Decide how to handle changes to the preference. Should
    // we simply reload the qualities? That might be easiest.
  }

  // Dispatch an action
  return store.dispatch({
    type: PREFERENCES_CHANGED,
    payload: { ...preferences, [change]: newValue },
  });
}

export function handleVisibilityChange({ change, changes, id, store }) {
  const { visibilities } = store;

  // Set the display value
  const display = changes[change].newValue ? 'block' : 'none';
  $(`#${id}`).css({ display });

  // If we're hiding the searchfield, then we need to clear it first
  // so that the user isn't stuck with, e.g., an empty list that they
  // can't change. We then need to trigger the keyup event manually.
  if (!changes[change].newValue) {
    $(`#${id}`)
      .val('')
      .trigger('keyup');
  }

  // Dispatch an action
  return store.dispatch({
    type: VISIBILITIES_CHANGED,
    payload: { ...visibilities, id: display },
  });
}
