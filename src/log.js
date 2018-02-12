/* eslint-disable no-console */
const DEBUG = true;

/* * If we're in debug mode, then log messages to the console */
export default function log(message) {
  if (DEBUG) {
    console.log(`FLIS: ${message}`);
  }
}
