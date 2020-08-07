const {ObjectID} = require('mongodb');
const multer = require('multer');

const {getClient} = require('../db');
const {makeHbTemplate} = require('../hbUtils');
const authMiddleware = require('../middlewares/basic-auth');
const {validate, joi} = require('../middlewares/validation');

function musicRoutes(app) {
    const PAGE_SIZE = 50;

    const storage = multer.diskStorage({
        destination: 'media/music',
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname.replace(' ', '-'));
        }
    });
    const musicUpload = multer({storage});

    const musicTemplate = makeHbTemplate(__dirname, '../templates/music/music.hbs');
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

            if (songs.length === 0) return next();

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
    app.get('/music-upload', authMiddleware(), async (req, res, next) => {
        res.send(uploadTemplate({}));
        return next();
    });

    app.post('/api/music', authMiddleware(), musicUpload.single('song'), async (req, res, next) => {
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

    app.delete('/api/music/:id', authMiddleware(),
        validate({
            params: joi.object({
                id: joi.string().length(24)
            })
        }),
        async (req, res, next) => {
            let client;
            try {
                client = await getClient();
            } catch (err) {
                return next(err);
            }

            try {
                await client.db('corner').collection('songs').deleteOne({'_id': ObjectID(req.params.id)});

                res.status(204).send();
                return next();
            } catch(err) {
                return next(err);
            } finally {
                client.close();
            }
        }
    );
}

module.exports = musicRoutes;
