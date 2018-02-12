/* eslint-disable no-console */

/* * If we're in debug mode, then log messages to the console */
export default function log(message) {
  // eslint-disable-next-line no-undef
  if (DEBUG) {
    console.log(`FLIS: ${message}`);
  }
}
