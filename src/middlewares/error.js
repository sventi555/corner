const logger = require('../logger');

function errorMiddleware() {
    return (err, req, res, next) => {

        if (err.isJoi || err.code && err.code < 500) {
            const msg = 'the beans have been spilled';
            const code = err.code ? err.code : 400;
            res.status(code).send(msg);
        } else {
            logger.error(err);
            res.sendStatus(500);
        }

        return next();
    };
}

module.exports = {errorMiddleware};
