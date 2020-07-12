const logger = require('../logger');

function loggingMiddleware() {
    return (req, res, next) => {
        if (res.headersSent) {
            logger.http(res.statusCode + ' - ' + req.originalUrl);
        }
        return next();
    };
}

module.exports = {loggingMiddleware};
