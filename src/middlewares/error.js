const logger = require('../logger');
const {makeHbTemplate} = require('../hbUtils');


function errorMiddleware() {
    const errorTemplate = makeHbTemplate(__dirname, '../templates/error.hbs');
    return (err, req, res, next) => {

        if (err.isJoi || err.code && err.code < 500) {
            const error = 'the beans have been spilled';
            const code = err.code ? err.code : 400;
            res.status(code).send(errorTemplate({error}));
        } else {
            logger.error(err);
            res.sendStatus(500);
        }

        return next();
    };
}

module.exports = {errorMiddleware};
