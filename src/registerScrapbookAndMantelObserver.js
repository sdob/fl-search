import $ from 'jquery';
import MutationSummary from 'mutation-summary';
import { IDS } from './ids';
import insertSearchField from './insertSearchField';

export default function registerScrapbookAndMantelObserver() {
  // The UI uses the same ID for both scrapbook and mantelpiece modals,
  // so this observer and callback will handle things fine.
  const rootNode = document.getElementById('quality-chooser');
  const queries = [{ element: '*' }];
  return new MutationSummary({
    rootNode,
    callback,
    queries,
  });
}
export function callback(summaries) {
    const id = IDS.scrapbook;
    if ($('div.ui-dialog .qualities li').length) {
      $(`#${id}`).length || insertSearchField({
        id,
        siblingSelector: '#quality-chooser h3',
        listSelector: 'div.ui-dialog .qualities',
      });
    }
  }
