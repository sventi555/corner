const fs = require('fs');
const path = require('path');

const hb = require('handlebars');

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
 * Registers fn as a handlebars helper under the provided name.
 *
 * @param {string} name - The name of the helper.
 * @param {function} fn - A valid handlebars helper function.
 */
function registerHelper(name, fn) {
    hb.registerHelper(name, fn);
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

module.exports = {makeHbTemplate, registerHelper, registerPartial};
