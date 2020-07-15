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
 * @return A compiled handlebars template.
 */
function makeHbTemplate(dirname, relativePathToTemplate) {
    return hb.compile(fs.readFileSync(path.join(dirname, relativePathToTemplate), 'utf8'));
}

/**
 * Registers the specified partial for use in other templates.
 * Partial must be registered before use.
 *
 * @param {string} registerAs - The name to register the partial as.
 * @param {string} dirname - The directory in which the caller resides.
 * @param {string} relativePathToPartial - The path to the partial relative to the caller file.
 *
 */
function registerPartial(registerAs, dirname, relativePathToPartial) {
    hb.registerPartial(registerAs, fs.readFileSync(path.join(dirname, relativePathToPartial), 'utf8'));
}

module.exports = {goodTime, makeHbTemplate, registerPartial};
