const {MongoClient} = require('mongodb');

const url = process.env.MONGO_URL;

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
