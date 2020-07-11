const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const musicRoutes = require('./src/routes/music');
const questionsRoutes = require('./src/routes/questions');

require('dotenv').config();

(async () => {
    // check mongo connection
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGO_URL);
        // TODO maybe log the db stats as info??
        await client.db('corner').stats();
        await client.close();
    } catch(err) {
        // TODO add logging here for failure
        process.exit(1);
    }

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true}));

    app.use(express.static('./media'));
    app.use(express.static('./static'));

    musicRoutes(app);
    questionsRoutes(app);

    app.listen(3000);
})();
