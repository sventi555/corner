const {makeHbTemplate} = require('../hbUtils');

function homeRoute(app) {
    const homeTemplate = makeHbTemplate(__dirname, '../templates/home.hbs');
    app.get('/', (req, res, next) => {
        res.send(homeTemplate({}));
        return next();
    });
}

module.exports = homeRoute;
