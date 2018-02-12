import $ from 'jquery';

import log from './log';

/*
 * Filter the <li> children of 'listSelector', showing them
 * if their names include the searched-for string (case-insensitive).
 * Elements with the class 'emptyIconClass' will be hidden while
 * filtering.
 */

export default function filterItems({
  listSelector,
  searchString,
  emptyIconClass,
  store,
}) {
  log(
    `filtering with selector '${listSelector}', searchString ${searchString}`,
  );
  // Iterate over each category (<ul> matching the selector)
  $(listSelector).each(function() {
    // Handle each item within the category
    $(this)
      .children()
      .each(function() {
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

        const { preferences } = store.getState();

        // Now search non-empty elements
        if (preferences['search-descriptions']) {
          // This is pretty straightforward stuff
          if (
            $(this)
              .text()
              .toLowerCase()
              .includes(searchString.toLowerCase())
          ) {
            $(this).removeClass('flis-hidden');
          } else {
            $(this).addClass('flis-hidden');
          }
        } else {
          // The first <strong> element we find
          // is the item's name and quantity info
          // (usable items have a second <strong>)
          const el = $(this).find('strong')[0];

          // We may not be able to find it (e.g., Lilac's Inclination
          // is bugged)
          if (!el) {
            return;
          }

          // We're trying to extract the item's name,
          // ignoring quantity
          const pat = /(?:[\d]+ x )?(.+)/;
          // Convert to lower-case (so that we can do a
          // case-insensitive comparison with the search string)
          const match = pat.exec(el.innerText.toLowerCase());
          // If we have a regex match and it contains the
          // search string, then ensure it's displayed
          if (
            match &&
            match[1] &&
            match[1].includes(searchString.toLowerCase())
          ) {
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
      if (
        $(this)
          .prev()
          .prop('tagName') === 'H3'
      ) {
        $(this)
          .prev()
          .addClass('flis-hidden');
        const categoryName = $(this)
          .prev()
          .text()
          .trim();
      }
    } else {
      $(this).removeClass('flis-hidden');
      $(this)
        .prev()
        .removeClass('flis-hidden');
    }
  });
}
