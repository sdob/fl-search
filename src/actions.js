import $ from 'jquery';
import { IDS } from './ids';

export const PREFERENCES_CHANGED = 'storage/PREFERENCES_CHANGED';
export const VISIBILITIES_CHANGED = 'visiblities/VISIBILITIES_CHANGED';

// Retrieve the user's preferences from storage.
export function retrieveOptions({ store }) {
  // Use whichever storage we can access
  const storage = chrome.storage.sync || chrome.storage.local;

  // We'll build state from these objects
  const visibilities = {};
  const preferences = {};

  // Retrieve visibilities and options from storage
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

// Listen for changes to the options in storage. We don't need to
// have any actual communication between the popup and the content
// script.
export function listenForStorageChanges({ store }) {
  chrome.storage.onChanged.addListener(changes => {
    const { preferences, visibilities } = store.getState();

    Object.keys(changes).forEach(change => {
      // Get the searchfield's ID
      const id = IDS[change];

      if (id) {
        // Set the display value
        const display = changes[change].newValue ? 'block' : 'none';
        $(`#${id}`).css({ display });

        // Update our store
        visibilities[id] = display;

        // If we're hiding the searchfield, then we need to clear it first
        // so that the user isn't stuck with, e.g., an empty list that they
        // can't change. We then need to trigger the keyup event manually.
        if (!changes[change].newValue) {
          $(`#${id}`)
            .val('')
            .trigger('keyup');
        }

        // Dispatch an action
        store.dispatch({
          type: VISIBILITIES_CHANGED,
          payload: { ...visibilities, id: display },
        });
      } else {
        if (['search-descriptions'].includes(change)) {
          // Cache preferences
          const { newValue } = changes[change];
          // Trigger a keyup on all searchfields to re-filter items
          Object.keys(IDS).forEach(k => {
            const id = IDS[k];
            const $el = $(`#${id}`);
            $el.trigger('keyup');
          });

          // Dispatch an action
          store.dispatch({
            type: PREFERENCES_CHANGED,
            payload: { ...preferences, [change]: newValue },
          });
        }
      }
    });
  });
}
