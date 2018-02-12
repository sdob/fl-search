import { createStore } from 'redux';

import reducer from './reducer';
import style from './style.scss'; // eslint-disable-line no-unused-vars
import registerItemObserver from './registerItemObserver';
import registerQualitiesObserver from './registerQualitiesObserver';
import registerScrapbookAndMantelObserver from './registerScrapbookAndMantelObserver';
import { listenForStorageChanges, retrieveOptions } from './actions';
import log from './log';

log('Detecting legacy/new state');
const legacy =
  [...document.querySelectorAll('script')].filter(
    x => x.getAttribute('src') && x.getAttribute('src').indexOf('ui26.js') >= 0,
  ).length > 0;
if (legacy) {
  log('Legacy UI detected');
} else {
  log('Looks new to me');
}

const store = createStore(reducer);

// Register observers
registerScrapbookAndMantelObserver();
registerItemObserver({ store });
registerQualitiesObserver({ store });

// Grab visibilities and options from storage
retrieveOptions({ store });

// Listen for changes to the stored preferences
listenForStorageChanges({ store });
