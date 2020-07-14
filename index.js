const express = require('express');

const {getClient} = require('./src/db');
const {errorMiddleware} = require('./src/middlewares/error');
const {loggingMiddleware} = require('./src/middlewares/logging');
const musicRoutes = require('./src/routes/music');
const questionsRoutes = require('./src/routes/questions');

require('dotenv').config();

(async () => {
    // check mongo connection
    let client;
    try {
        client = await getClient();
        await client.db('corner').stats();
        await client.close();
    } catch(err) {
        // TODO add logging here for failure
        process.exit(1);
    }

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use(express.static('./media'));
    app.use(express.static('./static'));

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
