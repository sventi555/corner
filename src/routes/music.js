const basicAuth = require('express-basic-auth');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');

const {makeHbTemplate} = require('../utils');

function musicRoutes(app) {
    const musicTemplate = makeHbTemplate(__dirname, '../templates/music.hbs');
    const musicUpload = multer({ dest: 'media/music' });

    app.get('/music', async (req, res, next) => {
        let client;
        try {
            client = await MongoClient.connect(process.env.MONGO_URL);
        } catch (err) {
            return next(err);
        }

        try {
            const songs = await client.db('corner').collection('songs').find().sort('timestamp', -1).limit(100).toArray();

            res.send(musicTemplate({ songs }));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.post('/api/music', basicAuth({ users:{'admin': process.env.CORNER_PASSWORD} }), musicUpload.single('song'), async (req, res, next) => {
        const receivedAt = Date.now();

        let client;
        try {
            client = await MongoClient.connect(process.env.MONGO_URL);
        } catch (err) {
            return next(err);
        }

        try {
            const songs = client.db('corner').collection('songs');
            await songs.insertOne({timestamp: receivedAt, originalName: req.file.originalname, filename: req.file.filename});

            res.sendStatus(200);
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });
}

module.exports = musicRoutes;
