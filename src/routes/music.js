const basicAuth = require('express-basic-auth');
const multer = require('multer');

const {getClient} = require('../db');
const {makeHbTemplate} = require('../hbUtils');
const {validate, joi} = require('../middlewares/validation');

const {CORNER_PASSWORD} = process.env;

function musicRoutes(app) {
    const PAGE_SIZE = 50;

    const musicTemplate = makeHbTemplate(__dirname, '../templates/music/music.hbs');
    const musicUpload = multer({dest: 'media/music'});

    app.get('/music', validate({query: joi.object({page: joi.number().integer().min(0)})}), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        const pageNum = req.query.page ? parseInt(req.query.page) : 0;

        try {
            const songs = await client.db('corner').collection('songs').find({}).sort('timestamp', -1).skip(PAGE_SIZE * pageNum).limit(PAGE_SIZE).toArray();

            // if (songs.length === 0) return next();

            let isLastPage = false;
            if (songs.length < PAGE_SIZE) {
                isLastPage = true;
            } else {
                const nextPageSongs = await client.db('corner').collection('songs').find({}).sort('timestamp', -1).skip(PAGE_SIZE * (pageNum + 1)).limit(1).toArray();
                if (nextPageSongs.length == 0) isLastPage = true;
            }

            res.send(musicTemplate({songs, pageNum, isLastPage}));
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
