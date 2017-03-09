(() => {
  // These are our search fields
  const searchfields = ['outfit', 'inventory', 'scrapbook'];

  // Load saved options
  document.addEventListener('DOMContentLoaded', loadOptions);

  // Set event listeners on each option checkbox
  document.querySelectorAll('.flis-options__input').forEach(setCheckboxChangeListener);

  /*
   * Load options from storage, or set defaults (all true)
   */
  function loadOptions() {
    chrome.storage.sync.get(null, (options) => {
      // Set defaults if we're loading for the first time
      if (!Object.keys(options).length) {
        searchfields.forEach((k) => {
          options[k] = true;
        });
      }

      // Set checkboxes in UI
      searchfields.forEach((searchfield) => {
        // Set checkbox value
        document.querySelector(`[data-searchfield="${searchfield}"]`).checked = options[searchfield];
      });

      // Save to storage
      chrome.storage.sync.set(options);
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
        chrome.storage.sync.set({ [searchfield]: evt.target.checked });
      }
    };
  }
})();
