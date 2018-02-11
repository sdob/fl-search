import $ from 'jquery';

import filterItems from './filterItems';

export default function insertSearchField({
  id,
  siblingSelector,
  listSelector,
  emptyIconClass,
  onFiltered,
  store,
  visibilities,
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
    filterItems({ listSelector, searchString, emptyIconClass, store });
    // If we have a callback to run after items are filtered, then
    // run it now
    if (typeof onFiltered === 'function') {
      onFiltered({
        searchString,
      });
    }
  });
}

