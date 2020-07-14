const {MongoClient} = require('mongodb');

const user = process.env.MONGO_USERNAME;
const pass = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST ? process.env.MONGO_HOST : 'localhost';
const port = process.env.MONGO_PORT ? process.env.MONGO_PORT : 27017;
const url = process.env.MONGO_URL ? process.env.MONGO_URL : `mongodb://${user}:${pass}@${host}:${port}`;

/**
 *  Returns a promise resolving to a mongo client, or
 *
 * @throws Will throw an error when a client cannot be created.
 * @returns A client which can be used to connect to mongodb.
 */
async function getClient() {
    const client = await MongoClient.connect(url);

    return client;
}

module.exports = {getClient};
