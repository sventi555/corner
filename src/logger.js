const winston = require('winston');

const logger = winston.createLogger({
    level: 'http',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
