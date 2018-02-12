import MutationSummary from 'mutation-summary';
import insertSearchField from './insertSearchField';
import { IDS } from './ids';

export default function registerItemObserver({ store }) {
  // We don't need to go any higher in the DOM than #mainContentViaAjax.
  const rootNode = document.getElementById('mainContentViaAjax');
  const queries = [{ element: '*' }];

  return new MutationSummary({
    rootNode,
    callback,
    queries,
  });

  function callback() {
    // Check whether our siblings are present
    if (
      document.querySelector('.inventory-header-and-button') &&
      document.querySelector('.you_bottom_rhs .explanation')
    ) {
      // Add a search field for equippable items
      if (!document.querySelector(`#${IDS.outfit}`)) {
        insertSearchField({
          store,
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
          siblingSelector: '.you_bottom_rhs .explanation',
          id: IDS.inventory,
          listSelector: '.you_bottom_rhs .you_icon',
          emptyIconClass: 'empty-icon',
        });
      }
    }
  }
}
