import $ from 'jquery';
import MutationSummary from 'mutation-summary';

import { IDS } from './ids';
import insertSearchField from './insertSearchField';

export default function registerQualitiesObserver({ store }) {
  const rootNode = document.getElementById('mainContentViaAjax');
  const queries = [{ element: '.you_bottom_lhs' }];
  return new MutationSummary({
    rootNode,
    callback,
    queries,
  });

  function callback() {
    if (document.querySelector('.you_bottom_lhs')) {
      const { visibilities } = store.getState();
      // Insert the search field
      if (!document.querySelector(`#${IDS.qualities}`)) {
        insertSearchField({
          store,
          visibilities,
          siblingSelector: '.you_bottom_lhs h2 + div',
          id: IDS.qualities,
          listSelector: '.you_bottom_lhs .qualitiesToggleDiv',
          onFiltered,
        });
      }

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
          $(this)
            .children('.expand')
            .toggle();
          // Hide the 'contract' button
          $(this)
            .children('.contract')
            .toggle();
          // Hide the contents div
          $(this)
            .next()
            .toggle();
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
      return (
        $(el)
          .next()
          .css('display') === 'none'
      );
    }
  }
}
