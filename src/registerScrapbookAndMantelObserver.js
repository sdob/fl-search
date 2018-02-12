import $ from 'jquery';
import MutationSummary from 'mutation-summary';
import { IDS } from './ids';
import insertSearchField from './insertSearchField';

export default function registerScrapbookAndMantelObserver({ store }) {
  // The UI uses the same ID for both scrapbook and mantelpiece modals,
  // so this observer and callback will handle things fine.
  const rootNode = document.getElementById('quality-chooser');
  const queries = [{ element: '*' }];
  return new MutationSummary({
    rootNode,
    callback: callback({ store }),
    queries,
  });
}

export function callback({ store }) {
  return function() {
    const id = IDS.scrapbook;
    if ($('div.ui-dialog .qualities li').length) {
      $(`#${id}`).length ||
        insertSearchField({
          id,
          store,
          siblingSelector: '#quality-chooser h3',
          listSelector: 'div.ui-dialog .qualities',
        });
    }
  };
}
