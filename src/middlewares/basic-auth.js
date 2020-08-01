const basicAuth = require('express-basic-auth');

const CORNER_PASSWORD = process.env.CORNER_PASSWORD;

function basicAuthMiddleware() {
    return basicAuth({challenge: true, users:{'admin': CORNER_PASSWORD}});
}

module.exports = basicAuthMiddleware;
