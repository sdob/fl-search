(() => {
  // These are our search fields
  const searchfields = ['outfit', 'inventory', 'scrapbook', 'qualities'];

  // Load saved options
  document.addEventListener('DOMContentLoaded', loadOptions);

  // Set event listeners on each option checkbox
  document.querySelectorAll('.flis-options__input').forEach(setCheckboxChangeListener);

  const storage = chrome.storage.sync || chrome.storage.local;

  /*
   * Load options from storage, or set defaults (all true)
   */
  function loadOptions() {
    storage.get(null, (options) => {
      // Set defaults if we're loading for the first time
      if (!Object.keys(options).length) {
        searchfields.forEach((k) => {
          options[k] = true;
        });
      }

      // Set checkboxes in UI
      searchfields.forEach((searchfield) => {
        // Find the checkbox that controls this field's visibility
        const el = document.querySelector(`[data-searchfield="${searchfield}"]`)
        // Set checkbox value (if we found it)
        if (el) {
          el.checked = options[searchfield];
        }
      });

      // Save to storage
      storage.set(options);
    });
  }

  /*
   * Set an onchange listener on an element
   */
  function setCheckboxChangeListener(el) {
    // When the checkbox value changes, update the option's stored value
    el.onchange = (evt) => {
      // Get the search field from the element's attributes
      const searchfield = el.getAttribute('data-searchfield');

      // If it's there (it should be), then save it
      // (this will dispatch an event that the content script will hear)
      if (searchfield) {
        storage.set({ [searchfield]: evt.target.checked });
      }
    };
  }
})();
