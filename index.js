require('dotenv').config();
const express = require('express');

const {getClient} = require('./src/db');
const initHb = require('./src/initHb');
const logger = require('./src/logger');
const {errorMiddleware} = require('./src/middlewares/error');
const {loggingMiddleware} = require('./src/middlewares/logging');
const notFoundRoute = require('./src/routes/not-found');
const musicRoutes = require('./src/routes/music');
const questionsRoutes = require('./src/routes/questions');

(async () => {
    // check mongo connection
    let client;
    try {
        client = await getClient();
        await client.db('corner').stats();
        await client.close();
    } catch(err) {
        logger.error(err);
        process.exit(1);
    }

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use(express.static('./media'));
    app.use(express.static('./src/static'));

    initHb();

    musicRoutes(app);
    questionsRoutes(app);

    app.use(errorMiddleware());
    notFoundRoute(app);
    app.use(loggingMiddleware());

    app.listen(3000);
})();
