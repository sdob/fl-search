const DEBUG = true;
const observer = registerObserver();

function registerObserver() {
  // We don't need to go any higher in the DOM than #mainContentViaAjax.
  // This will 
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
      $('#js-flis__equippable').length || insertSearchField({
        siblingSelector: '.inventory-header-and-button',
        id: 'js-flis__equippable',
        listSelector: '.me-profile-slot-items, .me-profile-slot',
        emptyIconClass: 'slot-item-empty',
      });

      // Add a search field for unequippable items
      $('#js-flis__inventory').length || insertSearchField({
        siblingSelector: '.you_bottom_rhs .explanation',
        id: 'js-flis__inventory',
        listSelector: '.you_bottom_rhs .you_icon',
        emptyIconClass: 'empty-icon',
      });
    }
  }
}

/*
 * If we're in debug mode, then log messages to the console
 */
function log(message) {
  if (DEBUG) {
    console.debug(`FLIS: ${message}`);
  }
}

function insertSearchField({
  id,
  siblingSelector,
  listSelector,
  emptyIconClass,
}) {
  const inputHtml = `
    <div class="flis-search__container">
      <input
        id="${id}"
        class="flis-search__input"
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
      const pat = /[\d]+ x ([ a-zA-z]+)/;
      if (el) {
        // Convert to lower-case (so that we can do a
        // case-insensitive comparison with the search string)
        const match = pat.exec(el.innerText.toLowerCase());
        // If we have a regex match and it contains the
        // search string, then ensure it's displayed
        if (match && match[1] && match[1].includes(searchString)) {
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
