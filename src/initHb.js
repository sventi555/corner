const {registerHelper, registerPartial} = require('./hbUtils');

/**
 * Initializes handlebars with helpers and partials.
 */
function initHb() {
    registerHelper('add', (a, b) => a + b);

    registerPartial('default', __dirname, './templates/partials/default.hbs');
    registerPartial('goodTime', __dirname, './templates/partials/good-time.hbs');
}

module.exports = initHb;
