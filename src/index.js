import MutationSummary from 'mutation-summary';
import $ from 'jquery';
import { createStore } from 'redux';

import reducer from './reducer';
import style from './style.scss';
import registerScrapbookAndMantelObserver from './registerScrapbookAndMantelObserver';
import { IDS } from './ids';
import filterItems from './filterItems';
import { listenForStorageChanges, retrieveOptions } from './actions';
import insertSearchField from './insertSearchField';

console.info('Detecting legacy/new state');
const legacy = [...document.querySelectorAll('script')]
  .filter(x => x.getAttribute('src') && x.getAttribute('src').indexOf('ui26.js') >= 0)
  .length > 0;
if (legacy) {
  console.info('Legacy UI detected');
} else {
  console.info('Looks new to me');
}

const preferences = {
  // Search descriptions, or just names?
  'search-descriptions': false,
};

const store = createStore(reducer);

// These are our visibilities; by storing them here we can handle changes
// to preferences in the menu even when the user isn't on 'Myself' tab.
const visibilities = {};

// Register observers
registerScrapbookAndMantelObserver();
registerItemObserver();
registerQualitiesObserver();

// Grab visibilities and options from storage
retrieveOptions({ store });

// Listen for changes to the stored preferences
listenForStorageChanges({ store });

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
    if (document.querySelector('.inventory-header-and-button')
      && document.querySelector('.you_bottom_rhs .explanation')) {
      // Add a search field for equippable items
      if (!document.querySelector(`#${IDS.outfit}`)) {
        insertSearchField({
          store,
          visibilities,
          siblingSelector: '.inventory-header-and-button',
          id: IDS.outfit,
          listSelector: '.me-profile-slot-items, .me-profile-slot',
          emptyIconClass: 'slot-item-empty',
        });
      }

      // Add a search field for unequippable items
      if (!document.querySelector(`#${IDS.inventory}`)) {
        insertSearchField({
          store,
          visibilities,
          siblingSelector: '.you_bottom_rhs .explanation',
          id: IDS.inventory,
          listSelector: '.you_bottom_rhs .you_icon',
          emptyIconClass: 'empty-icon',
        });
      }
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
    if (document.querySelector('.you_bottom_lhs')) {
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
