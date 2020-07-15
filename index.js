require('dotenv').config();
const express = require('express');

const {getClient} = require('./src/db');
const logger = require('./src/logger');
const {errorMiddleware} = require('./src/middlewares/error');
const {loggingMiddleware} = require('./src/middlewares/logging');
const musicRoutes = require('./src/routes/music');
const questionsRoutes = require('./src/routes/questions');
const {registerPartial} = require('./src/utils');

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

    registerPartial('defaultHead', __dirname, './src/templates/partials/default-head.hbs');

    musicRoutes(app);
    questionsRoutes(app);

    app.use(errorMiddleware());
    app.use((req, res, next) => {
        if (!res.headersSent) {
            res.status(404).send('yeesh, where did I put my glasses');
        }
        return next();
    });
    app.use(loggingMiddleware());

    app.listen(3000);
})();
