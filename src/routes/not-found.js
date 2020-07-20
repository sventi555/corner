const {makeHbTemplate} = require('../hbUtils');

function notFoundRoute(app) {
    const errorTemplate = makeHbTemplate(__dirname, '../templates/error.hbs');
    app.use((req, res, next) => {
        if (!res.headersSent) {
            res.status(404).send(errorTemplate({error: 'yeesh, where did I put my glasses'}));
        }
        return next();
    });
}

module.exports = notFoundRoute;
