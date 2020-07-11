const fs = require('fs');
const path = require('path');

const hb = require('handlebars');

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

module.exports = { makeHbTemplate };
