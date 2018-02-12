// These are our search fields
const searchfields = ['outfit', 'inventory', 'scrapbook', 'qualities'];

// These are our more advanced options
const advancedOptions = ['search-descriptions'];

// Load saved options
document.addEventListener('DOMContentLoaded', loadOptions);

// Set event listeners on each option checkbox
document
  .querySelectorAll('.flis-options__input')
  .forEach(setCheckboxChangeListener);

const storage = chrome.storage.sync || chrome.storage.local;

/*
 * Load options from storage, or set defaults (all true)
 */
function loadOptions() {
  storage.get(null, options => {
    // Set searchfield checkbox states
    searchfields.forEach(searchfield => {
      // Default to true if we don't already have the key
      if (!Object.keys(options).includes(searchfield)) {
        options[searchfield] = true;
      }
      // Find the checkbox that controls this field's visibility
      const el = document.querySelector(`[data-searchfield="${searchfield}"]`);
      // Set checkbox value (if we found it)
      if (el) {
        el.checked = options[searchfield];
      }
    });

    // Save to storage
    storage.set(options);

    // Set advanced options (default to false)
    advancedOptions.forEach(option => {
      if (!Object.keys(options).includes(option)) {
        options[option] = false;
      }
      // Find the checkbox
      const el = document.querySelector(`[data-option="${option}"]`);
      if (el) {
        el.checked = options[option];
      }
    });

    storage.set(options);
  });
}

/*
 * Set an onchange listener on an element
 */
function setCheckboxChangeListener(el) {
  // When the checkbox value changes, update the option's stored value
  el.onchange = evt => {
    // If this is a searchfield checkbox, update storage
    const searchfield = el.getAttribute('data-searchfield');
    if (searchfield) {
      return storage.set({ [searchfield]: evt.target.checked });
    }

    // Otherwise, it's an advanced option; update storage
    const option = el.getAttribute('data-option');
    if (option) {
      return storage.set({ [option]: evt.target.checked });
    }
  };
}
