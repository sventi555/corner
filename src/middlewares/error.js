const logger = require('../logger');

function errorMiddleware() {
    return (err, req, res, next) => {

        if (err.isJoi || err.code && err.code < 500) {
            const msg = 'the beans have been spilled';
            res.status(400).send(msg);
        } else {
            logger.error(err);
            res.sendStatus(500);
        }

        return next();
    };
}

module.exports = {errorMiddleware};
