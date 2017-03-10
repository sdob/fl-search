(() => {
  const DEBUG = true;

  const IDS = {
    'outfit': 'js-flis__outfit',
    'inventory': 'js-flis__inventory',
    'scrapbook': 'js-flis__scrapbook',
    'qualities': 'js-flis__qualities',
  };

  // These are our visibilities; by storing them here we can handle changes
  // to preferences even when the 'Myself' tab isn't there
  const visibilities = {};

  registerScrapbookAndMantelObserver();
  registerItemObserver();
  registerQualitiesObserver();
  retrieveVisibilities();
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
        $(`#${IDS.qualities}`).length || insertSearchField({
          siblingSelector: '.you_bottom_lhs h2 + div',
          id: IDS.qualities,
          listSelector: '.you_bottom_lhs .qualitiesToggleDiv',
        });

        // Check whether we have populated fields, and load
        // them if we don't
        $('.you_bottom_lhs h3.qualityCategory').each(function() {
          const contentsDiv = $(this).next();
          if (contentsDiv.is(':empty')) {
            const href = $(this).find('a').attr('href');
            contentsDiv.load(href);
          }
        });
      }
    }
  }

  function retrieveVisibilities() {
    // Use whichever storage we can access
    const storage = chrome.storage.sync || chrome.storage.local;
    // Retrieve visibilities from storage
    storage.get(null, (options) => {
      Object.keys(options).forEach((searchfield) => {
        const id = IDS[searchfield];
        if (id) {
          const display = options[searchfield] ? 'block' : 'none';
          visibilities[id] = display;
        }
      });
    });
  }

  function listenForStorageChanges() {
    // Listen for changes to the options in storage
    chrome.storage.onChanged.addListener((changes) => {
      Object.keys(changes).forEach((searchfield) => {
        // Get the searchfield's ID
        const id = IDS[searchfield];

        // Set the display value
        const display = changes[searchfield].newValue ? 'block' : 'none';
        $(`#${id}`).css({ display });

        // Update our store
        visibilities[id] = display;

        // If we're hiding the searchfield, then we need to clear it first
        // so that the user isn't stuck with, e.g., an empty list that they
        // can't change. We need to trigger the keyup event manually.
        if (!changes[searchfield].newValue) {
          $(`#${id}`).val('').trigger('keyup');
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
        onFiltered();
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
        }

        // The first <strong> element in the tooltip
        // is the item's name and quantity info
        // (usable items have a second <strong>)
        const el = $(this).find('.tt strong')[0];

        // We're trying to extract the item's name,
        // ignoring quantity
        const pat = /(?:[\d]+ x )?(.+)/;
        if (el) {
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
