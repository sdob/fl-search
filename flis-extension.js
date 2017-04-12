(() => {
  const DEBUG = true;

  const IDS = {
    'outfit': 'js-flis__outfit',
    'inventory': 'js-flis__inventory',
    'scrapbook': 'js-flis__scrapbook',
    'qualities': 'js-flis__qualities',
  };

  const preferences = {
    // Search descriptions, or just names?
    'search-descriptions': false,
  };

  // These are our visibilities; by storing them here we can handle changes
  // to preferences in the menu even when the user isn't on 'Myself' tab.
  const visibilities = {};

  // Register observers
  registerScrapbookAndMantelObserver();
  registerItemObserver();
  registerQualitiesObserver();

  // Grab visibilities and options from storage
  retrieveOptions();

  // Listen for changes to the stored preferences
  listenForStorageChanges();

  function registerScrapbookAndMantelObserver() {
    // The UI uses the same ID for both scrapbook and mantelpiece modals,
    // so this observer and callback will handle things fine.
    const rootNode = document.getElementById('quality-chooser');
    const queries = [{ element: '*' }];
    return new MutationSummary({
      rootNode,
      callback,
      queries,
    });

    function callback(summaries) {
      const id = IDS.scrapbook;
      if ($('.qualities li').length) {
        $(`#${id}`).length || insertSearchField({
          id,
          siblingSelector: '#quality-chooser h3',
          listSelector: '.qualities',
        });
      }
    }
  }

  function registerItemObserver() {
    // We don't need to go any higher in the DOM than #mainContentViaAjax.
    const rootNode = document.getElementById('mainContentViaAjax');
    const queries = [{ element: '*' }];

    return new MutationSummary({
      rootNode,
      callback,
      queries,
    });

    function callback(summaries) {
      // Check whether our siblings are present
      if ($('.inventory-header-and-button').length && $('.you_bottom_rhs .explanation').length) {
        // Add a search field for equippable items
        $(`#${IDS.outfit}`).length || insertSearchField({
          siblingSelector: '.inventory-header-and-button',
          id: IDS.outfit,
          listSelector: '.me-profile-slot-items, .me-profile-slot',
          emptyIconClass: 'slot-item-empty',
        });

        // Add a search field for unequippable items
        $(`#${IDS.inventory}`).length || insertSearchField({
          siblingSelector: '.you_bottom_rhs .explanation',
          id: IDS.inventory,
          listSelector: '.you_bottom_rhs .you_icon',
          emptyIconClass: 'empty-icon',
        });
      }
    }
  }

  function registerQualitiesObserver() {
    const rootNode = document.getElementById('mainContentViaAjax');
    const queries = [{ element: '.you_bottom_lhs' }];
    return new MutationSummary({
      rootNode,
      callback,
      queries,
    });

    function callback() {
      if ($('.you_bottom_lhs').length) {
        // Insert the search field
        $(`#${IDS.qualities}`).length || insertSearchField({
          siblingSelector: '.you_bottom_lhs h2 + div',
          id: IDS.qualities,
          listSelector: '.you_bottom_lhs .qualitiesToggleDiv',
          onFiltered,
        });

        // Check whether we have populated fields, and load
        // them if we don't. Firefox doesn't seem to want to let us
        // call contentsDiv.load() ourselves, so we'll dispatch a
        // click event instead.
        $('.you_bottom_lhs h3.qualityCategory').each(function() {
          const contentsDiv = $(this).next();

          // Check whether the category div is empty (if it's not, then
          // we don't need to load the categories).
          if (contentsDiv.is(':empty')) {
            // We click once to get FL to make the AJAX request for this category's
            // qualities.
            $(this).click();

            // Then we go through the motions of closing the category again.
            // Dispatching a second click immediately would cause the UI
            // to make the AJAX request a second time (because the element's
            // still empty), so we'll do the toggling ourselves instead.

            // Show the 'expand' button
            $(this).children('.expand').toggle();
            // Hide the 'contract' button
            $(this).children('.contract').toggle();
            // Hide the contents div
            $(this).next().toggle();
          }
        });
      }

      // Once we've done the visibility filtering, we want to open/close
      // the categories so that any matching qualities are visible.
      function onFiltered({ searchString }) {
        // If the search string is non-empty, then loop through the quality
        // categories, opening the ones that should not be hidden (we don't
        // need to close the hidden divs explicitly, since they're invisible
        // and they'll be re-closed when the search field is emptied).
        if (searchString !== '') {
          return $('.you_bottom_lhs h3.qualityCategory').each(function() {
            if (!$(this).hasClass('flis-hidden') && categoryIsHidden($(this))) {
              $(this).click();
            }
          });
        }

        // Otherwise, the search string has become empty, so we should just fold
        // closed all categories.
        return $('.you_bottom_lhs h3.qualityCategory').each(function() {
          if (!categoryIsHidden($(this))) {
            $(this).click();
          }
        });
      }

      function categoryIsHidden(el) {
        return $(el).next().css('display') === 'none';
      }
    }
  }

  // Retrieve the user's preferences from storage.
  function retrieveOptions() {
    // Use whichever storage we can access
    const storage = chrome.storage.sync || chrome.storage.local;
    // Retrieve visibilities and options from storage
    storage.get(null, (options) => {
      Object.keys(options).forEach((key) => {
        const id = IDS[key];
        if (id) {
          const display = options[key] ? 'block' : 'none';
          visibilities[id] = display;
        } else {
          preferences[key] = options[key];
        }
      });
    });
  }

  // Listen for changes to the options in storage. We don't need to
  // have any actual communication between the popup and the content
  // script.
  function listenForStorageChanges() {
    chrome.storage.onChanged.addListener((changes) => {
      Object.keys(changes).forEach((change) => {
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
            $(`#${id}`).val('').trigger('keyup');
          }
        } else {
          if (['search-descriptions'].includes(change)) {
            // Cache preferences
            preferences[change] = changes[change].newValue;
            // Trigger a keyup on all searchfields to re-filter items
            Object.keys(IDS).forEach((k) => {
              const id = IDS[k];
              const $el = $(`#${id}`);
              $el.trigger('keyup');
            });
          }
        }
      });
    });
  }

  function insertSearchField({
    id,
    siblingSelector,
    listSelector,
    emptyIconClass,
    onFiltered,
  }) {
    const inputHtml = `
      <div class="flis-search__container">
        <input
          id="${id}"
          class="flis-search__input"
          style="display: ${visibilities[id]}"
          type="text"
          placeholder="Search"
        />
      </div>
    `;
    // Insert the HTML after the sibling
    $(siblingSelector).after(inputHtml);

    // Add a keyup event listener to filter children
    // of matching lists
    $(`#${id}`).keyup((evt) => {
      const searchString = $(`#${id}`).val();
      filterItems({ listSelector, searchString, emptyIconClass });
      // If we have a callback to run after items are filtered, then
      // run it now
      if (typeof onFiltered === 'function') {
        onFiltered({
          searchString,
        });
      }
    });
  }

  /*
   * Filter the <li> children of 'listSelector', showing them
   * if their names include the searched-for string (case-insensitive).
   * Elements with the class 'emptyIconClass' will be hidden while
   * filtering.
   */
  function filterItems({
    listSelector,
    searchString,
    emptyIconClass,
  }) {
    // Iterate over each category (<ul> matching the selector)
    $(listSelector).each(function() {
      // Handle each item within the category
      $(this).children().each(function() {
        // If we're actively filtering, then we want to hide
        // empty slots
        if ($(this).hasClass(emptyIconClass)) {
          if (searchString !== '') {
            $(this).addClass('flis-hidden');
          } else {
            $(this).removeClass('flis-hidden');
          }
          return;
        }

        // Now search non-empty elements
        if (preferences['search-descriptions']) {
          // This is pretty straightforward stuff
          if ($(this).text().toLowerCase().includes(searchString.toLowerCase())) {
            $(this).removeClass('flis-hidden');
          } else {
            $(this).addClass('flis-hidden');
          }
        } else {
          // The first <strong> element we find
          // is the item's name and quantity info
          // (usable items have a second <strong>)
          const el = $(this).find('strong')[0];

          // We're trying to extract the item's name,
          // ignoring quantity
          const pat = /(?:[\d]+ x )?(.+)/;
          // Convert to lower-case (so that we can do a
          // case-insensitive comparison with the search string)
          const match = pat.exec(el.innerText.toLowerCase());
          // If we have a regex match and it contains the
          // search string, then ensure it's displayed
          if (match && match[1] && match[1].includes(searchString.toLowerCase())) {
            $(this).removeClass('flis-hidden');
          } else {
            // Otherwise, hide the element
            $(this).addClass('flis-hidden');
          }
        }
      });

      // If every item in the category is hidden, then
      // hide the category too.
      if ($(this).children().length === $(this).children('.flis-hidden').length) {
        $(this).addClass('flis-hidden');
        // In the inventory section, the category name is the list's
        // previous sibling, so hide that too
        if ($(this).prev().prop('tagName') === 'H3') {
          $(this).prev().addClass('flis-hidden');
          const categoryName = $(this).prev().text().trim();
        }
      } else {
        $(this).removeClass('flis-hidden');
        $(this).prev().removeClass('flis-hidden');
      }
    });
  }

  /*
   * If we're in debug mode, then log messages to the console
   */
  function log(message) {
    if (DEBUG) {
      console.log(`FLIS: ${message}`);
    }
  }
})();
