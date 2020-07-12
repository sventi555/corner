const fs = require('fs');
const path = require('path');

const hb = require('handlebars');

/**
 * Converts epoch time to a readable date/time string (ex. July 12, 2020 3:27 PM).
 *
 * @param {int} ms - The timestamp to be converted (in ms).
 *
 * @returns {string} A date/time string.
 */
function goodTime(ms) {
    const date = new Date(ms);
    const time = date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    const day = date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});

    return `${day} ${time}`;
}

/**
 * Creates a handlebars template object from the specified file.
 *
 * @param {string} dirname - The directory in which the caller resides.
 * @param {string} relativePathToTemplate - The path to the template relative to the caller file.
 *
 * @return {any} A compiled handlebars template.
 */
function makeHbTemplate(dirname, relativePathToTemplate) {
    return hb.compile(fs.readFileSync(path.join(dirname, relativePathToTemplate), 'utf8'));
}

module.exports = {goodTime, makeHbTemplate};
