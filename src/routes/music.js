const basicAuth = require('express-basic-auth');
const multer = require('multer');

const {getClient} = require('../db');
const {makeHbTemplate} = require('../hbUtils');

const {CORNER_PASSWORD} = process.env;

function musicRoutes(app) {
    const musicTemplate = makeHbTemplate(__dirname, '../templates/music/music.hbs');
    const musicUpload = multer({dest: 'media/music'});

    app.get('/music', async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const songs = await client.db('corner').collection('songs').find().sort('timestamp', -1).limit(100).toArray();

            res.send(musicTemplate({songs}));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    const uploadTemplate = makeHbTemplate(__dirname, '../templates/music/music-upload.hbs');
    app.get('/music-upload', basicAuth({challenge: true, users:{'admin': CORNER_PASSWORD}}), async (req, res, next) => {
        res.send(uploadTemplate({}));
        return next();
    });

    app.post('/api/music', basicAuth({challenge: true, users:{'admin': CORNER_PASSWORD}}), musicUpload.single('song'), async (req, res, next) => {
        const receivedAt = Date.now();

        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const songs = client.db('corner').collection('songs');
            await songs.insertOne({
                timestamp: receivedAt,
                originalName: req.file.originalname,
                filename: req.file.filename,
                isVideo: req.file.mimetype.startsWith('video')
            });

            res.redirect('/music');
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });
}

module.exports = musicRoutes;
